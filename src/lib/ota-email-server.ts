import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { Resend } from "resend";
import type { EmailReceivedEvent } from "resend";
import {
  OTAEmailInboxRuntime,
  OTAEmailQueueItem,
  parseOTAEmail,
} from "@/lib/ota-email";

const PROVIDER = "resend_ota_email";
const MAX_QUEUE_ITEMS = 50;

function getConfiguration() {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim(),
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET?.trim(),
    inboxToken: process.env.KAIZER_OTA_INBOX_TOKEN?.trim(),
    databaseUrl: process.env.DATABASE_URL?.trim(),
  };
}

export function getOTAEmailRuntime(): OTAEmailInboxRuntime {
  const configuration = getConfiguration();
  const missingConfiguration = [
    !configuration.apiKey ? "RESEND_API_KEY" : "",
    !configuration.webhookSecret ? "RESEND_WEBHOOK_SECRET" : "",
    !configuration.inboxToken ? "KAIZER_OTA_INBOX_TOKEN" : "",
    !configuration.databaseUrl ? "DATABASE_URL" : "",
  ].filter(Boolean);

  return {
    provider: "RESEND",
    configured: missingConfiguration.length === 0,
    webhookPath: "/api/ota/email-inbox",
    missingConfiguration,
  };
}

export function isOTAInboxAuthorized(authorization: string | null) {
  const expected = getConfiguration().inboxToken;
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

function safeSubject(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 160);
}

function safeQueueItem(value: unknown): OTAEmailQueueItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  const item = payload.item;
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const candidate = item as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.eventId !== "string" ||
    (candidate.status !== "READY" && candidate.status !== "REVIEW") ||
    typeof candidate.subject !== "string" ||
    typeof candidate.receivedAt !== "string" ||
    typeof candidate.confidence !== "number"
  ) {
    return null;
  }
  return candidate as unknown as OTAEmailQueueItem;
}

async function getPrisma() {
  return (await import("@/lib/prisma")).prisma;
}

export async function listOTAEmailQueue() {
  const prisma = await getPrisma();
  const events = await prisma.webhookEvent.findMany({
    where: {
      provider: PROVIDER,
      status: { in: ["READY", "REVIEW"] },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_QUEUE_ITEMS,
    select: { payload: true },
  });

  return events
    .map((event) => safeQueueItem(event.payload))
    .filter((item): item is OTAEmailQueueItem => Boolean(item));
}

export async function acknowledgeOTAEmailQueue(eventIds: string[]) {
  const prisma = await getPrisma();
  return prisma.webhookEvent.updateMany({
    where: {
      provider: PROVIDER,
      eventId: { in: eventIds.slice(0, MAX_QUEUE_ITEMS) },
      status: { in: ["READY", "REVIEW"] },
    },
    data: {
      status: "IMPORTED",
      processedAt: new Date(),
    },
  });
}

function getWebhookHeaders(request: Request) {
  return {
    id: request.headers.get("svix-id") || "",
    timestamp: request.headers.get("svix-timestamp") || "",
    signature: request.headers.get("svix-signature") || "",
  };
}

async function recordAttempt(eventId: string, event: EmailReceivedEvent) {
  const prisma = await getPrisma();
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
    select: { status: true },
  });
  if (existing && ["READY", "REVIEW", "IMPORTED", "IGNORED"].includes(existing.status)) {
    return { prisma, duplicate: true };
  }

  const pendingPayload: Prisma.InputJsonObject = {
    providerEmailId: event.data.email_id,
    receivedAt: event.created_at,
  };
  await prisma.webhookEvent.upsert({
    where: { eventId },
    create: {
      provider: PROVIDER,
      eventType: event.type,
      eventId,
      payload: pendingPayload,
      status: "PENDING",
      attempts: 1,
    },
    update: {
      payload: pendingPayload,
      status: "PENDING",
      error: null,
      attempts: { increment: 1 },
    },
  });
  return { prisma, duplicate: false };
}

export async function processOTAEmailWebhook(request: Request) {
  const configuration = getConfiguration();
  if (!configuration.apiKey || !configuration.webhookSecret || !configuration.databaseUrl) {
    return {
      status: 503,
      body: {
        success: false,
        error: "The OTA email webhook is not configured on this server.",
      },
    };
  }

  const rawPayload = await request.text();
  const headers = getWebhookHeaders(request);
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return {
      status: 400,
      body: { success: false, error: "Missing Resend webhook signature headers." },
    };
  }

  const resend = new Resend(configuration.apiKey);
  let event;
  try {
    event = resend.webhooks.verify({
      payload: rawPayload,
      headers,
      webhookSecret: configuration.webhookSecret,
    });
  } catch {
    return {
      status: 400,
      body: { success: false, error: "Invalid Resend webhook signature." },
    };
  }

  if (event.type !== "email.received") {
    return {
      status: 200,
      body: { success: true, ignored: true },
    };
  }

  let prisma: Awaited<ReturnType<typeof getPrisma>> | undefined;
  try {
    const attempt = await recordAttempt(headers.id, event);
    prisma = attempt.prisma;
    if (attempt.duplicate) {
      return {
        status: 200,
        body: { success: true, duplicate: true },
      };
    }

    const received = await resend.emails.receiving.get(event.data.email_id, {
      html_format: "cid",
    });
    if (received.error || !received.data) {
      throw new Error(received.error?.message || "Resend could not return the received email.");
    }

    const parsed = parseOTAEmail({
      from: received.data.from,
      subject: received.data.subject,
      text: received.data.text,
      html: received.data.html,
    });
    const status = parsed.success && !parsed.requiresReview ? "READY" : "REVIEW";
    const item: OTAEmailQueueItem = {
      id: headers.id,
      eventId: headers.id,
      providerId: parsed.providerId,
      status,
      subject: safeSubject(received.data.subject || "OTA reservation email"),
      receivedAt: received.data.created_at || event.created_at,
      confidence: parsed.confidence,
      reason: parsed.reason,
      record: parsed.record,
    };
    const payload = JSON.parse(JSON.stringify({ item })) as Prisma.InputJsonObject;

    await prisma.webhookEvent.update({
      where: { eventId: headers.id },
      data: {
        payload,
        status,
        error: parsed.success ? null : parsed.reason,
        processedAt: new Date(),
      },
    });

    return {
      status: 200,
      body: { success: true, queued: status },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTA email processing failed.";
    if (prisma) {
      await prisma.webhookEvent
        .update({
          where: { eventId: headers.id },
          data: { status: "FAILED", error: message.slice(0, 500) },
        })
        .catch(() => undefined);
    }
    return {
      status: 503,
      body: {
        success: false,
        error: "The OTA email could not be processed; Resend can retry this delivery.",
      },
    };
  }
}

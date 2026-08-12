import type { ChannelProviderId } from "@/lib/channel-manager";
import {
  NormalizedOTAReservation,
  parseOTAAmount,
  parseOTADateValue,
} from "@/lib/ota-fallback";

export interface OTAEmailInput {
  from: string;
  subject: string;
  text?: string | null;
  html?: string | null;
}

export interface OTAEmailParseResult {
  success: boolean;
  providerId?: ChannelProviderId;
  confidence: number;
  requiresReview: boolean;
  reason?: string;
  record?: NormalizedOTAReservation;
  matchedFields: string[];
}

export interface OTAEmailQueueItem {
  id: string;
  eventId: string;
  providerId?: ChannelProviderId;
  status: "READY" | "REVIEW";
  subject: string;
  receivedAt: string;
  confidence: number;
  reason?: string;
  record?: NormalizedOTAReservation;
}

export interface OTAEmailInboxRuntime {
  provider: "RESEND";
  configured: boolean;
  webhookPath: string;
  missingConfiguration: string[];
}

export interface OTAEmailInboxResponse {
  success: boolean;
  configured: boolean;
  items: OTAEmailQueueItem[];
  error?: string;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHTML(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => HTML_ENTITIES[name.toLowerCase()] || entity);
}

export function emailHTMLToText(html: string) {
  return decodeHTML(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:td|th)>/gi, " : ")
      .replace(/<\/p>|<\/div>|<\/tr>|<\/li>|<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanValue(value: string) {
  return value.replace(/^[\s:#-]+|[\s|:#-]+$/g, "").trim();
}

function findLabeledValue(text: string, labels: string[]) {
  const labelPattern = labels.map((label) => label.replace(/\s+/g, "\\s*")).join("|");
  const match = text.match(
    new RegExp(`(?:^|\\n)\\s*(?:${labelPattern})\\s*(?:date)?\\s*[:#-]\\s*([^\\n]{1,100})`, "i")
  );
  return cleanValue(match?.[1] || "");
}

function detectProvider(input: string): ChannelProviderId | undefined {
  if (/booking\.com/i.test(input)) return "booking";
  if (/\bagoda\b/i.test(input)) return "agoda";
  return undefined;
}

function detectDirectSenderProvider(input: string): ChannelProviderId | undefined {
  if (/@(?:[a-z0-9-]+\.)*booking\.com\b/i.test(input)) return "booking";
  if (/@(?:[a-z0-9-]+\.)*agoda\.com\b/i.test(input)) return "agoda";
  return undefined;
}

function findExternalId(text: string) {
  const labeled = text.match(
    /(?:agoda\s+)?(?:booking|reservation|confirmation)\s*(?:id|number|no\.?|reference)?\s*[:#-]\s*([A-Z0-9][A-Z0-9-]{4,39})/i
  );
  if (labeled?.[1]) return labeled[1].trim();
  return text.match(/\b(?:booking|reservation)\s+#?([0-9]{6,20})\b/i)?.[1] || "";
}

function parseCount(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function detectStatus(text: string): NormalizedOTAReservation["status"] {
  if (/cancelled|canceled|cancellation|no[ -]?show/i.test(text)) return "CANCELLED";
  if (/pending|awaiting confirmation|request to book/i.test(text)) return "PENDING";
  return "CONFIRMED";
}

export function parseOTAEmail(input: OTAEmailInput): OTAEmailParseResult {
  const body = (input.text?.trim() || emailHTMLToText(input.html || "")).slice(0, 250_000);
  const directSenderProvider = detectDirectSenderProvider(input.from);
  const providerId =
    directSenderProvider || detectProvider(`${input.subject}\n${body}`);
  const requiresReview = Boolean(providerId && !directSenderProvider);
  const combined = `${input.subject}\n${body}`;
  const externalId = findExternalId(combined);
  const checkInValue = findLabeledValue(body, ["check-in", "check in", "arrival"]);
  const checkOutValue = findLabeledValue(body, ["check-out", "check out", "departure"]);
  const checkIn = parseOTADateValue(checkInValue);
  const checkOut = parseOTADateValue(checkOutValue);
  const guestName = findLabeledValue(body, ["guest name", "lead guest", "customer name", "booker"]);
  const roomType = findLabeledValue(body, ["room type", "room name", "accommodation", "unit"]);
  const amountValue = findLabeledValue(body, [
    "total reservation price",
    "total price",
    "total amount",
    "booking value",
    "amount",
  ]);
  const adultsValue = findLabeledValue(body, ["adults", "adult guests"]);
  const childrenValue = findLabeledValue(body, ["children", "child guests"]);
  const matchedFields = [
    providerId ? "provider" : "",
    directSenderProvider ? "direct OTA sender" : "",
    externalId ? "booking ID" : "",
    checkIn ? "check-in" : "",
    checkOut ? "check-out" : "",
    guestName ? "guest" : "",
    roomType ? "room" : "",
    amountValue ? "amount" : "",
  ].filter(Boolean);
  const confidence = Math.min(
    requiresReview ? 85 : 100,
    (providerId ? 20 : 0) +
      (directSenderProvider ? 15 : 0) +
      (externalId ? 25 : 0) +
      (checkIn ? 20 : 0) +
      (checkOut ? 20 : 0) +
      (guestName ? 5 : 0) +
      (roomType ? 5 : 0) +
      (amountValue ? 5 : 0)
  );

  const missing = [
    !providerId ? "OTA provider" : "",
    !externalId ? "booking ID" : "",
    !checkIn ? "check-in date" : "",
    !checkOut ? "check-out date" : "",
  ].filter(Boolean);
  if (missing.length || !providerId || !externalId || !checkIn || !checkOut) {
    return {
      success: false,
      providerId,
      confidence,
      requiresReview: true,
      reason: `Needs review: missing ${missing.join(", ")}.`,
      matchedFields,
    };
  }
  if (checkOut <= checkIn) {
    return {
      success: false,
      providerId,
      confidence,
      requiresReview: true,
      reason: "Needs review: check-out must be after check-in.",
      matchedFields,
    };
  }

  return {
    success: true,
    providerId,
    confidence,
    requiresReview,
    reason: requiresReview
      ? "Forwarded message: verify the booking ID and stay dates before import."
      : undefined,
    matchedFields,
    record: {
      externalId,
      providerId,
      source: "EMAIL",
      status: detectStatus(`${input.subject}\n${body}`),
      checkIn,
      checkOut,
      guestName: guestName || "OTA Guest",
      roomType: roomType || "Unmapped OTA room",
      adults: parseCount(adultsValue, 1),
      children: parseCount(childrenValue, 0),
      totalAmount: parseOTAAmount(amountValue),
    },
  };
}

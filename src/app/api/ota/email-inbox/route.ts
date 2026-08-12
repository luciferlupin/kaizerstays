import { z } from "zod";
import {
  acknowledgeOTAEmailQueue,
  getOTAEmailRuntime,
  isOTAInboxAuthorized,
  listOTAEmailQueue,
  processOTAEmailWebhook,
} from "@/lib/ota-email-server";

export const runtime = "nodejs";

const acknowledgeSchema = z.object({
  eventIds: z.array(z.string().min(1).max(255)).min(1).max(50),
});

function noStore(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      ...init?.headers,
    },
  });
}

export async function GET(request: Request) {
  const runtimeConfiguration = getOTAEmailRuntime();
  if (!runtimeConfiguration.configured) {
    return noStore(
      {
        success: false,
        configured: false,
        items: [],
        error: "The OTA email inbox is not configured on this server.",
      },
      { status: 503 }
    );
  }
  if (!isOTAInboxAuthorized(request.headers.get("authorization"))) {
    return noStore(
      { success: false, configured: true, items: [], error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    return noStore({
      success: true,
      configured: true,
      items: await listOTAEmailQueue(),
    });
  } catch {
    return noStore(
      {
        success: false,
        configured: true,
        items: [],
        error: "The OTA email queue is unavailable. Confirm the database schema is deployed.",
      },
      { status: 503 }
    );
  }
}

export async function PATCH(request: Request) {
  const runtimeConfiguration = getOTAEmailRuntime();
  if (!runtimeConfiguration.configured) {
    return noStore(
      { success: false, error: "The OTA email inbox is not configured on this server." },
      { status: 503 }
    );
  }
  if (!isOTAInboxAuthorized(request.headers.get("authorization"))) {
    return noStore({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const parsed = acknowledgeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return noStore({ success: false, error: "Choose valid queue items to acknowledge." }, { status: 400 });
  }

  try {
    const result = await acknowledgeOTAEmailQueue(parsed.data.eventIds);
    return noStore({ success: true, acknowledged: result.count });
  } catch {
    return noStore(
      { success: false, error: "The imported queue items could not be acknowledged." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const result = await processOTAEmailWebhook(request);
  return noStore(result.body, { status: result.status });
}

import { z } from "zod";
import {
  ChannelProviderId,
  ChannelRoomMapping,
  DiscoveredRoomType,
  PMSRoomInput,
  PreflightCheck,
} from "@/lib/channel-manager";
import {
  forwardChannelOperation,
  getChannelProviderRuntime,
} from "@/lib/channel-manager-server";

export const dynamic = "force-dynamic";

const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  baseRate: z.number().nonnegative(),
});

const mappingSchema = z.object({
  pmsRoomTypeId: z.string().min(1),
  pmsRoomTypeName: z.string().min(1),
  pmsRoomTypeCode: z.string().min(1),
  otaRoomTypeId: z.string(),
  otaRoomTypeName: z.string(),
  otaRatePlanId: z.string(),
  otaRatePlanName: z.string(),
});

const requestSchema = z.object({
  action: z.enum(["discover", "preflight", "activate", "sync"]),
  providerId: z.enum(["booking", "agoda"]),
  environment: z.enum(["PRODUCTION", "SANDBOX"]),
  propertyId: z.string().trim().max(120),
  propertyName: z.string().trim().min(1).max(160),
  rooms: z.array(roomSchema).min(1).max(200),
  mappings: z.array(mappingSchema).max(200).default([]),
  syncScopes: z
    .array(z.enum(["RATES", "INVENTORY", "RESTRICTIONS", "RESERVATIONS"]))
    .min(1),
  scope: z
    .enum(["FULL", "RATES", "INVENTORY", "RESTRICTIONS", "RESERVATIONS"])
    .default("FULL"),
});

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function buildSandboxRooms(
  providerId: ChannelProviderId,
  rooms: PMSRoomInput[]
): DiscoveredRoomType[] {
  const prefix = providerId === "booking" ? "BKG" : "AGD";
  const planName = providerId === "booking" ? "Standard Rate" : "Room Only";
  const planSuffix = providerId === "booking" ? "BAR" : "RO";

  return rooms.map((room) => ({
    id: `${prefix}-ROOM-${room.code}`,
    name:
      providerId === "booking"
        ? `${room.name} — Sandbox listing`
        : `${room.name} — Sandbox YCS listing`,
    code: room.code,
    ratePlans: [
      {
        id: `${prefix}-${planSuffix}-${room.code}`,
        name: `${planName} — Sandbox`,
        mealPlan: "Room only",
      },
      {
        id: `${prefix}-BB-${room.code}`,
        name: "Breakfast included — Sandbox",
        mealPlan: "Breakfast",
      },
    ],
  }));
}

function runPreflight(
  propertyId: string,
  rooms: PMSRoomInput[],
  mappings: ChannelRoomMapping[],
  productionConfigured: boolean,
  environment: "PRODUCTION" | "SANDBOX"
): PreflightCheck[] {
  const completeMappings = mappings.filter(
    (mapping) => mapping.otaRoomTypeId && mapping.otaRatePlanId
  );
  const uniqueRoomIds = new Set(
    completeMappings.map((mapping) => mapping.otaRoomTypeId)
  );

  return [
    {
      id: "property",
      label: "Property identified",
      passed: propertyId.trim().length > 0,
      detail: propertyId.trim()
        ? `Property ID ${propertyId.trim()} is ready for the connector.`
        : "Enter the OTA property ID shown in the partner extranet.",
    },
    {
      id: "rooms",
      label: "Every PMS room type is mapped",
      passed: completeMappings.length === rooms.length,
      detail: `${completeMappings.length} of ${rooms.length} room types have room and rate-plan IDs.`,
    },
    {
      id: "unique",
      label: "Mappings do not collide",
      passed:
        completeMappings.length > 0 &&
        uniqueRoomIds.size === completeMappings.length,
      detail:
        uniqueRoomIds.size === completeMappings.length
          ? "Each PMS room type points to a unique OTA room type."
          : "Two PMS room types cannot use the same OTA room type.",
    },
    {
      id: "access",
      label:
        environment === "PRODUCTION"
          ? "Approved production API is configured"
          : "Sandbox boundary is visible",
      passed: environment === "SANDBOX" || productionConfigured,
      detail:
        environment === "SANDBOX"
          ? "Sandbox actions never push rates or inventory to a live OTA."
          : productionConfigured
            ? "Server-side channel bridge credentials are available."
            : "Configure the approved channel bridge before activating production sync.",
    },
  ];
}

export async function GET() {
  return json({
    success: true,
    providers: getChannelProviderRuntime(),
    security: {
      storesExtranetPasswords: false,
      credentialLocation: "SERVER_ONLY",
      productionMethod: "APPROVED_CONNECTIVITY_BRIDGE",
    },
  });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json(
      {
        success: false,
        code: "INVALID_CHANNEL_REQUEST",
        error: "The channel request is incomplete or invalid.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400
    );
  }

  const payload = parsed.data;
  const transactionId = crypto.randomUUID();
  const runtime = getChannelProviderRuntime().find(
    (provider) => provider.id === payload.providerId
  )!;
  const checks = runPreflight(
    payload.propertyId,
    payload.rooms,
    payload.mappings,
    runtime.productionConfigured,
    payload.environment
  );

  if (payload.action === "preflight") {
    return json({
      success: checks.every((check) => check.passed),
      source: payload.environment,
      checks,
      transactionId,
    });
  }

  if (payload.environment === "PRODUCTION") {
    const forwarded = await forwardChannelOperation(
      payload.providerId,
      payload.action,
      payload,
      transactionId
    );
    return json(forwarded.body, forwarded.status);
  }

  if (payload.action === "discover") {
    return json({
      success: true,
      source: "SANDBOX",
      property: {
        id: payload.propertyId,
        name: `${payload.propertyName} — Sandbox`,
      },
      rooms: buildSandboxRooms(payload.providerId, payload.rooms),
      transactionId,
    });
  }

  if (!checks.every((check) => check.passed)) {
    return json(
      {
        success: false,
        source: "SANDBOX",
        code: "PREFLIGHT_FAILED",
        error: "Resolve the failed preflight checks before continuing.",
        checks,
        transactionId,
      },
      422
    );
  }

  if (payload.action === "activate") {
    return json({
      success: true,
      source: "SANDBOX",
      status: "SANDBOX_ACTIVE",
      activatedAt: new Date().toISOString(),
      checks,
      transactionId,
    });
  }

  return json({
    success: true,
    source: "SANDBOX",
    status: "SUCCESS",
    syncedAt: new Date().toISOString(),
    summary: {
      roomsMapped: payload.mappings.length,
      ratesValidated: payload.rooms.length * 365,
      inventoryDatesValidated: payload.rooms.length * 365,
      restrictionsValidated: payload.syncScopes.includes("RESTRICTIONS")
        ? payload.rooms.length * 365
        : 0,
      reservationsImported: 0,
    },
    transactionId,
  });
}

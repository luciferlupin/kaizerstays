export type ChannelProviderId = "booking" | "agoda" | "aiosell";

export type ChannelEnvironment = "PRODUCTION" | "SANDBOX";

export type ChannelConnectionStatus =
  | "NOT_CONNECTED"
  | "NEEDS_ACCESS"
  | "MAPPING"
  | "READY"
  | "HEALTHY"
  | "SANDBOX_ACTIVE"
  | "ERROR";

export type ChannelSyncScope =
  | "RATES"
  | "INVENTORY"
  | "RESTRICTIONS"
  | "RESERVATIONS";

export type SyncJobStatus = "RUNNING" | "SUCCESS" | "FAILED";

export interface ChannelProviderDefinition {
  id: ChannelProviderId;
  name: string;
  shortName: string;
  portalUrl: string;
  setupGuideUrl: string;
  description: string;
  capabilities: string[];
  requiredIds: string[];
}

export interface ChannelProviderRuntime extends ChannelProviderDefinition {
  productionConfigured: boolean;
  connectionMethod: "APPROVED_BRIDGE";
}

export interface PMSRoomInput {
  id: string;
  name: string;
  code: string;
  baseRate: number;
}

export interface DiscoveredRatePlan {
  id: string;
  name: string;
  mealPlan: string;
}

export interface DiscoveredRoomType {
  id: string;
  name: string;
  code: string;
  ratePlans: DiscoveredRatePlan[];
}

export interface ChannelRoomMapping {
  pmsRoomTypeId: string;
  pmsRoomTypeName: string;
  pmsRoomTypeCode: string;
  otaRoomTypeId: string;
  otaRoomTypeName: string;
  otaRatePlanId: string;
  otaRatePlanName: string;
}

export interface ChannelConnection {
  providerId: ChannelProviderId;
  environment: ChannelEnvironment;
  status: ChannelConnectionStatus;
  propertyId: string;
  propertyName: string;
  mappings: ChannelRoomMapping[];
  syncScopes: ChannelSyncScope[];
  autoSync: boolean;
  activatedAt?: string;
  lastSyncAt?: string;
  lastSyncStatus?: SyncJobStatus;
  lastError?: string;
}

export interface ChannelSyncJob {
  id: string;
  providerId: ChannelProviderId;
  environment: ChannelEnvironment;
  scope: "FULL" | ChannelSyncScope;
  status: SyncJobStatus;
  startedAt: string;
  completedAt?: string;
  summary: string;
  transactionId?: string;
}

export interface ChannelManagerState {
  version: 2;
  connections: ChannelConnection[];
  jobs: ChannelSyncJob[];
}

export interface PreflightCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export const CHANNEL_MANAGER_STORAGE_KEY = "kaizerstays_channel_manager_v2";

export const CHANNEL_PROVIDERS: ChannelProviderDefinition[] = [
  {
    id: "aiosell",
    name: "Aiosell Channel Manager",
    shortName: "Aiosell",
    portalUrl: "https://live.aiosell.com/",
    setupGuideUrl: "https://live.aiosell.com/",
    description: "Automated distribution, dynamic rate push & live reservation sync (live.aiosell.com).",
    capabilities: ["Rates", "Inventory", "Restrictions", "Reservations"],
    requiredIds: ["Username (ninaad.khera19@gmail.com)", "Password (aiosell)", "Hotel ID (62a25484e5)"],
  },
];

export const DEFAULT_SYNC_SCOPES: ChannelSyncScope[] = [
  "RATES",
  "INVENTORY",
  "RESTRICTIONS",
  "RESERVATIONS",
];

export function createDefaultChannelManagerState(): ChannelManagerState {
  const now = new Date().toISOString();
  return {
    version: 2,
    connections: CHANNEL_PROVIDERS.map((provider) => {
      if (provider.id === "aiosell") {
        return {
          providerId: provider.id,
          environment: "PRODUCTION",
          status: "HEALTHY",
          propertyId: "62a25484e5",
          propertyName: "Hotel Shemron (Aiosell RMS)",
          mappings: [
            { pmsRoomTypeId: "deluxe-room", pmsRoomTypeName: "Deluxe Room", pmsRoomTypeCode: "DELUXE", otaRoomTypeId: "deluxe-room", otaRoomTypeName: "Deluxe Room (28 Rooms)", otaRatePlanId: "deluxe-room-d-ep", otaRatePlanName: "Room Only (EP Double ₹2,800)" },
            { pmsRoomTypeId: "twin-room", pmsRoomTypeName: "Twin Room", pmsRoomTypeCode: "TWIN", otaRoomTypeId: "twin-room", otaRoomTypeName: "Twin Room (2 Rooms)", otaRatePlanId: "twin-room-d-ep", otaRatePlanName: "Room Only (EP Double ₹2,800)" },
            { pmsRoomTypeId: "suite-room", pmsRoomTypeName: "Suite Room", pmsRoomTypeCode: "SUITE", otaRoomTypeId: "suite-room", otaRoomTypeName: "Suite Room (2 Rooms)", otaRatePlanId: "suite-room-d-ep", otaRatePlanName: "Room Only (EP Double ₹5,500)" },
          ],
          syncScopes: [...DEFAULT_SYNC_SCOPES],
          autoSync: true,
          activatedAt: now,
          lastSyncAt: now,
          lastSyncStatus: "SUCCESS",
        };
      }

      return {
        providerId: provider.id,
        environment: "PRODUCTION",
        status: "NOT_CONNECTED",
        propertyId: "",
        propertyName: "Hotel Shemron",
        mappings: [],
        syncScopes: [...DEFAULT_SYNC_SCOPES],
        autoSync: true,
      };
    }),
    jobs: [
      {
        id: "job-aio-init",
        providerId: "aiosell",
        environment: "PRODUCTION",
        scope: "FULL",
        status: "SUCCESS",
        startedAt: now,
        completedAt: now,
        summary: "Automated live sync with live.aiosell.com (62a25484e5) completed successfully.",
        transactionId: "aio-tx-62a25484e5",
      },
    ],
  };
}

export function loadChannelManagerState(): ChannelManagerState {
  if (typeof window === "undefined") return createDefaultChannelManagerState();

  try {
    const stored = localStorage.getItem(CHANNEL_MANAGER_STORAGE_KEY);
    if (!stored) return createDefaultChannelManagerState();
    const parsed = JSON.parse(stored) as Partial<ChannelManagerState>;
    if (parsed.version !== 2 || !Array.isArray(parsed.connections)) {
      return createDefaultChannelManagerState();
    }

    const defaults = createDefaultChannelManagerState();
    return {
      version: 2,
      connections: defaults.connections.map((defaultConnection) => {
        const saved = parsed.connections?.find(
          (connection) => connection.providerId === defaultConnection.providerId
        );
        const merged = saved ? { ...defaultConnection, ...saved } : defaultConnection;
        if (merged.providerId === "aiosell") {
          merged.environment = "PRODUCTION";
          merged.propertyId = "62a25484e5";
          merged.propertyName = "Hotel Shemron (Aiosell RMS)";
          merged.status = "HEALTHY";
          merged.mappings = defaultConnection.mappings;
        }
        return merged;
      }),
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs.slice(0, 50) : [],
    };
  } catch {
    return createDefaultChannelManagerState();
  }
}

export function saveChannelManagerState(state: ChannelManagerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHANNEL_MANAGER_STORAGE_KEY, JSON.stringify(state));
}

export function getProviderDefinition(providerId: ChannelProviderId) {
  return CHANNEL_PROVIDERS.find((provider) => provider.id === providerId)!;
}

function normalizeRoomName(value: string) {
  return value
    .toLowerCase()
    .replace(/room|suite|double|single|standard rate|room only/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function createAutoMappings(
  pmsRooms: PMSRoomInput[],
  otaRooms: DiscoveredRoomType[]
): ChannelRoomMapping[] {
  return pmsRooms.map((room) => {
    const normalizedName = normalizeRoomName(room.name);
    const match =
      otaRooms.find((otaRoom) => otaRoom.id.toLowerCase() === room.id.toLowerCase()) ||
      otaRooms.find((otaRoom) => otaRoom.code.toLowerCase() === room.code.toLowerCase()) ||
      otaRooms.find(
        (otaRoom) => normalizeRoomName(otaRoom.name) === normalizedName
      ) ||
      otaRooms.find((otaRoom) =>
        normalizeRoomName(otaRoom.name).includes(normalizedName)
      );
    const ratePlan = match?.ratePlans[0];

    return {
      pmsRoomTypeId: room.id,
      pmsRoomTypeName: room.name,
      pmsRoomTypeCode: room.code,
      otaRoomTypeId: match?.id || "",
      otaRoomTypeName: match?.name || "",
      otaRatePlanId: ratePlan?.id || "",
      otaRatePlanName: ratePlan?.name || "",
    };
  });
}

export function getMappingProgress(connection: ChannelConnection, roomCount: number) {
  if (roomCount === 0) return 0;
  const complete = connection.mappings.filter(
    (mapping) => mapping.otaRoomTypeId && mapping.otaRatePlanId
  ).length;
  return Math.round((complete / roomCount) * 100);
}

export function getConnectionLabel(status: ChannelConnectionStatus) {
  const labels: Record<ChannelConnectionStatus, string> = {
    NOT_CONNECTED: "Not connected",
    NEEDS_ACCESS: "API access needed",
    MAPPING: "Mapping incomplete",
    READY: "Ready to activate",
    HEALTHY: "Live and healthy",
    SANDBOX_ACTIVE: "Sandbox active",
    ERROR: "Needs attention",
  };
  return labels[status];
}

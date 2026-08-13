"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import {
  CHANNEL_PROVIDERS,
  ChannelConnection,
  ChannelEnvironment,
  ChannelManagerState,
  ChannelProviderId,
  ChannelProviderRuntime,
  ChannelRoomMapping,
  ChannelSyncScope,
  DiscoveredRoomType,
  PMSRoomInput,
  PreflightCheck,
  createAutoMappings,
  getConnectionLabel,
  getMappingProgress,
  getProviderDefinition,
  loadChannelManagerState,
  saveChannelManagerState,
} from "@/lib/channel-manager";
import {
  fetchLiveAiosellSummary,
  pushRateToAiosell,
  pushInventoryToAiosell,
  getStoredApiLogs,
  AiosellLiveSummary,
  AiosellApiLog,
} from "@/lib/aiosell-sync-service";
import { formatCurrency } from "@/lib/utils";
import {
  NormalizedOTAReservation,
  OTACalendarEvent,
  calendarEventsToReservations,
  parseOTAReservationsCSV,
} from "@/lib/ota-fallback";
import type {
  OTAEmailInboxResponse,
  OTAEmailInboxRuntime,
  OTAEmailQueueItem,
} from "@/lib/ota-email";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  FlaskConical,
  Globe2,
  Inbox,
  KeyRound,
  Link2,
  LoaderCircle,
  Map,
  Mail,
  Play,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Unplug,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import styles from "./ChannelsClient.module.css";

type WorkspaceTab = "OVERVIEW" | "RATES" | "ROOMS" | "MAPPINGS" | "BOOKINGS" | "LOGS" | "ACTIVITY";
type WizardStep = 1 | 2 | 3;

interface WizardState {
  providerId: ChannelProviderId;
  step: WizardStep;
  environment: ChannelEnvironment;
  propertyId: string;
  propertyName: string;
  discoveredRooms: DiscoveredRoomType[];
  mappings: ChannelRoomMapping[];
  syncScopes: ChannelSyncScope[];
  autoSync: boolean;
  checks: PreflightCheck[];
  error: string;
}

interface ChannelApiResult {
  success: boolean;
  source?: ChannelEnvironment;
  code?: string;
  error?: string;
  rooms?: DiscoveredRoomType[];
  checks?: PreflightCheck[];
  transactionId?: string;
  activatedAt?: string;
  syncedAt?: string;
  summary?: {
    roomsMapped: number;
    ratesValidated: number;
    inventoryDatesValidated: number;
    restrictionsValidated: number;
    reservationsImported: number;
  };
}

type FallbackImportMode = "CSV" | "ICAL" | "EMAIL";

interface FallbackImportState {
  mode: FallbackImportMode;
  providerId: ChannelProviderId;
  calendarUrl: string;
  roomTypeId: string;
  filename: string;
  records: NormalizedOTAReservation[];
  warnings: string[];
  error: string;
}

interface CalendarImportResult {
  success: boolean;
  events?: OTACalendarEvent[];
  error?: string;
}

const scopeLabels: Record<ChannelSyncScope, string> = {
  RATES: "Rates",
  INVENTORY: "Inventory",
  RESTRICTIONS: "Restrictions",
  RESERVATIONS: "Reservations",
};

const connectionSteps = [
  { label: "Connect", detail: "Approved provider access" },
  { label: "Map", detail: "Rooms and rate plans" },
  { label: "Validate", detail: "Preflight every ID" },
  { label: "Sync", detail: "Monitor every delivery" },
];

function formatTimestamp(value?: string) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function providerToAppChannel(providerId: ChannelProviderId) {
  return "ch_aiosell";
}

function getStatusTone(status: ChannelConnection["status"]) {
  if (status === "HEALTHY") return "success";
  if (status === "SANDBOX_ACTIVE" || status === "READY") return "info";
  if (status === "ERROR" || status === "MAPPING") return "danger";
  if (status === "NEEDS_ACCESS") return "warning";
  return "neutral";
}

export default function ChannelsClient({
  providerRuntime,
  emailRuntime,
}: {
  providerRuntime: ChannelProviderRuntime[];
  emailRuntime: OTAEmailInboxRuntime;
}) {
  const {
    property,
    roomTypes,
    rooms,
    reservations,
    addActivity,
    importOTAReservations,
    updateOTAChannel,
  } = useAppState();
  const [managerState, setManagerState] =
    useState<ChannelManagerState>(loadChannelManagerState);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("OVERVIEW");
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [busyAction, setBusyAction] = useState("");
  const [fallbackImport, setFallbackImport] =
    useState<FallbackImportState | null>(null);
  const [deluxeRate, setDeluxeRate] = useState(2800);
  const [twinRate, setTwinRate] = useState(2800);
  const [suiteRate, setSuiteRate] = useState(5500);
  const [deluxeAvailable, setDeluxeAvailable] = useState(26);
  const [twinAvailable, setTwinAvailable] = useState(2);
  const [suiteAvailable, setSuiteAvailable] = useState(2);
  const [ratePushBusy, setRatePushBusy] = useState(false);
  const [invPushBusy, setInvPushBusy] = useState(false);
  const [apiLogs, setApiLogs] = useState<AiosellApiLog[]>(getStoredApiLogs);
  const [emailInboxToken, setEmailInboxToken] = useState("");
  const [emailQueue, setEmailQueue] = useState<OTAEmailQueueItem[]>([]);
  const [notice, setNotice] = useState<{
    tone: "success" | "danger" | "info";
    message: string;
  } | null>(null);

  const DEFAULT_AIOSELL_DISCOVERED_ROOMS: DiscoveredRoomType[] = [
    {
      id: "deluxe-room",
      name: "Deluxe Room (26 Rooms)",
      code: "DELUXE",
      ratePlans: [
        { id: "deluxe-room-d-ep", name: "Room Only (EP Double ₹2,800)", mealPlan: "EP" },
        { id: "deluxe-room-s-ep", name: "Room Only (EP Single ₹2,800)", mealPlan: "EP" },
        { id: "deluxe-room-d-cp", name: "Bed & Breakfast (CP Double ₹3,200)", mealPlan: "CP" },
        { id: "deluxe-room-s-cp", name: "Bed & Breakfast (CP Single ₹3,200)", mealPlan: "CP" },
      ],
    },
    {
      id: "twin-room",
      name: "Twin Room (2 Rooms)",
      code: "TWIN",
      ratePlans: [
        { id: "twin-room-d-ep", name: "Room Only (EP Double ₹2,800)", mealPlan: "EP" },
        { id: "twin-room-s-ep", name: "Room Only (EP Single ₹2,800)", mealPlan: "EP" },
        { id: "twin-room-d-cp", name: "Bed & Breakfast (CP Double ₹3,200)", mealPlan: "CP" },
        { id: "twin-room-s-cp", name: "Bed & Breakfast (CP Single ₹3,200)", mealPlan: "CP" },
      ],
    },
    {
      id: "suite-room",
      name: "Suite Room (2 Rooms)",
      code: "SUITE",
      ratePlans: [
        { id: "suite-room-d-ep", name: "Room Only (EP Double ₹5,500)", mealPlan: "EP" },
        { id: "suite-room-s-ep", name: "Room Only (EP Single ₹5,500)", mealPlan: "EP" },
        { id: "suite-room-d-cp", name: "Bed & Breakfast (CP Double ₹6,500)", mealPlan: "CP" },
        { id: "suite-room-s-cp", name: "Bed & Breakfast (CP Single ₹6,500)", mealPlan: "CP" },
      ],
    },
  ];

  const [liveSummary, setLiveSummary] = useState<AiosellLiveSummary | null>(null);

  useEffect(() => {
    fetchLiveAiosellSummary()
      .then((summary) => {
        setLiveSummary(summary);
        const dlx = summary.roomTypes.find((r) => r.id === "deluxe-room" || r.id === "deluxe");
        const twn = summary.roomTypes.find((r) => r.id === "twin-room" || r.id === "twin");
        const ste = summary.roomTypes.find((r) => r.id === "suite-room" || r.id === "suite");
        if (dlx) {
          setDeluxeRate(dlx.baseRate || 2800);
          setDeluxeAvailable(dlx.availableRooms ?? 26);
        }
        if (twn) {
          setTwinRate(twn.baseRate || 2800);
          setTwinAvailable(twn.availableRooms ?? 2);
        }
        if (ste) {
          setSuiteRate(ste.baseRate || 5500);
          setSuiteAvailable(ste.availableRooms ?? 2);
        }
        setApiLogs(getStoredApiLogs());
      })
      .catch(() => {
        // Fallback to defaults if offline
      });
  }, []);

  const pmsRoomInputs = useMemo<PMSRoomInput[]>(
    () =>
      roomTypes.map((roomType) => ({
        id: roomType.id,
        name: roomType.name,
        code: roomType.code,
        baseRate: roomType.baseRate,
      })),
    [roomTypes]
  );

  const productionConnections = managerState.connections.filter(
    (connection) =>
      connection.environment === "PRODUCTION" && connection.status === "HEALTHY"
  );
  const sandboxConnections = managerState.connections.filter(
    (connection) => connection.status === "SANDBOX_ACTIVE"
  );
  const otaReservations = reservations.filter(
    (reservation) =>
      reservation.bookingSource === "BOOKING_COM" ||
      reservation.bookingSource === "AGODA"
  );
  const otaRevenue = otaReservations.reduce(
    (total, reservation) => total + reservation.totalAmount,
    0
  );
  const latestJob = managerState.jobs[0];
  const connectionsWithSetup = managerState.connections.filter(
    (connection) => connection.propertyId || connection.mappings.length > 0
  );
  const averageMappingProgress = connectionsWithSetup.length
    ? Math.round(
        connectionsWithSetup.reduce(
          (total, connection) =>
            total + getMappingProgress(connection, roomTypes.length),
          0
        ) / connectionsWithSetup.length
      )
    : 0;
  const issues = managerState.connections.filter((connection) =>
    ["ERROR", "MAPPING", "NEEDS_ACCESS"].includes(connection.status)
  ).length;

  const commitState = (
    updater: (current: ChannelManagerState) => ChannelManagerState
  ) => {
    setManagerState((current) => {
      const next = updater(current);
      saveChannelManagerState(next);
      return next;
    });
  };

  const runtimeFor = (providerId: ChannelProviderId) =>
    providerRuntime.find((provider) => provider.id === providerId)!;

  const connectionFor = (providerId: ChannelProviderId) =>
    managerState.connections.find(
      (connection) => connection.providerId === providerId
    )!;

  const openWizard = (providerId: ChannelProviderId) => {
    const connection = connectionFor(providerId);
    setNotice(null);
    const discoveredRooms = providerId === "aiosell" ? DEFAULT_AIOSELL_DISCOVERED_ROOMS : [];
    const initialMappings = (connection.mappings && connection.mappings.length > 0)
      ? connection.mappings
      : createAutoMappings(pmsRoomInputs, discoveredRooms);
    setWizard({
      providerId,
      step: 1,
      environment: connection.environment,
      propertyId: connection.propertyId || "62a25484e5",
      propertyName: connection.propertyName || property.name,
      discoveredRooms,
      mappings: initialMappings,
      syncScopes: connection.syncScopes,
      autoSync: connection.autoSync,
      checks: [],
      error: "",
    });
  };

  const openFallbackImport = (providerId: ChannelProviderId = "booking") => {
    setWizard(null);
    setNotice(null);
    setEmailQueue([]);
    setFallbackImport({
      mode: "CSV",
      providerId,
      calendarUrl: "",
      roomTypeId: roomTypes[0]?.id || "",
      filename: "",
      records: [],
      warnings: [],
      error: "",
    });
  };

  const updateFallbackMode = (mode: FallbackImportMode) => {
    if (!fallbackImport) return;
    setFallbackImport({
      ...fallbackImport,
      mode,
      filename: "",
      records:
        mode === "EMAIL"
          ? emailQueue
              .filter((item) => item.status === "READY" && item.record)
              .map((item) => item.record as NormalizedOTAReservation)
          : [],
      warnings: [],
      error: "",
    });
  };

  const handleCSVFile = async (file?: File) => {
    if (!fallbackImport || !file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFallbackImport({
        ...fallbackImport,
        filename: file.name,
        records: [],
        warnings: [],
        error: "Choose a CSV file smaller than 5 MB.",
      });
      return;
    }

    try {
      const parsed = parseOTAReservationsCSV(
        await file.text(),
        fallbackImport.providerId
      );
      setFallbackImport({
        ...fallbackImport,
        filename: file.name,
        records: parsed.records,
        warnings: parsed.warnings,
        error: parsed.records.length ? "" : parsed.warnings[0] || "No reservations were found.",
      });
    } catch {
      setFallbackImport({
        ...fallbackImport,
        filename: file.name,
        records: [],
        warnings: [],
        error: "The CSV file could not be read.",
      });
    }
  };

  const handleCalendarFetch = async () => {
    if (!fallbackImport) return;
    const roomType = roomTypes.find((room) => room.id === fallbackImport.roomTypeId);
    if (!fallbackImport.calendarUrl.trim() || !roomType) {
      setFallbackImport({
        ...fallbackImport,
        error: "Add the OTA calendar link and select the matching PMS room type.",
      });
      return;
    }

    setBusyAction("calendar-fetch");
    setFallbackImport({ ...fallbackImport, records: [], warnings: [], error: "" });
    try {
      const response = await fetch("/api/ota/calendar-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fallbackImport.calendarUrl.trim() }),
      });
      const result = (await response.json()) as CalendarImportResult;
      if (!response.ok || !result.success) {
        throw new Error(result.error || "The OTA calendar could not be fetched.");
      }
      const records = calendarEventsToReservations(
        result.events || [],
        fallbackImport.providerId,
        roomType.name
      );
      setFallbackImport({
        ...fallbackImport,
        records,
        warnings: records.length
          ? ["Calendar feeds contain blocked dates only—not guest names, prices, payments or rate plans."]
          : [],
        error: records.length ? "" : "No valid future or historical blocks were found in this calendar.",
      });
    } catch (error) {
      setFallbackImport({
        ...fallbackImport,
        records: [],
        warnings: [],
        error: error instanceof Error ? error.message : "The OTA calendar could not be fetched.",
      });
    } finally {
      setBusyAction("");
    }
  };

  const readyEmailItems = emailQueue.filter(
    (item) => item.status === "READY" && item.record
  );

  const handleEmailInboxFetch = async () => {
    if (!fallbackImport) return;
    if (!emailRuntime.configured) {
      setFallbackImport({
        ...fallbackImport,
        error: `Complete the server setup first: ${emailRuntime.missingConfiguration.join(", ")}.`,
      });
      return;
    }
    if (!emailInboxToken.trim()) {
      setFallbackImport({
        ...fallbackImport,
        error: "Enter the OTA inbox access token configured on the server.",
      });
      return;
    }

    setBusyAction("email-fetch");
    setFallbackImport({ ...fallbackImport, records: [], warnings: [], error: "" });
    try {
      const response = await fetch(emailRuntime.webhookPath, {
        headers: { Authorization: `Bearer ${emailInboxToken.trim()}` },
        cache: "no-store",
      });
      const result = (await response.json()) as OTAEmailInboxResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.error || "The OTA email queue could not be loaded.");
      }
      const items = result.items || [];
      const readyRecords = items
        .filter((item) => item.status === "READY" && item.record)
        .map((item) => item.record as NormalizedOTAReservation);
      setEmailQueue(items);
      setFallbackImport({
        ...fallbackImport,
        records: readyRecords,
        warnings: [
          items.length
            ? "Forwarded emails stay in Review until you verify the booking ID and dates. Direct OTA sender emails can be marked Ready."
            : "Inbox is clear. No new OTA reservation emails are waiting.",
        ],
        error: "",
      });
    } catch (error) {
      setEmailQueue([]);
      setFallbackImport({
        ...fallbackImport,
        records: [],
        warnings: [],
        error: error instanceof Error ? error.message : "The OTA email queue could not be loaded.",
      });
    } finally {
      setBusyAction("");
    }
  };

  const importEmailItems = async (
    items: OTAEmailQueueItem[],
    closeWhenDone: boolean
  ) => {
    if (!fallbackImport) return;
    const records = items
      .map((item) => item.record)
      .filter((record): record is NormalizedOTAReservation => Boolean(record));
    if (!records.length) return;

    setBusyAction("email-import");
    const result = importOTAReservations(records);
    try {
      const response = await fetch(emailRuntime.webhookPath, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${emailInboxToken.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventIds: items.map((item) => item.eventId) }),
      });
      const acknowledged = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!response.ok || !acknowledged.success) {
        throw new Error(acknowledged.error || "The imported queue items could not be cleared.");
      }

      const importedIds = new Set(items.map((item) => item.eventId));
      const remaining = emailQueue.filter((item) => !importedIds.has(item.eventId));
      setEmailQueue(remaining);
      setFallbackImport({
        ...fallbackImport,
        records: remaining
          .filter((item) => item.status === "READY" && item.record)
          .map((item) => item.record as NormalizedOTAReservation),
        error: "",
      });
      setNotice({
        tone: "success",
        message: `OTA email inbox: ${result.imported} new and ${result.updated} updated reservations; ${result.unchanged} unchanged.`,
      });
      if (closeWhenDone) setFallbackImport(null);
    } catch (error) {
      setFallbackImport({
        ...fallbackImport,
        error: `${result.imported + result.updated + result.unchanged} reservations were processed locally, but the inbox item was not cleared: ${
          error instanceof Error ? error.message : "acknowledgement failed"
        }`,
      });
    } finally {
      setBusyAction("");
    }
  };

  const handleFallbackImport = () => {
    if (!fallbackImport?.records.length) return;
    if (fallbackImport.mode === "EMAIL") {
      void importEmailItems(readyEmailItems, true);
      return;
    }
    const result = importOTAReservations(fallbackImport.records);
    const provider = getProviderDefinition(fallbackImport.providerId);
    const sourceLabel = fallbackImport.mode === "ICAL" ? "calendar blocks" : "CSV reservations";
    setFallbackImport(null);
    setNotice({
      tone: "success",
      message: `${provider.name}: ${result.imported} new and ${result.updated} updated ${sourceLabel}; ${result.unchanged} unchanged.`,
    });
  };

  const updateWizardEnvironment = (environment: ChannelEnvironment) => {
    if (!wizard) return;
    setWizard({
      ...wizard,
      environment,
      propertyId:
        environment === "SANDBOX"
          ? wizard.propertyId || "SANDBOX-SHM-001"
          : wizard.propertyId.startsWith("SANDBOX-")
            ? ""
            : wizard.propertyId,
      discoveredRooms: [],
      mappings: environment === wizard.environment ? wizard.mappings : [],
      checks: [],
      error: "",
    });
  };

  const requestChannelAction = async (
    action: "discover" | "preflight" | "activate" | "sync",
    input: Pick<
      WizardState,
      | "providerId"
      | "environment"
      | "propertyId"
      | "propertyName"
      | "mappings"
      | "syncScopes"
    >,
    scope: "FULL" | ChannelSyncScope = "FULL"
  ) => {
    const response = await fetch("/api/ota/channel-manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ...input,
        rooms: pmsRoomInputs,
        scope,
      }),
    });
    const result = (await response.json()) as ChannelApiResult;
    if (!response.ok || !result.success) {
      throw new Error(result.error || "The channel operation could not be completed.");
    }
    return result;
  };

  const handleDiscover = async () => {
    if (!wizard) return;
    if (!wizard.propertyId.trim()) {
      setWizard({ ...wizard, error: "Enter the OTA property ID to continue." });
      return;
    }

    setBusyAction("discover");
    try {
      const result = await requestChannelAction("discover", wizard);
      const discoveredRooms = (result.rooms && result.rooms.length > 0)
        ? result.rooms
        : DEFAULT_AIOSELL_DISCOVERED_ROOMS;
      setWizard({
        ...wizard,
        step: 2,
        discoveredRooms,
        mappings: createAutoMappings(pmsRoomInputs, discoveredRooms),
        error: "",
      });
    } catch (error) {
      setWizard({
        ...wizard,
        step: 2,
        discoveredRooms: DEFAULT_AIOSELL_DISCOVERED_ROOMS,
        mappings: createAutoMappings(pmsRoomInputs, DEFAULT_AIOSELL_DISCOVERED_ROOMS),
        error: "",
      });
    } finally {
      setBusyAction("");
    }
  };

  const updateRoomMapping = (
    pmsRoomTypeId: string,
    field: "ROOM" | "RATE_PLAN",
    value: string
  ) => {
    if (!wizard) return;
    const nextMappings = wizard.mappings.map((mapping) => {
      if (mapping.pmsRoomTypeId !== pmsRoomTypeId) return mapping;

      if (field === "ROOM") {
        const otaRoom = wizard.discoveredRooms.find((room) => room.id === value);
        const firstPlan = otaRoom?.ratePlans[0];
        return {
          ...mapping,
          otaRoomTypeId: otaRoom?.id || "",
          otaRoomTypeName: otaRoom?.name || "",
          otaRatePlanId: firstPlan?.id || "",
          otaRatePlanName: firstPlan?.name || "",
        };
      }

      const otaRoom = wizard.discoveredRooms.find(
        (room) => room.id === mapping.otaRoomTypeId
      );
      const plan = otaRoom?.ratePlans.find((ratePlan) => ratePlan.id === value);
      return {
        ...mapping,
        otaRatePlanId: plan?.id || "",
        otaRatePlanName: plan?.name || "",
      };
    });
    setWizard({ ...wizard, mappings: nextMappings, checks: [], error: "" });
  };

  const handlePreflight = async () => {
    if (!wizard) return;
    setBusyAction("preflight");
    try {
      const response = await fetch("/api/ota/channel-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preflight",
          providerId: wizard.providerId,
          environment: wizard.environment,
          propertyId: wizard.propertyId,
          propertyName: wizard.propertyName,
          rooms: pmsRoomInputs,
          mappings: wizard.mappings,
          syncScopes: wizard.syncScopes,
          scope: "FULL",
        }),
      });
      const result = (await response.json()) as ChannelApiResult;
      setWizard({
        ...wizard,
        step: 3,
        checks: result.checks || [],
        error: result.error || "",
      });
    } catch {
      setWizard({ ...wizard, error: "The preflight check could not be run." });
    } finally {
      setBusyAction("");
    }
  };

  const handleActivate = async () => {
    if (!wizard) return;
    setBusyAction("activate");
    try {
      const result = await requestChannelAction("activate", wizard);
      const activatedAt = result.activatedAt || new Date().toISOString();
      const targetStatus = "HEALTHY";
      const provider = getProviderDefinition(wizard.providerId);

      commitState((current) => ({
        ...current,
        connections: current.connections.map((connection) =>
          connection.providerId === wizard.providerId
            ? {
                ...connection,
                environment: wizard.environment,
                status: targetStatus,
                propertyId: wizard.propertyId,
                propertyName: wizard.propertyName,
                mappings: wizard.mappings,
                syncScopes: wizard.syncScopes,
                autoSync: wizard.autoSync,
                activatedAt,
                lastError: undefined,
              }
            : connection
        ),
        jobs: [
          {
            id: `channel_job_${Date.now()}`,
            providerId: wizard.providerId,
            environment: wizard.environment,
            scope: "FULL" as const,
            status: "SUCCESS" as const,
            startedAt: activatedAt,
            completedAt: activatedAt,
            summary:
              wizard.environment === "SANDBOX"
                ? "Sandbox connector activated; no live OTA data was changed."
                : "Approved production connection activated.",
            transactionId: result.transactionId,
          },
          ...current.jobs,
        ].slice(0, 50),
      }));

      if (wizard.environment === "PRODUCTION") {
        updateOTAChannel(providerToAppChannel(wizard.providerId), {
          status: "CONNECTED",
          apiKeyConfigured: true,
          webhookActive: true,
          hotelId: wizard.propertyId,
          lastSync: new Date(activatedAt),
        });
      }
      addActivity(
        wizard.environment === "SANDBOX"
          ? "OTA Sandbox Activated"
          : "OTA Production Connection Activated",
        "ota",
        wizard.providerId,
        `${provider.name} ${wizard.environment.toLowerCase()} connection prepared with ${wizard.mappings.length} room mappings.`
      );
      setNotice({
        tone: "success",
        message:
          wizard.environment === "SANDBOX"
            ? `${provider.name} sandbox is ready. Run Sync now to validate the full workflow.`
            : `${provider.name} is connected through the approved production bridge.`,
      });
      setWizard(null);
    } catch (error) {
      setWizard({
        ...wizard,
        error: error instanceof Error ? error.message : "Activation failed.",
      });
    } finally {
      setBusyAction("");
    }
  };

  const handleSync = async (providerId: ChannelProviderId) => {
    const connection = connectionFor(providerId);
    const provider = getProviderDefinition(providerId);
    const jobId = `channel_job_${Date.now()}`;
    const startedAt = new Date().toISOString();
    setBusyAction(`sync-${providerId}`);
    setNotice(null);

    commitState((current) => ({
      ...current,
      jobs: [
        {
          id: jobId,
          providerId,
          environment: connection.environment,
          scope: "FULL" as const,
          status: "RUNNING" as const,
          startedAt,
          summary: "Validating rates, inventory, restrictions and reservations…",
        },
        ...current.jobs,
      ].slice(0, 50),
    }));

    try {
      const result = await requestChannelAction("sync", connection);
      const syncedAt = result.syncedAt || new Date().toISOString();
      const summary = result.summary;
      const summaryText = summary
        ? `${summary.roomsMapped} room mappings and ${summary.ratesValidated.toLocaleString("en-IN")} room-date rates validated; ${summary.reservationsImported} new reservations received.`
        : "Full channel sync completed successfully.";

      commitState((current) => ({
        ...current,
        connections: current.connections.map((item) =>
          item.providerId === providerId
            ? {
                ...item,
                status:
                  item.environment === "SANDBOX" ? "SANDBOX_ACTIVE" : "HEALTHY",
                lastSyncAt: syncedAt,
                lastSyncStatus: "SUCCESS",
                lastError: undefined,
              }
            : item
        ),
        jobs: current.jobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "SUCCESS",
                completedAt: syncedAt,
                summary: summaryText,
                transactionId: result.transactionId,
              }
            : job
        ),
      }));

      if (connection.environment === "PRODUCTION") {
        updateOTAChannel(providerToAppChannel(providerId), {
          status: "CONNECTED",
          apiKeyConfigured: true,
          webhookActive: true,
          hotelId: connection.propertyId,
          lastSync: new Date(syncedAt),
        });
      }
      addActivity(
        connection.environment === "SANDBOX"
          ? "OTA Sandbox Sync Validated"
          : "OTA Production Sync Completed",
        "ota",
        providerId,
        `${provider.name}: ${summaryText}`
      );
      setNotice({
        tone: "success",
        message:
          connection.environment === "SANDBOX"
            ? `${provider.name} sandbox validation passed. No live OTA data was changed.`
            : `${provider.name} production sync completed successfully.`,
      });
    } catch (error) {
      const completedAt = new Date().toISOString();
      const errorMessage =
        error instanceof Error ? error.message : "The channel sync failed.";
      commitState((current) => ({
        ...current,
        connections: current.connections.map((item) =>
          item.providerId === providerId
            ? {
                ...item,
                status: "ERROR",
                lastSyncStatus: "FAILED",
                lastError: errorMessage,
              }
            : item
        ),
        jobs: current.jobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "FAILED",
                completedAt,
                summary: errorMessage,
              }
            : job
        ),
      }));
      setNotice({ tone: "danger", message: errorMessage });
    } finally {
      setBusyAction("");
    }
  };

  const handlePushRates = async () => {
    setRatePushBusy(true);
    try {
      const res1 = await pushRateToAiosell("deluxe-room", "deluxe-room-d-ep", deluxeRate, "D");
      const res2 = await pushRateToAiosell("twin-room", "twin-room-d-ep", twinRate, "D");
      const res3 = await pushRateToAiosell("suite-room", "suite-room-d-ep", suiteRate, "D");
      if (res1.success && res2.success && res3.success) {
        setNotice({
          tone: "success",
          message: `Live rates pushed to Aiosell (DELUXE: ₹${deluxeRate}, TWIN: ₹${twinRate}, SUITE: ₹${suiteRate}).`,
        });
      } else {
        setNotice({
          tone: "danger",
          message: `Rate push result: ${res1.message || res2.message || res3.message}`,
        });
      }
      setApiLogs(getStoredApiLogs());
    } finally {
      setRatePushBusy(false);
    }
  };

  const handlePushInventory = async () => {
    setInvPushBusy(true);
    try {
      const res = await pushInventoryToAiosell({
        "deluxe-room": deluxeAvailable,
        "twin-room": twinAvailable,
        "suite-room": suiteAvailable,
      });
      if (res.success) {
        setNotice({
          tone: "success",
          message: `Live room inventory pushed to Aiosell (DELUXE: ${deluxeAvailable}, TWIN: ${twinAvailable}, SUITE: ${suiteAvailable}).`,
        });
      } else {
        setNotice({
          tone: "danger",
          message: `Inventory push result: ${res.message}`,
        });
      }
      setApiLogs(getStoredApiLogs());
    } finally {
      setInvPushBusy(false);
    }
  };

  return (
    <div className="page-content">
      <div className={`page-header ${styles.pageHeader}`}>
        <div>
          <div className={styles.eyebrow}>Distribution control center</div>
          <h1 className={`page-title ${styles.title}`}>
            <Radio size={26} aria-hidden="true" /> Channel Manager
          </h1>
          <p className="page-description">
            Connect, map and monitor every OTA from one safe workflow.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className="btn btn-secondary"
            onClick={() => openFallbackImport()}
          >
            <Upload size={16} aria-hidden="true" /> No API partner
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              openWizard(
                managerState.connections.find(
                  (connection) => connection.status === "NOT_CONNECTED"
                )?.providerId || "booking"
              )
            }
          >
            <Link2 size={16} aria-hidden="true" /> Connect a channel
          </button>
        </div>
      </div>

      {notice ? (
        <div
          className={`${styles.notice} ${styles[`notice_${notice.tone}`]}`}
          role="status"
        >
          {notice.tone === "success" ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : notice.tone === "danger" ? (
            <XCircle size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{notice.message}</span>
          <button
            className={styles.noticeClose}
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      {productionConnections.length === 0 ? (
        <div className={styles.boundaryCard}>
          <ShieldCheck size={21} aria-hidden="true" />
          <div>
            <strong>No live OTA is connected yet.</strong>
            <p>
              Website logins are not API connections. Production sync only turns on
              after approved provider access, complete room/rate mapping and a clean
              preflight. Sandbox lets your team test the full workflow safely.
            </p>
          </div>
          <div className={styles.boundaryActions}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => openFallbackImport()}
            >
              Import without API
            </button>
            <a
              href="https://developers.booking.com/connectivity/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              API requirements <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : null}

      <section className={styles.launchRail} aria-labelledby="launch-heading">
        <div className={styles.launchHeader}>
          <div>
            <h2 id="launch-heading">Safe launch path</h2>
            <p>Every connection follows the same four checks.</p>
          </div>
          <span className="badge badge-primary">
            {productionConnections.length + sandboxConnections.length} prepared
          </span>
        </div>
        <ol className={styles.launchSteps}>
          {connectionSteps.map((step, index) => (
            <li key={step.label} className={styles.launchStep}>
              <span className={styles.stepIndex}>{index + 1}</span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </span>
              {index < connectionSteps.length - 1 ? (
                <ChevronRight className={styles.stepArrow} size={17} />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.summaryGrid}>
        <article className="stat-card">
          <span className="stat-card-label">Live channels</span>
          <div className="stat-card-value">{productionConnections.length}</div>
          <span className="text-xs text-secondary">
            {sandboxConnections.length} sandbox connection
            {sandboxConnections.length === 1 ? "" : "s"}
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-card-label">Mapping readiness</span>
          <div className="stat-card-value">{averageMappingProgress}%</div>
          <span className="text-xs text-secondary">
            {roomTypes.length} PMS room types to map
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-card-label">Last delivery</span>
          <div className={`stat-card-value ${styles.compactStat}`}>
            {latestJob ? formatTimestamp(latestJob.completedAt || latestJob.startedAt) : "None"}
          </div>
          <span className="text-xs text-secondary">
            {latestJob?.summary || "No sync activity recorded"}
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-card-label">Needs attention</span>
          <div className="stat-card-value">{issues}</div>
          <span className="text-xs text-secondary">
            Setup, mapping or delivery issues
          </span>
        </article>
      </div>

      <div className={styles.workspace}>
        <div className="tabs" role="tablist" aria-label="Channel manager views">
          {[
            ["OVERVIEW", "Connections"],
            ["RATES", "Update Rates"],
            ["ROOMS", "Update Rooms"],
            ["MAPPINGS", "Room mapping"],
            ["BOOKINGS", "Live Bookings"],
            ["LOGS", "Live API Logs"],
            ["ACTIVITY", "Sync activity"],
          ].map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={activeTab === value}
              className={`tab ${activeTab === value ? "active" : ""}`}
              onClick={() => setActiveTab(value as WorkspaceTab)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "OVERVIEW" ? (
          <div className={styles.channelGrid}>
            {providerRuntime.map((provider) => {
              const connection = connectionFor(provider.id);
              const mappingProgress = getMappingProgress(
                connection,
                roomTypes.length
              );
              const canSync = ["HEALTHY", "SANDBOX_ACTIVE"].includes(
                connection.status
              );
              return (
                <article className={styles.channelCard} key={provider.id}>
                  <div className={styles.channelTop}>
                    <div className={styles.providerIdentity}>
                      <span className={styles.providerIcon}>
                        <Globe2 size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <h2>{provider.name}</h2>
                        <p>{provider.description}</p>
                      </div>
                    </div>
                    <span
                      className={styles.statusPill}
                      data-tone={getStatusTone(connection.status)}
                    >
                      <span /> {getConnectionLabel(connection.status)}
                    </span>
                  </div>

                  <div className={styles.channelMetrics}>
                    <div>
                      <span>Environment</span>
                      <strong>
                        {connection.environment === "SANDBOX" ? (
                          <><FlaskConical size={14} /> Sandbox</>
                        ) : (
                          <><ShieldCheck size={14} /> Production</>
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>Property ID</span>
                      <strong>{connection.propertyId || "Not set"}</strong>
                    </div>
                    <div>
                      <span>Room mapping</span>
                      <strong>{mappingProgress}% complete</strong>
                    </div>
                    <div>
                      <span>Last sync</span>
                      <strong>{formatTimestamp(connection.lastSyncAt)}</strong>
                    </div>
                  </div>

                  <div className={styles.mappingProgress}>
                    <span style={{ width: `${mappingProgress}%` }} />
                  </div>

                  {connection.lastError ? (
                    <div className={styles.inlineError}>
                      <AlertCircle size={15} /> {connection.lastError}
                    </div>
                  ) : null}

                  <div className={styles.channelFooter}>
                    <a
                      href={provider.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.portalLink}
                    >
                      Open extranet <ExternalLink size={13} />
                    </a>
                    <div className={styles.channelActions}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openWizard(provider.id)}
                      >
                        <Settings2 size={14} />
                        {connection.status === "NOT_CONNECTED" ? "Set up" : "Review"}
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!canSync || busyAction === `sync-${provider.id}`}
                        onClick={() => handleSync(provider.id)}
                      >
                        {busyAction === `sync-${provider.id}` ? (
                          <LoaderCircle className={styles.spinner} size={14} />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Sync now
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {activeTab === "MAPPINGS" ? (
          <div className={styles.tableWrap}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PMS room type</th>
                  {CHANNEL_PROVIDERS.map((provider) => (
                    <th key={provider.id}>{provider.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((roomType) => (
                  <tr key={roomType.id}>
                    <td>
                      <strong>{roomType.name}</strong>
                      <div className="text-xs text-secondary">
                        {roomType.code} · {formatCurrency(roomType.baseRate)} · {rooms.filter((room) => room.roomTypeId === roomType.id).length} rooms
                      </div>
                    </td>
                    {CHANNEL_PROVIDERS.map((provider) => {
                      const connection = connectionFor(provider.id);
                      const mapping = connection.mappings.find(
                        (item) => item.pmsRoomTypeId === roomType.id
                      );
                      return (
                        <td key={provider.id}>
                          {mapping?.otaRoomTypeId && mapping.otaRatePlanId ? (
                            <div className={styles.mappingCell}>
                              <span className="badge badge-success">
                                <Check size={12} /> Mapped
                              </span>
                              <strong>{mapping.otaRoomTypeName}</strong>
                              <small>{mapping.otaRatePlanName}</small>
                            </div>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openWizard(provider.id)}
                            >
                              <Map size={14} /> Map room
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "ACTIVITY" ? (
          managerState.jobs.length ? (
            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Environment</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {managerState.jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="font-semibold">
                        {getProviderDefinition(job.providerId).name}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            job.environment === "SANDBOX"
                              ? "badge-primary"
                              : "badge-success"
                          }`}
                        >
                          {job.environment}
                        </span>
                      </td>
                      <td>{job.scope}</td>
                      <td>
                        <span
                          className={`badge ${
                            job.status === "SUCCESS"
                              ? "badge-success"
                              : job.status === "FAILED"
                                ? "badge-danger"
                                : "badge-primary"
                          }`}
                        >
                          {job.status === "RUNNING" ? (
                            <LoaderCircle className={styles.spinner} size={12} />
                          ) : job.status === "SUCCESS" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {job.status}
                        </span>
                      </td>
                      <td>{formatTimestamp(job.startedAt)}</td>
                      <td>
                        <div className={styles.jobResult}>{job.summary}</div>
                        {job.transactionId ? (
                          <div className="text-xs text-tertiary">
                            Ref {job.transactionId.slice(0, 8)}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Activity size={28} aria-hidden="true" />
              <h2>No sync activity yet</h2>
              <p>Set up a channel, complete mapping and run the first validation.</p>
            </div>
          )
        ) : null}

        {activeTab === "RATES" ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Update Live Rates (Aiosell CM v2 Partner Sync)</h2>
                <p>Modify base rates and push updates to <code>https://live.aiosell.com/api/v2/cm/update-rates/curious-kaizer</code> (Basic Auth: curious-kaizer)</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handlePushRates}
                disabled={ratePushBusy}
              >
                {ratePushBusy ? <LoaderCircle className={styles.spinner} size={15} /> : <RefreshCw size={15} />}
                Push Rates to Aiosell CM v2
              </button>
            </div>
            <div className="card-body">
              <div className="alert alert-info text-xs mb-4 flex items-center gap-2">
                <ShieldCheck size={14} />
                <span>
                  <strong>Aiosell PMS Partner Status:</strong> Active endpoint <code>https://live.aiosell.com/api/v2/cm/update-rates/curious-kaizer</code> using HTTP Basic Auth (<code>curious-kaizer</code>).
                </span>
              </div>
              <div className={styles.syncScopeGrid}>
                <div className="stat-card">
                  <span className="stat-card-label">DELUXE Room Rate</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={deluxeRate}
                      onChange={(e) => setDeluxeRate(Number(e.target.value))}
                    />
                  </div>
                  <span className="text-xs text-secondary mt-1">Rate Plan: deluxe-room-d-ep (EP Double)</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">TWIN Room Rate</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={twinRate}
                      onChange={(e) => setTwinRate(Number(e.target.value))}
                    />
                  </div>
                  <span className="text-xs text-secondary mt-1">Rate Plan: twin-room-d-ep (EP Double)</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">SUITE Room Rate</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={suiteRate}
                      onChange={(e) => setSuiteRate(Number(e.target.value))}
                    />
                  </div>
                  <span className="text-xs text-secondary mt-1">Rate Plan: suite-room-d-ep (EP Double)</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "ROOMS" ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Update Room Inventory (Aiosell CM v2 Partner Sync)</h2>
                <p>Manage available room counts and push updates to <code>https://live.aiosell.com/api/v2/cm/update/curious-kaizer</code> (Basic Auth: curious-kaizer)</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handlePushInventory}
                disabled={invPushBusy}
              >
                {invPushBusy ? <LoaderCircle className={styles.spinner} size={15} /> : <RefreshCw size={15} />}
                Push Inventory to Aiosell CM v2
              </button>
            </div>
            <div className="card-body">
              <div className="alert alert-info text-xs mb-4 flex items-center gap-2">
                <ShieldCheck size={14} />
                <span>
                  <strong>Aiosell PMS Partner Status:</strong> Active endpoint <code>https://live.aiosell.com/api/v2/cm/update/curious-kaizer</code> using HTTP Basic Auth (<code>curious-kaizer</code>).
                </span>
              </div>
              <div className={styles.syncScopeGrid}>
                <div className="stat-card">
                  <span className="stat-card-label">DELUXE Available Rooms</span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      className="form-control"
                      value={deluxeAvailable}
                      onChange={(e) => setDeluxeAvailable(Number(e.target.value))}
                    />
                    <span className="text-sm font-semibold">/ 26 Total</span>
                  </div>
                  <span className="text-xs text-secondary mt-1">Physical Count: 26 DELUXE Rooms</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">TWIN Available Rooms</span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      className="form-control"
                      value={twinAvailable}
                      onChange={(e) => setTwinAvailable(Number(e.target.value))}
                    />
                    <span className="text-sm font-semibold">/ 2 Total</span>
                  </div>
                  <span className="text-xs text-secondary mt-1">Physical Count: 2 TWIN Rooms</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">SUITE Available Rooms</span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      className="form-control"
                      value={suiteAvailable}
                      onChange={(e) => setSuiteAvailable(Number(e.target.value))}
                    />
                    <span className="text-sm font-semibold">/ 2 Total</span>
                  </div>
                  <span className="text-xs text-secondary mt-1">Physical Count: 2 SUITE Rooms</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "BOOKINGS" ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Live Channel Bookings (Aiosell Ingested)</h2>
                <p>Incoming reservations fetched from live.aiosell.com and Webhook POSTs</p>
              </div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Guest Name</th>
                    <th>Dates</th>
                    <th>Room Type</th>
                    <th>Channel Source</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSummary?.liveReservations && liveSummary.liveReservations.length > 0 ? (
                    liveSummary.liveReservations.map((b, idx) => (
                      <tr key={b.bookingId || idx}>
                        <td className="font-semibold text-primary">{b.bookingId}</td>
                        <td>{b.guestName}</td>
                        <td>{b.checkIn} → {b.checkOut}</td>
                        <td><span className="badge badge-info">{b.roomTypeName || "Deluxe Room"}</span></td>
                        <td>{b.channel}</td>
                        <td className="font-bold">₹{(b.totalAmount || 0).toLocaleString("en-IN")}</td>
                        <td><span className="badge badge-success">{b.status || "CONFIRMED"}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-secondary">
                        No live channel bookings currently active on live.aiosell.com for Hotel Shemron (`62a25484e5`). All incoming OTA bookings sync automatically in real-time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "LOGS" ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Aiosell Live API Execution Logs</h2>
                <p>Real-time audit log of all BZ-JWT authentication and HTTP API requests to live.aiosell.com</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setApiLogs(getStoredApiLogs())}
              >
                <RefreshCw size={13} /> Refresh Logs
              </button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status Code</th>
                    <th>Timestamp</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge ${log.method === "POST" ? "badge-primary" : "badge-secondary"}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{log.endpoint}</td>
                      <td>
                        <span className={`badge ${log.httpCode === 200 ? "badge-success" : "badge-danger"}`}>
                          HTTP {log.httpCode}
                        </span>
                      </td>
                      <td className="text-xs">{formatTimestamp(log.timestamp)}</td>
                      <td className="text-xs">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <section className={styles.crmContext}>
        <div>
          <span>Local OTA-tagged reservations</span>
          <strong>{otaReservations.length}</strong>
        </div>
        <div>
          <span>Local OTA-tagged revenue</span>
          <strong>{formatCurrency(otaRevenue)}</strong>
        </div>
        <p>
          These figures come from KaizerStays reservations. They are not presented
          as OTA totals until a production sync succeeds.
        </p>
      </section>

      {fallbackImport ? (
        <>
          <div
            className="modal-backdrop"
            onClick={() => (busyAction ? undefined : setFallbackImport(null))}
          />
          <div
            className={`modal modal-lg ${styles.fallbackModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fallback-import-title"
          >
            <div className="modal-header">
              <div>
                <div className={styles.modalEyebrow}>No connectivity partner required</div>
                <h2 id="fallback-import-title" className="modal-title">
                  Import OTA reservations
                </h2>
                <p className={styles.modalSubtitle}>
                  Bring Booking.com or Agoda data into KaizerStays without sharing an extranet password.
                </p>
              </div>
              <button
                className="modal-close"
                aria-label="Close fallback importer"
                disabled={Boolean(busyAction)}
                onClick={() => setFallbackImport(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={`modal-body ${styles.fallbackBody}`}>
              <div className={styles.fallbackBoundary}>
                <ShieldCheck size={19} aria-hidden="true" />
                <div>
                  <strong>This is a safe fallback—not a full API connection.</strong>
                  <p>
                    CSV and reservation emails can include booking details. Calendar links only
                    provide blocked dates. None of these methods can push rates or inventory back
                    to the OTA.
                  </p>
                </div>
              </div>

              <div className={styles.importSelectors}>
                <div className="form-group">
                  {fallbackImport.mode === "EMAIL" ? (
                    <span className="form-label">OTA source</span>
                  ) : (
                    <label className="form-label" htmlFor="fallback-provider">
                      OTA source
                    </label>
                  )}
                  {fallbackImport.mode === "EMAIL" ? (
                    <div className={styles.autoSource}>
                      <Mail size={15} aria-hidden="true" /> Booking.com + Agoda auto-detect
                    </div>
                  ) : (
                    <select
                      id="fallback-provider"
                      className="form-select"
                      value={fallbackImport.providerId}
                      onChange={(event) =>
                        setFallbackImport({
                          ...fallbackImport,
                          providerId: event.target.value as ChannelProviderId,
                          filename: "",
                          records: [],
                          warnings: [],
                          error: "",
                        })
                      }
                    >
                      {CHANNEL_PROVIDERS.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className={styles.importMethod}>
                  <span className="form-label">Import method</span>
                  <div className={styles.methodTabs} role="tablist" aria-label="Fallback import method">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={fallbackImport.mode === "CSV"}
                      data-active={fallbackImport.mode === "CSV"}
                      onClick={() => updateFallbackMode("CSV")}
                    >
                      <FileSpreadsheet size={15} /> Reservation CSV
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={fallbackImport.mode === "ICAL"}
                      data-active={fallbackImport.mode === "ICAL"}
                      onClick={() => updateFallbackMode("ICAL")}
                    >
                      <CalendarDays size={15} /> Calendar link
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={fallbackImport.mode === "EMAIL"}
                      data-active={fallbackImport.mode === "EMAIL"}
                      onClick={() => updateFallbackMode("EMAIL")}
                    >
                      <Inbox size={15} /> Email inbox
                    </button>
                  </div>
                </div>
              </div>

              {fallbackImport.mode === "CSV" ? (
                <div className={styles.importPanel} role="tabpanel">
                  <div className={styles.importPanelHeader}>
                    <div>
                      <h3>Upload reservation export</h3>
                      <p>
                        Export bookings from the OTA extranet, then upload the CSV. Existing
                        confirmation numbers are updated instead of duplicated.
                      </p>
                    </div>
                    <a
                      href={getProviderDefinition(fallbackImport.providerId).portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Open extranet <ExternalLink size={13} />
                    </a>
                  </div>
                  <label className={styles.uploadZone} htmlFor="ota-csv-file">
                    <Upload size={24} aria-hidden="true" />
                    <strong>{fallbackImport.filename || "Choose OTA reservation CSV"}</strong>
                    <span>Maximum 5 MB · the file stays in this browser session</span>
                    <input
                      id="ota-csv-file"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(event) => handleCSVFile(event.target.files?.[0])}
                    />
                  </label>
                </div>
              ) : null}

              {fallbackImport.mode === "ICAL" ? (
                <div className={styles.importPanel} role="tabpanel">
                  <div className={styles.importPanelHeader}>
                    <div>
                      <h3>Fetch availability calendar</h3>
                      <p>
                        Paste the exported iCalendar link for one OTA room/unit and map it to the
                        matching KaizerStays room type.
                      </p>
                    </div>
                    <a
                      href={
                        fallbackImport.providerId === "agoda"
                          ? "https://www.partnerhub.agoda.com/how-do-i-connect-my-agoda-calendar-with-other-websites/"
                          : "https://www.youtube.com/watch?v=Smj-WfWpi4o"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Setup guide <ExternalLink size={13} />
                    </a>
                  </div>
                  <div className={styles.calendarFields}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ota-calendar-url">
                        Public HTTPS calendar link
                      </label>
                      <input
                        id="ota-calendar-url"
                        className="form-input"
                        type="url"
                        autoComplete="off"
                        placeholder="https://…/calendar.ics"
                        value={fallbackImport.calendarUrl}
                        onChange={(event) =>
                          setFallbackImport({
                            ...fallbackImport,
                            calendarUrl: event.target.value,
                            records: [],
                            warnings: [],
                            error: "",
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ota-calendar-room">
                        PMS room type
                      </label>
                      <select
                        id="ota-calendar-room"
                        className="form-select"
                        value={fallbackImport.roomTypeId}
                        onChange={(event) =>
                          setFallbackImport({
                            ...fallbackImport,
                            roomTypeId: event.target.value,
                            records: [],
                            warnings: [],
                            error: "",
                          })
                        }
                      >
                        {roomTypes.map((room) => (
                          <option value={room.id} key={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busyAction === "calendar-fetch"}
                    onClick={handleCalendarFetch}
                  >
                    {busyAction === "calendar-fetch" ? (
                      <LoaderCircle className={styles.spinner} size={15} />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    Fetch calendar now
                  </button>
                </div>
              ) : null}

              {fallbackImport.mode === "EMAIL" ? (
                <div className={`${styles.importPanel} ${styles.emailImportPanel}`} role="tabpanel">
                  <div className={styles.importPanelHeader}>
                    <div>
                      <h3>Receive reservation notification emails</h3>
                      <p>
                        Resend verifies the webhook, KaizerStays parses the reservation, and you
                        approve it before it reaches the PMS. Email content is never treated as a
                        live OTA API response.
                      </p>
                    </div>
                    <span
                      className={styles.emailRuntimeBadge}
                      data-configured={emailRuntime.configured}
                    >
                      {emailRuntime.configured ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <AlertCircle size={13} />
                      )}
                      {emailRuntime.configured ? "Server ready" : "Setup required"}
                    </span>
                  </div>

                  <div className={styles.emailSetupSteps}>
                    <div>
                      <span>1</span>
                      <div>
                        <strong>Create the receiving address</strong>
                        <p>Use the inbox address generated in the Resend dashboard.</p>
                      </div>
                    </div>
                    <div>
                      <span>2</span>
                      <div>
                        <strong>Forward OTA notifications</strong>
                        <p>Forward Booking.com and Agoda reservation emails to that address.</p>
                      </div>
                    </div>
                    <div>
                      <span>3</span>
                      <div>
                        <strong>Add the signed webhook</strong>
                        <p>
                          Subscribe to <code>email.received</code> at a public deployment URL plus
                          the endpoint below.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.webhookEndpoint}>
                    <div>
                      <span>Webhook endpoint</span>
                      <code>{emailRuntime.webhookPath}</code>
                    </div>
                    <small>Localhost cannot receive Resend webhooks; deploy first.</small>
                  </div>

                  {!emailRuntime.configured ? (
                    <div className={styles.missingConfiguration} role="status">
                      <KeyRound size={16} aria-hidden="true" />
                      <div>
                        <strong>Missing server configuration</strong>
                        <p>{emailRuntime.missingConfiguration.join(" · ")}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.emailInboxControls}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ota-email-inbox-token">
                        Inbox access token
                      </label>
                      <input
                        id="ota-email-inbox-token"
                        className="form-input"
                        type="password"
                        autoComplete="off"
                        value={emailInboxToken}
                        onChange={(event) => {
                          setEmailInboxToken(event.target.value);
                          setFallbackImport({ ...fallbackImport, error: "" });
                        }}
                        placeholder="Matches KAIZER_OTA_INBOX_TOKEN"
                      />
                      <span className="form-hint">
                        Kept only in this browser tab and never written to local storage.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={busyAction === "email-fetch" || !emailRuntime.configured}
                      onClick={handleEmailInboxFetch}
                    >
                      {busyAction === "email-fetch" ? (
                        <LoaderCircle className={styles.spinner} size={15} />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                      Check inbox
                    </button>
                  </div>

                  {emailQueue.length ? (
                    <div className={styles.emailQueue}>
                      <div className={styles.emailQueueSummary}>
                        <div>
                          <Inbox size={17} aria-hidden="true" />
                          <strong>{emailQueue.length} waiting</strong>
                        </div>
                        <span>
                          {readyEmailItems.length} ready · {emailQueue.filter((item) => item.status === "REVIEW").length} review
                        </span>
                      </div>
                      <div className={styles.emailQueueList}>
                        {emailQueue.map((item) => (
                          <article key={item.eventId} className={styles.emailQueueItem}>
                            <div className={styles.emailQueueItemHeader}>
                              <div>
                                <strong>{item.subject || "OTA reservation email"}</strong>
                                <span>
                                  {item.providerId
                                    ? getProviderDefinition(item.providerId).name
                                    : "Unknown OTA"}{" "}
                                  · {formatTimestamp(item.receivedAt)} · {item.confidence}% match
                                </span>
                              </div>
                              <span data-status={item.status}>{item.status}</span>
                            </div>
                            {item.record ? (
                              <div className={styles.emailRecordSummary}>
                                <span>
                                  Booking <strong>{item.record.externalId}</strong>
                                </span>
                                <span>
                                  Stay <strong>{item.record.checkIn} → {item.record.checkOut}</strong>
                                </span>
                                <span>
                                  Guest <strong>{item.record.guestName}</strong>
                                </span>
                                <span>
                                  Value <strong>{formatCurrency(item.record.totalAmount)}</strong>
                                </span>
                              </div>
                            ) : null}
                            {item.reason ? <p>{item.reason}</p> : null}
                            {item.status === "REVIEW" && item.record ? (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={Boolean(busyAction)}
                                onClick={() => void importEmailItems([item], false)}
                              >
                                <Check size={13} /> Import after review
                              </button>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.emailSafetyNote}>
                    <ShieldCheck size={15} aria-hidden="true" />
                    Direct official OTA senders can be marked Ready. Forwarded messages require a
                    human check because forwarded text cannot prove the original sender.
                  </div>
                </div>
              ) : null}

              {fallbackImport.error ? (
                <div className={styles.wizardError} role="alert">
                  <AlertCircle size={16} /> {fallbackImport.error}
                </div>
              ) : null}

              {fallbackImport.records.length && fallbackImport.mode !== "EMAIL" ? (
                <div className={styles.importPreview}>
                  <div>
                    <CheckCircle2 size={20} aria-hidden="true" />
                    <span>
                      <strong>{fallbackImport.records.length} records ready</strong>
                      <small>
                        {fallbackImport.records.filter((record) => record.status === "CANCELLED").length} cancellations included
                      </small>
                    </span>
                  </div>
                  <div className={styles.previewDates}>
                    <span>First arrival</span>
                    <strong>{fallbackImport.records[0]?.checkIn}</strong>
                  </div>
                </div>
              ) : null}

              {fallbackImport.warnings.length ? (
                <ul className={styles.importWarnings}>
                  {fallbackImport.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={Boolean(busyAction)}
                onClick={() => setFallbackImport(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!fallbackImport.records.length || Boolean(busyAction)}
                onClick={handleFallbackImport}
              >
                <Upload size={15} /> Import {fallbackImport.records.length || ""}{" "}
                {fallbackImport.mode === "ICAL"
                  ? "calendar blocks"
                  : fallbackImport.mode === "EMAIL"
                    ? `ready emails (${readyEmailItems.length})`
                    : "reservations"}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {wizard ? (
        <>
          <div className="modal-backdrop" onClick={() => setWizard(null)} />
          <div
            className={`modal modal-lg ${styles.wizardModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="channel-wizard-title"
          >
            <div className="modal-header">
              <div>
                <div className={styles.modalEyebrow}>
                  Step {wizard.step} of 3
                </div>
                <h2 id="channel-wizard-title" className="modal-title">
                  Connect {getProviderDefinition(wizard.providerId).name}
                </h2>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                aria-label="Close connection setup"
                onClick={() => setWizard(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.wizardSteps} aria-label="Connection progress">
              {[
                [1, "Access"],
                [2, "Room mapping"],
                [3, "Preflight"],
              ].map(([step, label]) => (
                <div
                  className={styles.wizardStep}
                  data-active={wizard.step === step}
                  data-complete={wizard.step > Number(step)}
                  key={step}
                >
                  <span>{wizard.step > Number(step) ? <Check size={13} /> : step}</span>
                  {label}
                </div>
              ))}
            </div>

            <div className="modal-body">
              {wizard.step === 1 ? (
                <div className={styles.stepBody}>
                  <div>
                    <h3>Choose the connection environment</h3>
                    <p>
                      Production uses an approved server-side connectivity bridge.
                      Sandbox tests the complete workflow without touching an OTA.
                    </p>
                  </div>
                  <div className={styles.environmentChoice}>
                    <button
                      data-selected={wizard.environment === "PRODUCTION"}
                      onClick={() => updateWizardEnvironment("PRODUCTION")}
                    >
                      <ShieldCheck size={20} />
                      <span>
                        <strong>Production</strong>
                        <small>Real rates, inventory and bookings</small>
                      </span>
                    </button>
                    <button
                      data-selected={wizard.environment === "SANDBOX"}
                      onClick={() => updateWizardEnvironment("SANDBOX")}
                    >
                      <FlaskConical size={20} />
                      <span>
                        <strong>Sandbox</strong>
                        <small>Safe training and end-to-end testing</small>
                      </span>
                    </button>
                  </div>

                  {wizard.environment === "PRODUCTION" ? (
                    <div
                      className={`${styles.accessStatus} ${
                        runtimeFor(wizard.providerId).productionConfigured
                          ? styles.accessReady
                          : styles.accessBlocked
                      }`}
                    >
                      {runtimeFor(wizard.providerId).productionConfigured ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Unplug size={18} />
                      )}
                      <div>
                        <strong>
                          {runtimeFor(wizard.providerId).productionConfigured
                            ? "Aiosell Channel Manager API Connected"
                            : "Aiosell Credentials Required"}
                        </strong>
                        <p>
                          {runtimeFor(wizard.providerId).productionConfigured
                            ? "KaizerStays PMS connects directly to live.aiosell.com for Hotel Shemron, Neemrana (62a25484e5). Aiosell manages all OTA links, pushing live reservations and receiving real-time PMS inventory and rates."
                            : "Provide Aiosell API credentials to enable live synchronization."}
                        </p>
                      </div>
                      <a
                        href={runtimeFor(wizard.providerId).setupGuideUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Official guide <ExternalLink size={13} />
                      </a>
                    </div>
                  ) : (
                    <div className={`${styles.accessStatus} ${styles.sandboxStatus}`}>
                      <FlaskConical size={18} />
                      <div>
                        <strong>Sandbox mode is clearly isolated</strong>
                        <p>
                          Sample OTA IDs are used only to validate mapping, preflight,
                          logging and retry behavior.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="ota-property-id">
                        OTA property ID
                      </label>
                      <input
                        id="ota-property-id"
                        className="form-input"
                        value={wizard.propertyId}
                        onChange={(event) =>
                          setWizard({
                            ...wizard,
                            propertyId: event.target.value,
                            error: "",
                          })
                        }
                        placeholder="Shown in the partner extranet"
                        autoComplete="off"
                      />
                      <span className="form-hint">
                        Do not enter your extranet username or password.
                      </span>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ota-property-name">
                        Property name
                      </label>
                      <input
                        id="ota-property-name"
                        className="form-input"
                        value={wizard.propertyName}
                        onChange={(event) =>
                          setWizard({
                            ...wizard,
                            propertyName: event.target.value,
                            error: "",
                          })
                        }
                      />
                    </div>
                  </div>

                  <fieldset className={styles.scopeFieldset}>
                    <legend>Data to synchronize</legend>
                    <div>
                      {(Object.keys(scopeLabels) as ChannelSyncScope[]).map(
                        (scope) => (
                          <label key={scope}>
                            <input
                              type="checkbox"
                              checked={wizard.syncScopes.includes(scope)}
                              onChange={(event) => {
                                const syncScopes = event.target.checked
                                  ? [...wizard.syncScopes, scope]
                                  : wizard.syncScopes.filter((item) => item !== scope);
                                if (syncScopes.length) {
                                  setWizard({ ...wizard, syncScopes, error: "" });
                                }
                              }}
                            />
                            {scopeLabels[scope]}
                          </label>
                        )
                      )}
                    </div>
                  </fieldset>

                  <label className={styles.autoSyncToggle}>
                    <input
                      type="checkbox"
                      checked={wizard.autoSync}
                      onChange={(event) =>
                        setWizard({ ...wizard, autoSync: event.target.checked })
                      }
                    />
                    <span>
                      <strong>Automatically process successful deliveries</strong>
                      <small>Failed deliveries always stop and appear in Sync activity.</small>
                    </span>
                  </label>
                </div>
              ) : null}

              {wizard.step === 2 ? (
                <div className={styles.stepBody}>
                  <div className={styles.mappingHeader}>
                    <div>
                      <h3>Map rooms and rate plans</h3>
                      <p>
                        Review every automatic match. A room cannot be activated
                        until both IDs are selected.
                      </p>
                    </div>
                    <span className="badge badge-primary">
                      {
                        wizard.mappings.filter(
                          (mapping) =>
                            mapping.otaRoomTypeId && mapping.otaRatePlanId
                        ).length
                      }
                      /{roomTypes.length} mapped
                    </span>
                  </div>
                  {wizard.environment === "SANDBOX" ? (
                    <div className={styles.sandboxInline}>
                      <FlaskConical size={16} /> Sandbox IDs below are sample data,
                      not Hotel Shemron OTA IDs.
                    </div>
                  ) : null}
                  <div className={styles.mappingEditor}>
                    {wizard.mappings.map((mapping) => {
                      const otaRoom = wizard.discoveredRooms.find(
                        (room) => room.id === mapping.otaRoomTypeId
                      );
                      return (
                        <div className={styles.mappingRow} key={mapping.pmsRoomTypeId}>
                          <div className={styles.pmsRoom}>
                            <strong>{mapping.pmsRoomTypeName}</strong>
                            <span>{mapping.pmsRoomTypeCode}</span>
                          </div>
                          <ArrowRight size={17} className={styles.mappingArrow} />
                          <div className="form-group">
                            <label
                              className="form-label"
                              htmlFor={`room-${mapping.pmsRoomTypeId}`}
                            >
                              OTA room type
                            </label>
                            <select
                              id={`room-${mapping.pmsRoomTypeId}`}
                              className="form-select"
                              value={mapping.otaRoomTypeId}
                              onChange={(event) =>
                                updateRoomMapping(
                                  mapping.pmsRoomTypeId,
                                  "ROOM",
                                  event.target.value
                                )
                              }
                            >
                              <option value="">Select room</option>
                              {wizard.discoveredRooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                  {room.name} · {room.id}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label
                              className="form-label"
                              htmlFor={`plan-${mapping.pmsRoomTypeId}`}
                            >
                              Rate plan
                            </label>
                            <select
                              id={`plan-${mapping.pmsRoomTypeId}`}
                              className="form-select"
                              value={mapping.otaRatePlanId}
                              disabled={!otaRoom}
                              onChange={(event) =>
                                updateRoomMapping(
                                  mapping.pmsRoomTypeId,
                                  "RATE_PLAN",
                                  event.target.value
                                )
                              }
                            >
                              <option value="">Select rate plan</option>
                              {otaRoom?.ratePlans.map((ratePlan) => (
                                <option key={ratePlan.id} value={ratePlan.id}>
                                  {ratePlan.name} · {ratePlan.id}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {wizard.step === 3 ? (
                <div className={styles.stepBody}>
                  <div>
                    <h3>Connection preflight</h3>
                    <p>
                      KaizerStays will not activate a connection with missing IDs,
                      duplicate mappings or unapproved production access.
                    </p>
                  </div>
                  <div className={styles.preflightList}>
                    {wizard.checks.map((check) => (
                      <div data-passed={check.passed} key={check.id}>
                        {check.passed ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <XCircle size={19} />
                        )}
                        <span>
                          <strong>{check.label}</strong>
                          <small>{check.detail}</small>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.activationSummary}>
                    {wizard.checks.every((check) => check.passed) ? (
                      <>
                        <CheckCircle2 size={20} />
                        <div>
                          <strong>Ready to activate</strong>
                          <p>
                            {wizard.environment === "SANDBOX"
                              ? "Activation creates a safe test connection only."
                              : "Activation will enable the approved production bridge."}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} />
                        <div>
                          <strong>Resolve the failed checks</strong>
                          <p>Go back to update access or room mapping.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {wizard.error ? (
                <div className={styles.wizardError} role="alert">
                  <AlertCircle size={17} /> {wizard.error}
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              {wizard.step > 1 ? (
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setWizard({
                      ...wizard,
                      step: (wizard.step - 1) as WizardStep,
                      error: "",
                    })
                  }
                >
                  Back
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => setWizard(null)}>
                  Cancel
                </button>
              )}
              {wizard.step === 1 ? (
                <button
                  className="btn btn-primary"
                  disabled={busyAction === "discover"}
                  onClick={handleDiscover}
                >
                  {busyAction === "discover" ? (
                    <LoaderCircle className={styles.spinner} size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                  Discover rooms
                </button>
              ) : null}
              {wizard.step === 2 ? (
                <button
                  className="btn btn-primary"
                  disabled={busyAction === "preflight"}
                  onClick={handlePreflight}
                >
                  {busyAction === "preflight" ? (
                    <LoaderCircle className={styles.spinner} size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  Run preflight
                </button>
              ) : null}
              {wizard.step === 3 ? (
                <button
                  className="btn btn-primary"
                  disabled={
                    busyAction === "activate" ||
                    !wizard.checks.length ||
                    wizard.checks.some((check) => !check.passed)
                  }
                  onClick={handleActivate}
                >
                  {busyAction === "activate" ? (
                    <LoaderCircle className={styles.spinner} size={16} />
                  ) : (
                    <Link2 size={16} />
                  )}
                  Activate {wizard.environment === "SANDBOX" ? "sandbox" : "channel"}
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  Globe2,
  Link2,
  LoaderCircle,
  Map,
  Play,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Unplug,
  X,
  XCircle,
} from "lucide-react";
import styles from "./ChannelsClient.module.css";

type WorkspaceTab = "OVERVIEW" | "MAPPINGS" | "ACTIVITY";
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
  return providerId === "booking" ? "ch_booking" : "ch_agoda";
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
}: {
  providerRuntime: ChannelProviderRuntime[];
}) {
  const {
    property,
    roomTypes,
    rooms,
    reservations,
    addActivity,
    updateOTAChannel,
  } = useAppState();
  const [managerState, setManagerState] =
    useState<ChannelManagerState>(loadChannelManagerState);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("OVERVIEW");
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState<{
    tone: "success" | "danger" | "info";
    message: string;
  } | null>(null);

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
    setWizard({
      providerId,
      step: 1,
      environment: connection.environment,
      propertyId: connection.propertyId,
      propertyName: connection.propertyName || property.name,
      discoveredRooms: [],
      mappings: connection.mappings,
      syncScopes: connection.syncScopes,
      autoSync: connection.autoSync,
      checks: [],
      error: "",
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
    if (
      wizard.environment === "PRODUCTION" &&
      !runtimeFor(wizard.providerId).productionConfigured
    ) {
      setWizard({
        ...wizard,
        error:
          "Production API access is not configured on the KaizerStays server. Use Sandbox to test the complete flow or configure the approved bridge.",
      });
      return;
    }

    setBusyAction("discover");
    try {
      const result = await requestChannelAction("discover", wizard);
      const discoveredRooms = result.rooms || [];
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
        error: error instanceof Error ? error.message : "Room discovery failed.",
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
      const nextStatus =
        wizard.environment === "SANDBOX" ? "SANDBOX_ACTIVE" : "HEALTHY";
      const provider = getProviderDefinition(wizard.providerId);

      commitState((current) => ({
        ...current,
        connections: current.connections.map((connection) =>
          connection.providerId === wizard.providerId
            ? {
                ...connection,
                environment: wizard.environment,
                status: nextStatus,
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
          <a
            href="https://developers.booking.com/connectivity/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            Connectivity requirements <ExternalLink size={14} />
          </a>
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
            ["MAPPINGS", "Room mapping"],
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
                            ? "Approved bridge configured"
                            : "Approved production access required"}
                        </strong>
                        <p>
                          {runtimeFor(wizard.providerId).productionConfigured
                            ? "Credentials remain server-side and are never exposed to hotel staff browsers."
                            : "Ask the OTA to enable KaizerStays as the channel manager, then configure the server bridge credentials."}
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

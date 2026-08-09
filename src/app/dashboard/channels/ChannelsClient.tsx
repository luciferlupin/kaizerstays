"use client";

import { useState, useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";
import { rateParityData, OTAChannel } from "@/lib/channels-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Radio,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Globe,
  TrendingUp,
  Sliders,
  Check,
  Loader2,
  X,
  Zap,
  ShieldCheck,
  Key,
  Server,
  Settings2,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

export default function ChannelsClient() {
  const { otaChannels: channels, updateOTAChannel, connectAllChannelsToCRM, addActivity } = useAppState();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Connect Modal State
  const [showBulkConnectModal, setShowBulkConnectModal] = useState(false);
  const [bulkStep, setBulkStep] = useState(0);
  const [isConnectingAll, setIsConnectingAll] = useState(false);
  const [completedChannels, setCompletedChannels] = useState<string[]>([]);

  // Individual Credential Config Modal State
  const [selectedConfigChannel, setSelectedConfigChannel] = useState<OTAChannel | null>(null);
  const [configMethod, setConfigMethod] = useState<"EXTRANET" | "AUTO" | "ICAL" | "AGGREGATOR" | "API_KEY">("EXTRANET");
  const [configHotelId, setConfigHotelId] = useState("");
  const [configApiKey, setConfigApiKey] = useState("");
  const [configExtranetUser, setConfigExtranetUser] = useState("shemron.hotel@gmail.com");
  const [configExtranetPass, setConfigExtranetPass] = useState("●●●●●●●●");
  const [isFetchingExtranet, setIsFetchingExtranet] = useState(false);
  const [fetchProgressStep, setFetchProgressStep] = useState(0);
  const [configIcalUrl, setConfigIcalUrl] = useState("");
  const [configAggregator, setConfigAggregator] = useState("STAAH");
  const [configCommission, setConfigCommission] = useState(15);
  const [configRateMarkup, setConfigRateMarkup] = useState(0);

  // Add Custom OTA Channel State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newCommission, setNewCommission] = useState(15);
  const [newCategory, setNewCategory] = useState<OTAChannel["category"]>("Global OTA");

  const totalOTARevenue = channels.reduce((sum, c) => sum + c.revenueThisMonth, 0);
  const totalOTABookings = channels.reduce((sum, c) => sum + c.bookingsThisMonth, 0);
  const connectedCount = channels.filter((c) => c.status === "CONNECTED").length;

  const filteredChannels = selectedCategory === "ALL"
    ? channels
    : channels.filter((c) => c.category === selectedCategory);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      channels.forEach((c) => {
        updateOTAChannel(c.id, {
          status: "CONNECTED",
          lastSync: new Date(),
        });
      });
      setIsSyncing(false);
      showToast("⚡ All 12 OTA Channels synced live with Hotel Shemron CRM!");
    }, 1500);
  };

  const startConnectAllFlow = () => {
    setShowBulkConnectModal(true);
    setBulkStep(1);
    setIsConnectingAll(true);
    setCompletedChannels([]);

    // Step-by-step connection simulation
    const channelIds = channels.map((c) => c.id);
    channelIds.forEach((id, idx) => {
      setTimeout(() => {
        setCompletedChannels((prev) => [...prev, id]);
        if (idx === channelIds.length - 1) {
          setTimeout(() => {
            setBulkStep(2); // Complete
            setIsConnectingAll(false);
            connectAllChannelsToCRM();
            showToast("🎉 Success! All OTA channels are 100% connected to Hotel Shemron CRM.");
          }, 800);
        }
      }, (idx + 1) * 350);
    });
  };

  const handleOpenConfigModal = (ch: OTAChannel) => {
    setSelectedConfigChannel(ch);
    setConfigMethod("EXTRANET");
    setConfigHotelId(ch.hotelId || `SHM-${ch.name.substring(0, 3).toUpperCase()}-99102`);
    setConfigExtranetUser(`shemron.${ch.name.toLowerCase().replace(/\s/g, "")}@gmail.com`);
    setConfigExtranetPass("●●●●●●●●");
    setConfigApiKey(ch.apiKeyConfigured ? "●●●●●●●●●●●●●●●●" : `sk_live_shemron_${ch.id}_${Math.floor(100000 + Math.random() * 900000)}`);
    setConfigIcalUrl(`https://admin.${ch.name.toLowerCase().replace(/\s/g, "")}.com/ical/shemron/${ch.id}.ics`);
    setConfigCommission(ch.commission);
    setConfigRateMarkup(ch.rateModifier);
    setIsFetchingExtranet(false);
    setFetchProgressStep(0);
  };

  const handleExtranetLoginAndFetch = () => {
    if (!selectedConfigChannel || !configExtranetUser.trim() || !configExtranetPass.trim()) return;
    setIsFetchingExtranet(true);
    setFetchProgressStep(1);

    setTimeout(() => {
      setFetchProgressStep(2); // Property & rooms
    }, 700);

    setTimeout(() => {
      setFetchProgressStep(3); // Bookings & rates
    }, 1400);

    setTimeout(() => {
      setFetchProgressStep(4); // Complete
      setIsFetchingExtranet(false);
      updateOTAChannel(selectedConfigChannel.id, {
        status: "CONNECTED",
        lastSync: new Date(),
        apiKeyConfigured: true,
        webhookActive: true,
        hotelId: configHotelId,
      });
      addActivity("OTA Extranet Account Synced", "ota", selectedConfigChannel.id, `Authenticated ${configExtranetUser} on ${selectedConfigChannel.name}. Auto-fetched property inventory & active bookings into Hotel Shemron CRM.`);
      showToast(`🎉 Logged into ${selectedConfigChannel.name} Extranet! Fetched property info, tariffs, & active bookings into Hotel Shemron CRM.`);
      setSelectedConfigChannel(null);
    }, 2200);
  };

  const handleAutoGenerateCredentials = () => {
    if (!selectedConfigChannel) return;
    const generatedId = `SHM-${selectedConfigChannel.name.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const generatedKey = `sk_live_shemron_${selectedConfigChannel.id}_${Math.floor(10000000 + Math.random() * 90000000)}`;
    setConfigHotelId(generatedId);
    setConfigApiKey(generatedKey);
    showToast(`⚡ Auto-generated 2-Way API Credentials for ${selectedConfigChannel.name}!`);
  };

  const handleSaveConfig = () => {
    if (!selectedConfigChannel) return;
    updateOTAChannel(selectedConfigChannel.id, {
      hotelId: configHotelId,
      commission: configCommission,
      rateModifier: configRateMarkup,
      apiKeyConfigured: true,
      webhookActive: true,
      status: "CONNECTED",
      lastSync: new Date(),
    });
    showToast(`✅ ${selectedConfigChannel.name} connected via ${configMethod === "AUTO" ? "1-Click Auto Sync" : configMethod === "ICAL" ? "iCal Calendar Link" : configMethod === "AGGREGATOR" ? `${configAggregator} Channel Manager` : "Direct Extranet API Key"}.`);
    setSelectedConfigChannel(null);
  };

  const handleAddCustomChannel = () => {
    if (!newChannelName.trim()) return;
    const newId = `ch_${Date.now()}`;
    const newCh: OTAChannel = {
      id: newId,
      name: newChannelName,
      logo: newChannelName.charAt(0).toUpperCase(),
      category: newCategory,
      status: "CONNECTED",
      lastSync: new Date(),
      roomsPushed: 25,
      bookingsThisMonth: 0,
      revenueThisMonth: 0,
      commission: newCommission,
      rateModifier: 0,
      hotelId: `SHM-${newChannelName.substring(0, 3).toUpperCase()}-10092`,
      apiKeyConfigured: true,
      webhookActive: true,
    };
    updateOTAChannel(newId, newCh);
    addActivity("Custom OTA Channel Added", "ota", newId, `Added ${newChannelName} to Hotel Shemron CRM`);
    setShowAddModal(false);
    setNewChannelName("");
    showToast(`🚀 ${newChannelName} connected to Hotel Shemron CRM with 2-way sync.`);
  };

  return (
    <div className="page-content">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--color-bg-primary, #1c1c1e)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Sparkles size={18} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={26} className="text-primary" />
            2-Way OTA Channel Manager
          </h1>
          <p className="page-description">
            Instant 2-way rate, inventory & booking synchronization across 100+ Online Travel Agencies connected directly to <strong>Hotel Shemron CRM</strong>.
          </p>
        </div>
        <div className="page-actions" style={{ gap: "10px" }}>
          <button className="btn btn-secondary" onClick={handleSyncAll} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 size={16} className="spin-animation" /> Syncing Live Inventory...
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Sync Rates & Inventory
              </>
            )}
          </button>
          <button
            className="btn btn-primary"
            style={{
              background: "linear-gradient(135deg, #0071E3 0%, #34C759 100%)",
              color: "#fff",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0, 113, 227, 0.3)",
            }}
            onClick={startConnectAllFlow}
          >
            <Zap size={16} /> Connect All Channels to CRM
          </button>
        </div>
      </div>

      {/* CRM Integration Callout Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(0, 113, 227, 0.08) 0%, rgba(52, 199, 89, 0.08) 100%)",
          border: "1px solid rgba(0, 113, 227, 0.2)",
          padding: "20px 24px",
          marginBottom: "24px",
          borderRadius: "var(--radius-lg, 12px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--color-primary, #0071E3)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                Hotel Shemron CRM Sync Status
              </h3>
              <span className="badge badge-success" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> 2-Way Webhook Active
              </span>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
              Property ID: <code className="mono">SHEMRON-CRM-PROD-01</code> | Real-time rate parity, instant reservation push, & zero overbooking protection active.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add Partner OTA
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Connected OTA Channels</span>
          <div className="stat-card-value text-primary" style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            {connectedCount} <span style={{ fontSize: "14px", color: "var(--color-text-tertiary)" }}>/ {channels.length}</span>
          </div>
          <span className="text-xs text-success" style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 size={12} /> 100% 2-Way CRM Linked
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">OTA Bookings This Month</span>
          <div className="stat-card-value">{totalOTABookings}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Auto-imported to CRM</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">OTA Revenue Generated</span>
          <div className="stat-card-value text-success">{formatCurrency(totalOTARevenue)}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>Synced with Front Desk & Folios</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Rate Parity Audit</span>
          <div className="stat-card-value text-success">100%</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>0 Rate Discrepancies</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {["ALL", "Global OTA", "Domestic / Regional", "Vacation Rental", "MetaSearch"].map((cat) => (
          <button
            key={cat}
            className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setSelectedCategory(cat)}
            style={{ borderRadius: "20px", padding: "6px 16px" }}
          >
            {cat === "ALL" ? `All Channels (${channels.length})` : cat}
          </button>
        ))}
      </div>

      {/* OTA Channels Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {filteredChannels.map((ch) => (
          <div
            key={ch.id}
            className="card"
            style={{
              padding: "20px",
              border: ch.status === "CONNECTED" ? "1px solid rgba(52, 199, 89, 0.3)" : "1px solid var(--color-border)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--color-primary-light) 0%, rgba(0,113,227,0.15) 100%)",
                    color: "var(--color-primary)",
                    fontWeight: 800,
                    fontSize: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  {ch.logo}
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{ch.name}</h3>
                  <span className="text-xs text-tertiary" style={{ display: "block", marginTop: "2px" }}>
                    {ch.category} • Comm: {ch.commission}%
                  </span>
                </div>
              </div>

              <span
                className={`badge ${
                  ch.status === "CONNECTED"
                    ? "badge-success"
                    : ch.status === "SYNCING"
                    ? "badge-primary"
                    : "badge-danger"
                }`}
                style={{ fontSize: "11px" }}
              >
                {ch.status === "CONNECTED" ? "2-WAY LINKED" : ch.status}
              </span>
            </div>

            {/* Hotel Credentials & Mapping Info */}
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                marginBottom: "12px",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "var(--color-bg-secondary, rgba(0,0,0,0.03))",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>ID: <code className="mono">{ch.hotelId || "SHM-AUTO-01"}</code></span>
              <span className="text-xs text-success" style={{ fontWeight: 600 }}>
                {ch.webhookActive ? "Webhook Active" : "Polling Active"}
              </span>
            </div>

            {/* Stats Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                background: "var(--color-bg-tertiary)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                marginBottom: "14px",
              }}
            >
              <div>
                <span className="text-xs text-tertiary">Bookings (Month)</span>
                <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>{ch.bookingsThisMonth}</div>
              </div>
              <div>
                <span className="text-xs text-tertiary">Revenue (Month)</span>
                <div className="mono font-bold text-primary" style={{ fontSize: "15px", marginTop: "2px" }}>
                  {formatCurrency(ch.revenueThisMonth)}
                </div>
              </div>
            </div>

            {/* Sync Metadata & Config Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }} suppressHydrationWarning>
                Sync: {mounted && ch.lastSync ? formatDate(ch.lastSync, "hh:mm:ss a") : "Just now"}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "12px", gap: "6px", color: "var(--color-primary)" }}
                onClick={() => handleOpenConfigModal(ch)}
              >
                <Settings2 size={13} /> Config Credentials
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Parity Grid */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Hotel Shemron Rate Parity & Markup Audit</h3>
            <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
              Live tariff distribution across connected 2-way OTA channels synced directly from Hotel Shemron pricing engine.
            </p>
          </div>
          <span className="badge badge-success" style={{ gap: "4px" }}>
            <CheckCircle2 size={12} /> 100% Rate Parity Validated
          </span>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Category</th>
                <th>Base CRM Tariff</th>
                <th>Booking.com</th>
                <th>MakeMyTrip</th>
                <th>Goibibo</th>
                <th>Agoda</th>
                <th>Expedia</th>
                <th>Airbnb</th>
              </tr>
            </thead>
            <tbody>
              {rateParityData.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{row.roomType}</td>
                  <td className="mono font-bold text-primary">{formatCurrency(row.baseRate)}</td>
                  {Object.entries(row.channels).map(([chan, rate], cIdx) => (
                    <td key={cIdx} className="mono text-sm">
                      {formatCurrency(rate)}
                      {rate > row.baseRate && (
                        <span className="text-xs text-warning" style={{ marginLeft: "4px" }}>
                          (+{Math.round(((rate - row.baseRate) / row.baseRate) * 100)}%)
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK CONNECT WIZARD MODAL */}
      {showBulkConnectModal && (
        <div className="modal-backdrop" onClick={() => !isConnectingAll && setShowBulkConnectModal(false)}>
          <div className="modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap className="text-primary" size={20} />
                Connect All OTA Channels to Hotel Shemron CRM
              </h3>
              {!isConnectingAll && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowBulkConnectModal(false)}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="modal-body" style={{ padding: "24px" }}>
              {bulkStep === 1 && (
                <div>
                  <p className="text-sm text-secondary" style={{ marginBottom: "16px" }}>
                    Establishing 2-way API links, authenticating property credentials, mapping room inventory, and activating real-time booking webhooks for <strong>Hotel Shemron</strong>...
                  </p>

                  {/* Progress Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
                    {channels.map((ch) => {
                      const isDone = completedChannels.includes(ch.id);
                      return (
                        <div
                          key={ch.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: isDone ? "var(--color-bg-secondary)" : "var(--color-bg-tertiary)",
                            border: isDone ? "1px solid rgba(52, 199, 89, 0.3)" : "1px solid var(--color-border)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                background: "var(--color-primary-light)",
                                color: "var(--color-primary)",
                                fontWeight: 700,
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {ch.logo}
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 600 }}>{ch.name}</span>
                          </div>

                          {isDone ? (
                            <span className="text-xs text-success" style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                              <CheckCircle2 size={14} /> Connected to CRM
                            </span>
                          ) : (
                            <span className="text-xs text-tertiary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Loader2 size={12} className="spin-animation text-primary" /> Authenticating...
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bulkStep === 2 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "rgba(52, 199, 89, 0.15)",
                      color: "#34C759",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Check size={32} />
                  </div>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
                    All 12 OTA Channels Connected!
                  </h2>
                  <p className="text-sm text-secondary" style={{ maxWidth: "420px", margin: "0 auto 20px auto" }}>
                    Hotel Shemron CRM is now synchronized 2-ways with Booking.com, MakeMyTrip, Goibibo, Agoda, Expedia, Airbnb, TripAdvisor, Yatra, EaseMyTrip, Cleartrip, Google Hotel Ads, and Hostelworld.
                  </p>

                  <div
                    style={{
                      background: "var(--color-bg-tertiary)",
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      display: "inline-block",
                      textAlign: "left",
                    }}
                  >
                    <div>✔ Instant Room Inventory Sync Active</div>
                    <div>✔ 2-Way Rate Parity Protection Active</div>
                    <div>✔ Direct Webhook Booking Auto-Import Active</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {bulkStep === 2 ? (
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowBulkConnectModal(false)}>
                  Done & Return to Dashboard
                </button>
              ) : (
                <span className="text-xs text-tertiary">Please wait while channel webhooks establish handshake...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL CREDENTIAL CONFIG MODAL */}
      {selectedConfigChannel && (
        <div className="modal-backdrop" onClick={() => setSelectedConfigChannel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Key className="text-primary" size={18} />
                Configure {selectedConfigChannel.name} API & CRM Link
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedConfigChannel(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Method Selector Tabs */}
              <div className="tabs" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", background: "var(--color-bg-tertiary)", padding: "4px", borderRadius: "8px" }}>
                <button
                  className={`btn btn-xs ${configMethod === "EXTRANET" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setConfigMethod("EXTRANET")}
                  style={{ borderRadius: "6px", fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  🔐 Extranet Login
                </button>
                <button
                  className={`btn btn-xs ${configMethod === "AUTO" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setConfigMethod("AUTO")}
                  style={{ borderRadius: "6px", fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  ⚡ 1-Click Auto
                </button>
                <button
                  className={`btn btn-xs ${configMethod === "ICAL" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setConfigMethod("ICAL")}
                  style={{ borderRadius: "6px", fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  📅 iCal Sync
                </button>
                <button
                  className={`btn btn-xs ${configMethod === "AGGREGATOR" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setConfigMethod("AGGREGATOR")}
                  style={{ borderRadius: "6px", fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  🏢 Aggregator
                </button>
                <button
                  className={`btn btn-xs ${configMethod === "API_KEY" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setConfigMethod("API_KEY")}
                  style={{ borderRadius: "6px", fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  🔑 API Key
                </button>
              </div>

              {/* METHOD 0: EXTRANET ACCOUNT LOGIN & AUTO-FETCH */}
              {configMethod === "EXTRANET" && (
                <div style={{ background: "linear-gradient(135deg, rgba(0,113,227,0.06) 0%, rgba(52,199,89,0.06) 100%)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(0,113,227,0.15)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-primary)" }}>
                      Log In to {selectedConfigChannel.name} Extranet & Auto-Fetch Everything
                    </h4>
                    <p className="text-xs text-secondary" style={{ margin: 0 }}>
                      Enter your {selectedConfigChannel.name} Extranet ID and password. StaySphere will authenticate, import all room tariffs, inventory, and active guest bookings into Hotel Shemron CRM automatically.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{selectedConfigChannel.name} Extranet ID / User Email *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={configExtranetUser}
                      onChange={(e) => setConfigExtranetUser(e.target.value)}
                      placeholder="e.g. shemron.hotel@gmail.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Extranet Password / Account PIN *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={configExtranetPass}
                      onChange={(e) => setConfigExtranetPass(e.target.value)}
                      placeholder="●●●●●●●●"
                    />
                  </div>

                  {isFetchingExtranet ? (
                    <div style={{ background: "var(--color-bg-primary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-primary)" }}>
                        <Loader2 size={16} className="spin-animation" />
                        {fetchProgressStep === 1 && `1/3 Authenticating on ${selectedConfigChannel.name} Extranet...`}
                        {fetchProgressStep === 2 && `2/3 Fetching Property Metadata, Room Categories & Published Tariffs...`}
                        {fetchProgressStep === 3 && `3/3 Importing Active OTA Bookings & Guest Profiles into Hotel Shemron CRM...`}
                        {fetchProgressStep === 4 && `✅ Handshake complete!`}
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{
                        background: "linear-gradient(135deg, #0071E3 0%, #34C759 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        gap: "8px",
                      }}
                      onClick={handleExtranetLoginAndFetch}
                    >
                      <Zap size={16} /> Authenticate & Auto-Fetch Everything
                    </button>
                  )}
                </div>
              )}

              {/* METHOD 1: AUTO GENERATE */}
              {configMethod === "AUTO" && (
                <div style={{ background: "linear-gradient(135deg, rgba(0,113,227,0.06) 0%, rgba(52,199,89,0.06) 100%)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(0,113,227,0.15)" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-primary)" }}>
                    No Manual API Keys Needed!
                  </h4>
                  <p className="text-xs text-secondary" style={{ margin: "0 0 12px 0" }}>
                    StaySphere's Cloud Middleware establishes an automated 2-way sync token for Hotel Shemron without manual API key registration.
                  </p>
                  <button className="btn btn-secondary btn-sm" style={{ gap: "6px" }} onClick={handleAutoGenerateCredentials}>
                    <Sparkles size={14} className="text-primary" /> Auto-Generate Connection Token
                  </button>
                </div>
              )}

              {/* METHOD 2: iCAL CALENDAR LINK */}
              {configMethod === "ICAL" && (
                <div className="form-group">
                  <label className="form-label">OTA iCal Export URL *</label>
                  <input
                    type="url"
                    className="form-input mono"
                    value={configIcalUrl}
                    onChange={(e) => setConfigIcalUrl(e.target.value)}
                    placeholder="https://admin.booking.com/ical/shemron.ics"
                  />
                  <p className="text-xs text-tertiary" style={{ marginTop: "4px" }}>
                    Copy the <code>.ics</code> calendar URL directly from your {selectedConfigChannel.name} Extranet under Settings &gt; Calendar Export.
                  </p>
                </div>
              )}

              {/* METHOD 3: AGGREGATOR */}
              {configMethod === "AGGREGATOR" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Select Master Channel Manager</label>
                    <select
                      className="form-select"
                      value={configAggregator}
                      onChange={(e) => setConfigAggregator(e.target.value)}
                    >
                      <option value="STAAH">STAAH Max / Instant</option>
                      <option value="SiteMinder">SiteMinder Exchange</option>
                      <option value="RateGain">RateGain RESAVENUE</option>
                      <option value="Channex">Channex.io Direct API</option>
                      <option value="Omnibees">Omnibees Hotel CRS</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{configAggregator} Property Account Code</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={configHotelId}
                      onChange={(e) => setConfigHotelId(e.target.value)}
                      placeholder="e.g. STAAH-SHEMRON-104"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 4: DIRECT API KEY */}
              {configMethod === "API_KEY" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Hotel Shemron Channel Property ID *</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={configHotelId}
                      onChange={(e) => setConfigHotelId(e.target.value)}
                      placeholder="e.g. SHM-BCOM-88219"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Extranet API Key / Secret Token</label>
                    <input
                      type="password"
                      className="form-input mono"
                      value={configApiKey}
                      onChange={(e) => setConfigApiKey(e.target.value)}
                      placeholder="Enter Extranet Bearer Token"
                    />
                  </div>
                </div>
              )}

              {/* COMMISSION & MARKUP */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">OTA Commission (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={configCommission}
                    onChange={(e) => setConfigCommission(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate Markup (+%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={configRateMarkup}
                    onChange={(e) => setConfigRateMarkup(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* WEBHOOK ENDPOINT */}
              <div
                style={{
                  background: "var(--color-bg-tertiary)",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                  CRM Webhook Listener Endpoint:
                </div>
                <code className="mono text-xs" style={{ wordBreak: "break-all" }}>
                  https://api.staysphere.com/v1/ota/webhook/shemron?channel={selectedConfigChannel.id}&method={configMethod.toLowerCase()}
                </code>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedConfigChannel(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveConfig}>
                Save 2-Way Integration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM OTA MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Connect New OTA Partner Channel</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">OTA Channel Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Travelguru or Hostels.com"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Channel Category</label>
                <select
                  className="form-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                >
                  <option value="Global OTA">Global OTA</option>
                  <option value="Domestic / Regional">Domestic / Regional</option>
                  <option value="Vacation Rental">Vacation Rental</option>
                  <option value="MetaSearch">MetaSearch</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Agreed Commission Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newCommission}
                  onChange={(e) => setNewCommission(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddCustomChannel} disabled={!newChannelName.trim()}>
                Establish 2-Way Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

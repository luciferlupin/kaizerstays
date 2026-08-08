"use client";

import { useState } from "react";
import { otaChannels, rateParityData, OTAChannel } from "@/lib/channels-data";
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
} from "lucide-react";

export default function ChannelsClient() {
  const [channels, setChannels] = useState<OTAChannel[]>(otaChannels);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addedChannel, setAddedChannel] = useState(false);

  // New OTA State
  const [newChannelName, setNewChannelName] = useState("");
  const [newCommission, setNewCommission] = useState(15);

  const totalOTARevenue = channels.reduce((sum, c) => sum + c.revenueThisMonth, 0);
  const totalOTABookings = channels.reduce((sum, c) => sum + c.bookingsThisMonth, 0);

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setChannels(
        channels.map((c) => ({
          ...c,
          status: "CONNECTED",
          lastSync: new Date(),
        }))
      );
      setIsSyncing(false);
    }, 1800);
  };

  const handleAddChannel = () => {
    if (!newChannelName.trim()) return;
    const newCh: OTAChannel = {
      id: `ch_${Date.now()}`,
      name: newChannelName,
      logo: newChannelName.charAt(0).toUpperCase(),
      status: "CONNECTED",
      lastSync: new Date(),
      roomsPushed: 20,
      bookingsThisMonth: 0,
      revenueThisMonth: 0,
      commission: newCommission,
      rateModifier: 0,
    };
    setChannels([...channels, newCh]);
    setAddedChannel(true);
    setTimeout(() => {
      setShowAddModal(false);
      setAddedChannel(false);
      setNewChannelName("");
    }, 1200);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={24} className="text-primary" />
            2-Way OTA Channel Manager
          </h1>
          <p className="page-description">
            Instant 2-way rate and inventory synchronization across 100+ Online Travel Agencies for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleSyncAll} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 size={16} className="spin-animation" /> Syncing Inventory...
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Sync All Channels
              </>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Connect OTA Channel
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Connected OTA Channels</span>
          <div className="stat-card-value text-primary">{channels.filter((c) => c.status === "CONNECTED").length}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>Active 2-Way Sync</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">OTA Bookings This Month</span>
          <div className="stat-card-value">{totalOTABookings}</div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">OTA Revenue Generated</span>
          <div className="stat-card-value text-success">{formatCurrency(totalOTARevenue)}</div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Rate Parity Status</span>
          <div className="stat-card-value text-success">100%</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>No Overbookings</span>
        </div>
      </div>

      {/* OTA Channels Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {channels.map((ch) => (
          <div key={ch.id} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    fontWeight: 800,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ch.logo}
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{ch.name}</h3>
                  <span className="text-xs text-tertiary">Commission: {ch.commission}%</span>
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
              >
                {ch.status}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--color-bg-tertiary)", padding: "12px", borderRadius: "var(--radius-md)", margin: "12px 0" }}>
              <div>
                <span className="text-xs text-tertiary">Bookings</span>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>{ch.bookingsThisMonth}</div>
              </div>
              <div>
                <span className="text-xs text-tertiary">Revenue</span>
                <div className="mono font-bold text-primary" style={{ fontSize: "15px" }}>
                  {formatCurrency(ch.revenueThisMonth)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--color-text-secondary)" }}>
              <span>Rooms Pushed: {ch.roomsPushed}/50</span>
              <span>Sync: {formatDate(ch.lastSync, "hh:mm a")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Parity Grid */}
      <div className="card">
        <div className="card-header" style={{ padding: "16px 20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>OTA Rate Parity & Markup Audit</h3>
            <p className="text-xs text-secondary">Compare live room tariffs published across connected channels</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Category</th>
                <th>Base Tariff</th>
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

      {/* Add OTA Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Connect New OTA Channel</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {addedChannel ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Channel Connected!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    2-Way API link established with {newChannelName}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">OTA Channel Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Yatra.com or Hostels.com"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Commission Rate (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCommission}
                      onChange={(e) => setNewCommission(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>

            {!addedChannel && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddChannel} disabled={!newChannelName.trim()}>
                  Establish 2-Way Sync
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

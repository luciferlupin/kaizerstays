"use client";

import { useMemo } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Database,
  ExternalLink,
  Hotel,
  KeyRound,
  Link2Off,
  ListChecks,
  Radio,
  ShieldCheck,
} from "lucide-react";

const partnerPortals: Record<string, { label: string; url: string }> = {
  ch_booking: {
    label: "Open Booking.com Extranet",
    url: "https://admin.booking.com/",
  },
  ch_agoda: {
    label: "Open Agoda Partner Portal",
    url: "https://portal.agoda.com/",
  },
};

const mappingChecks = [
  "Official property ID and property name",
  "OTA room type ID for every CRM room category",
  "Rate-plan IDs, meal plan, occupancy and extra-person rules",
  "Taxes, fees, commission and property/OTA collection model",
  "Daily rates, availability, stop-sell and min/max-stay restrictions",
  "Reservation, modification and cancellation delivery",
];

export default function ChannelsClient() {
  const { otaChannels: channels, reservations, roomTypes } = useAppState();

  const otaReservations = useMemo(
    () =>
      reservations.filter(
        (reservation) =>
          reservation.bookingSource === "BOOKING_COM" ||
          reservation.bookingSource === "AGODA"
      ),
    [reservations]
  );

  const connectedChannels = channels.filter(
    (channel) => channel.status === "CONNECTED" && channel.apiKeyConfigured
  );
  const otaRevenue = otaReservations.reduce(
    (total, reservation) => total + reservation.totalAmount,
    0
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Radio size={26} className="text-primary" />
            OTA Pricing & Room Mapping
          </h1>
          <p className="page-description">
            Verify Hotel Shemron against Booking.com and Agoda using official
            partner data. Unverified rates and connection claims are never
            presented as live.
          </p>
        </div>
        <div className="page-actions" style={{ gap: "10px", flexWrap: "wrap" }}>
          {Object.values(partnerPortals).map((portal) => (
            <a
              key={portal.url}
              className="btn btn-secondary"
              href={portal.url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} /> {portal.label}
            </a>
          ))}
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: "20px 24px",
          marginBottom: "24px",
          border: "1px solid rgba(255, 149, 0, 0.35)",
          background:
            "linear-gradient(135deg, rgba(255,149,0,0.09), rgba(255,204,0,0.04))",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
        }}
      >
        <AlertTriangle size={22} style={{ color: "#FF9500", flexShrink: 0 }} />
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
            Partner verification is required
          </h3>
          <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
            KaizerStays does not store OTA usernames or passwords and cannot
            turn a normal extranet login into a production two-way API. Live
            sync must use an approved Booking.com/Agoda connectivity API or a
            contracted channel manager. Until then, property IDs, rates,
            inventory and parity remain marked as unverified.
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Verified OTA Connections</span>
          <div className="stat-card-value text-primary">
            {connectedChannels.length}
            <span
              style={{
                fontSize: "14px",
                color: "var(--color-text-tertiary)",
                marginLeft: "8px",
              }}
            >
              / {channels.length}
            </span>
          </div>
          <span className="text-xs text-warning" style={{ marginTop: "4px" }}>
            Awaiting approved connectivity
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">CRM Records Tagged OTA</span>
          <div className="stat-card-value">{otaReservations.length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            Local CRM records, not a live extranet count
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">CRM Revenue Tagged OTA</span>
          <div className="stat-card-value">{formatCurrency(otaRevenue)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            Based only on saved CRM reservations
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Rate Parity</span>
          <div className="stat-card-value text-warning">Not verified</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            Requires date-level OTA rates and restrictions
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {channels.map((channel) => {
          const portal = partnerPortals[channel.id];
          const isVerified =
            channel.status === "CONNECTED" && channel.apiKeyConfigured;

          return (
            <div
              className="card"
              key={channel.id}
              style={{
                padding: "20px",
                border: isVerified
                  ? "1px solid rgba(52, 199, 89, 0.35)"
                  : "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "var(--color-bg-secondary)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: 800,
                    }}
                  >
                    {channel.logo}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                      {channel.name}
                    </h3>
                    <span className="text-xs text-tertiary">Official partner portal</span>
                  </div>
                </div>
                <span className={`badge ${isVerified ? "badge-success" : "badge-default"}`}>
                  {isVerified ? (
                    <>
                      <CheckCircle2 size={12} /> Verified
                    </>
                  ) : (
                    <>
                      <CircleDashed size={12} /> Not connected
                    </>
                  )}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    background: "var(--color-bg-tertiary)",
                    borderRadius: "8px",
                  }}
                >
                  <div className="text-xs text-tertiary">Property ID</div>
                  <div className="text-sm font-semibold" style={{ marginTop: "3px" }}>
                    {isVerified && channel.hotelId ? channel.hotelId : "Not verified"}
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px",
                    background: "var(--color-bg-tertiary)",
                    borderRadius: "8px",
                  }}
                >
                  <div className="text-xs text-tertiary">Last verified sync</div>
                  <div className="text-sm font-semibold" style={{ marginTop: "3px" }}>
                    {isVerified && channel.lastSync
                      ? formatDate(channel.lastSync, "dd MMM, hh:mm a")
                      : "Never"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--color-text-secondary)",
                  fontSize: "12px",
                  marginBottom: "16px",
                }}
              >
                {isVerified ? <ShieldCheck size={15} /> : <Link2Off size={15} />}
                {isVerified
                  ? "Approved connection credentials are configured."
                  : "No approved API or channel-manager connection is configured."}
              </div>

              {portal && (
                <a
                  className="btn btn-primary btn-sm"
                  href={portal.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <ExternalLink size={14} /> {portal.label}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div
          className="card-header"
          style={{
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700 }}>
              Room & Rate-Plan Mapping
            </h3>
            <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
              CRM room definitions are shown for reference. OTA room types,
              rate plans and prices stay blank until verified from the partner source.
            </p>
          </div>
          <span className="badge badge-default" style={{ gap: "4px" }}>
            <Database size={12} /> Source pending
          </span>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>CRM Room Category</th>
                <th>CRM Code</th>
                <th>Current CRM Base Rate</th>
                <th>Booking.com Mapping</th>
                <th>Agoda Mapping</th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((roomType) => (
                <tr key={roomType.id}>
                  <td className="font-semibold">{roomType.name}</td>
                  <td className="mono text-sm">{roomType.code}</td>
                  <td>
                    <div className="mono font-semibold">
                      {formatCurrency(roomType.baseRate)}
                    </div>
                    <div className="text-xs text-warning">CRM value; OTA unverified</div>
                  </td>
                  <td>
                    <span className="badge badge-default">Awaiting room/rate-plan ID</span>
                  </td>
                  <td>
                    <span className="badge badge-default">Awaiting room/rate-plan ID</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <ListChecks size={20} className="text-primary" />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              Required before production sync
            </h3>
            <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
              Verify every item for both channels; a successful website login alone is not an API connection.
            </p>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "10px 18px",
          }}
        >
          {mappingChecks.map((check) => (
            <div
              key={check}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "13px",
                color: "var(--color-text-secondary)",
              }}
            >
              <KeyRound size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
              <span>{check}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--color-border)",
            fontSize: "12px",
            color: "var(--color-text-tertiary)",
          }}
        >
          <Hotel size={14} /> Hotel Shemron • production mapping checklist
        </div>
      </div>
    </div>
  );
}

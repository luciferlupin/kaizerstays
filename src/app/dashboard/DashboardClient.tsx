"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, getGreeting, formatDate } from "@/lib/utils";
import { toDateKey } from "@/lib/rates";
import {
  LogIn,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CalendarRange,
  MessageCircle,
  Radio,
} from "lucide-react";

export default function DashboardClient() {
  const { property, rooms, reservations, activity, currentUser } = useAppState();

  const greeting = getGreeting();
  const [activeTab, setActiveTab] = useState<"arrivals" | "departures">("arrivals");

  // Dynamic live KPIs computed from AppState Context
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const dirtyRooms = rooms.filter((r) => r.status === "DIRTY").length;
  const cleaningRooms = rooms.filter((r) => r.status === "CLEANING").length;
  const maintenanceRooms = rooms.filter((r) => r.status === "MAINTENANCE").length;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const todayKey = toDateKey(new Date());
  const arrivals = reservations.filter(
    (r) => r.status === "CONFIRMED" && toDateKey(new Date(r.checkIn)) <= todayKey
  );
  const departures = reservations.filter(
    (r) => r.status === "CHECKED_IN" && toDateKey(new Date(r.checkOut)) <= todayKey
  );
  const inHouseReservations = reservations.filter((r) => r.status === "CHECKED_IN");
  const inHouseGuestsCount = inHouseReservations.reduce((sum, r) => sum + r.adults + (r.children || 0), 0);

  const totalOutstandingFolio = reservations.reduce((sum, r) => sum + (r.balanceAmount || 0), 0);

  return (
    <div className="page-content">
      {/* Header Greeting */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {currentUser ? currentUser.name : "Ninaad Khera"}</h1>
          <p className="page-description">
            Here is what&apos;s happening at {property.name} today.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            + New Reservation
          </Link>
          <Link href="/dashboard/calendar" className="btn btn-secondary">
            View Calendar
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Occupancy Rate</span>
          <div className="stat-card-value text-primary">{occupancyRate}%</div>
          <div className="progress-bar-container" style={{ marginTop: "8px" }}>
            <div className="progress-bar-fill fill-primary" style={{ width: `${occupancyRate}%` }} />
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            {occupiedRooms} of {totalRooms} rooms occupied
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Arrivals Today</span>
          <div className="stat-card-value">{arrivals.length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            {arrivals.length === 0 ? "No arrivals pending" : `${arrivals.length} scheduled today`}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Departures Today</span>
          <div className="stat-card-value">{departures.length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            {departures.length === 0 ? "No departures pending" : `${departures.length} pending checkout`}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">In-House Guests</span>
          <div className="stat-card-value text-success">{inHouseGuestsCount}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            Across {inHouseReservations.length} occupied rooms
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <Link href="/dashboard/reservations/new" className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <LogIn size={20} className="text-primary" /><div><div className="font-semibold text-sm">Create reservation</div><div className="text-xs text-secondary">Availability-aware booking</div></div><ChevronRight size={15} style={{ marginLeft: "auto" }} />
        </Link>
        <Link href="/dashboard/rates" className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <CalendarRange size={20} className="text-primary" /><div><div className="font-semibold text-sm">Update rates</div><div className="text-xs text-secondary">Rates, inventory, restrictions</div></div><ChevronRight size={15} style={{ marginLeft: "auto" }} />
        </Link>
        <Link href="/dashboard/messages" className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <MessageCircle size={20} className="text-primary" /><div><div className="font-semibold text-sm">Guest inbox</div><div className="text-xs text-secondary">Notes and reply drafts</div></div><ChevronRight size={15} style={{ marginLeft: "auto" }} />
        </Link>
        <Link href="/dashboard/channels" className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <Radio size={20} className="text-warning" /><div><div className="font-semibold text-sm">OTA setup</div><div className="text-xs text-secondary">Mapping and connection status</div></div><ChevronRight size={15} style={{ marginLeft: "auto" }} />
        </Link>
      </div>

      {/* Dynamic Attention Banner */}
      {(arrivals.length > 0 || dirtyRooms > 0 || totalOutstandingFolio > 0) && (
        <div className="attention-card" style={{ marginBottom: "24px" }}>
          <div className="attention-header">
            <AlertTriangle size={18} className="text-warning" />
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Attention Required</span>
          </div>
          <div className="attention-body">
            {arrivals.length > 0 && (
              <Link href="/dashboard/front-desk" className="attention-item">
                <span className="badge badge-warning">{arrivals.length} Arrivals</span>
                <span>{arrivals.length} arrivals waiting for front desk check-in</span>
                <ChevronRight size={14} style={{ marginLeft: "auto" }} />
              </Link>
            )}

            {dirtyRooms > 0 && (
              <Link href="/dashboard/housekeeping" className="attention-item">
                <span className="badge badge-danger">{dirtyRooms} Dirty Rooms</span>
                <span>{dirtyRooms} rooms need housekeeping turnaround</span>
                <ChevronRight size={14} style={{ marginLeft: "auto" }} />
              </Link>
            )}

            {totalOutstandingFolio > 0 && (
              <Link href="/dashboard/payments" className="attention-item">
                <span className="badge badge-primary">Folio Balance</span>
                <span>{formatCurrency(totalOutstandingFolio)} outstanding from guest folios</span>
                <ChevronRight size={14} style={{ marginLeft: "auto" }} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Arrivals/Departures + Room Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", marginBottom: "24px" }}>
        {/* Left Column: Operations Quick Table */}
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <div className="tabs" style={{ margin: 0 }}>
              <button
                className={`tab ${activeTab === "arrivals" ? "active" : ""}`}
                onClick={() => setActiveTab("arrivals")}
              >
                Arrivals Today ({arrivals.length})
              </button>
              <button
                className={`tab ${activeTab === "departures" ? "active" : ""}`}
                onClick={() => setActiveTab("departures")}
              >
                Departures Today ({departures.length})
              </button>
            </div>
            <Link href="/dashboard/front-desk" className="btn btn-ghost btn-sm">
              View Front Desk Workspace →
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {(activeTab === "arrivals" ? arrivals : departures).length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" }}>
                <CheckCircle2 size={32} className="text-success" style={{ margin: "0 auto 8px auto" }} />
                <h4 style={{ fontSize: "14px", fontWeight: 600 }}>
                  {activeTab === "arrivals" ? "No Arrivals Scheduled for Today" : "No Departures Scheduled for Today"}
                </h4>
                <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                  Saved PMS bookings appear here. OTA bookings require an approved channel connection.
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Dates</th>
                    <th>Source</th>
                    <th>Balance</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "arrivals" ? arrivals : departures).map((r) => (
                    <tr key={r.id}>
                      <td className="font-semibold">{r.guestName}</td>
                      <td>
                        <div>{r.roomType}</div>
                        <div className="text-xs text-primary font-semibold">
                          {r.roomNumber ? `Room #${r.roomNumber}` : "Unassigned"}
                        </div>
                      </td>
                      <td className="text-xs">
                        {formatDate(r.checkIn, "dd MMM")} → {formatDate(r.checkOut, "dd MMM")}
                      </td>
                      <td>
                        <span className="badge badge-default">{r.bookingSource}</span>
                      </td>
                      <td className="mono font-semibold text-sm">
                        {r.balanceAmount === 0 ? (
                          <span className="badge badge-success">Paid</span>
                        ) : (
                          formatCurrency(r.balanceAmount)
                        )}
                      </td>
                      <td className="text-right">
                        <Link href="/dashboard/front-desk" className="btn btn-primary btn-sm">
                          {activeTab === "arrivals" ? "Check In" : "Check Out"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Room Inventory Status Grid */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Room Status Summary</h3>
            <Link href="/dashboard/rooms" className="text-xs text-primary font-semibold">
              Manage Rooms →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "var(--green-50)", padding: "12px", borderRadius: "var(--radius-md)" }}>
              <span className="text-xs text-secondary">Available</span>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--green-700)" }}>{availableRooms}</div>
            </div>
            <div style={{ background: "var(--color-primary-light)", padding: "12px", borderRadius: "var(--radius-md)" }}>
              <span className="text-xs text-secondary">Occupied</span>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-primary)" }}>{occupiedRooms}</div>
            </div>
            <div style={{ background: "var(--amber-50)", padding: "12px", borderRadius: "var(--radius-md)" }}>
              <span className="text-xs text-secondary">Dirty</span>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--amber-700)" }}>{dirtyRooms}</div>
            </div>
            <div style={{ background: "var(--color-bg-tertiary)", padding: "12px", borderRadius: "var(--radius-md)" }}>
              <span className="text-xs text-secondary">Cleaning / Maint</span>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>{cleaningRooms + maintenanceRooms}</div>
            </div>
          </div>

          {/* Visual Mini Grid */}
          <div className="room-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", gap: "6px" }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                style={{
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "white",
                  background:
                    room.status === "AVAILABLE"
                      ? "var(--green-500)"
                      : room.status === "OCCUPIED"
                      ? "var(--color-primary)"
                      : room.status === "DIRTY"
                      ? "var(--amber-500)"
                      : "var(--color-text-tertiary)",
                }}
                title={`Room #${room.number} (${room.status})`}
              >
                {room.number}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="card-header" style={{ padding: "16px 20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Real-Time Activity Audit Feed</h3>
            <p className="text-xs text-secondary">Live stream of operational events across Hotel Shemron</p>
          </div>
          <Link href="/dashboard/activity" className="btn btn-ghost btn-sm">
            Full Audit Trail →
          </Link>
        </div>
        <div className="card-body" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activity.length === 0 && <p className="text-sm text-secondary">No operational activity has been recorded yet.</p>}
            {activity.slice(0, 5).map((act, idx) => (
              <div key={`${act.id}_${idx}`} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{act.action}</div>
                  <div className="text-xs text-secondary">{act.detail}</div>
                </div>
                <div className="text-xs text-tertiary" suppressHydrationWarning>
                  {act.createdAt ? formatDate(act.createdAt, "hh:mm a") : "Recent"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

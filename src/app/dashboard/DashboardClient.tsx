"use client";

import { useState } from "react";
import Link from "next/link";
import {
  demoDashboardStats,
  demoRevenueStats,
  demoRoomStatusSummary,
  demoReservations,
  demoActivity,
  demoAttentionItems,
  demoProperty,
} from "@/lib/demo-data";
import { formatCurrency, getGreeting } from "@/lib/utils";
import {
  Users,
  BedDouble,
  LogIn,
  LogOut,
  Sparkles,
  Wrench,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  UserCheck,
  Building2,
  DollarSign,
  Search,
  Filter,
} from "lucide-react";

export default function DashboardClient() {
  const greeting = getGreeting();
  const [activeTab, setActiveTab] = useState<"arrivals" | "departures">("arrivals");

  const arrivals = demoReservations.filter((r) => r.status === "CONFIRMED");
  const departures = demoReservations.filter((r) => r.status === "CHECKED_IN" && r.balanceAmount >= 0);

  return (
    <div className="page-content">
      {/* Header Greeting */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, Sunil Manager</h1>
          <p className="page-description">
            Here is what's happening at {demoProperty.name} today.
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

      {/* Attention Required Banner */}
      {demoAttentionItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {demoAttentionItems.map((item, idx) => (
            <Link key={idx} href={item.link} className="attention-card">
              <AlertTriangle size={18} className="attention-card-icon" />
              <div style={{ flex: 1 }}>
                <span className="attention-card-count">{item.count > 100 ? formatCurrency(item.count) : item.count}</span>{" "}
                <span>{item.message.replace(/^\d+|^₹[\d,]+/, "").trim()}</span>
              </div>
              <ChevronRight size={14} color="var(--color-text-tertiary)" />
            </Link>
          ))}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">Occupancy Rate</span>
            <div className="stat-card-icon" style={{ background: "var(--blue-50)", color: "var(--blue-600)" }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="stat-card-value">{demoDashboardStats.occupancyRate}%</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>+4.2% from yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">Arrivals Today</span>
            <div className="stat-card-icon" style={{ background: "var(--green-50)", color: "var(--green-600)" }}>
              <LogIn size={18} />
            </div>
          </div>
          <div className="stat-card-value">{demoDashboardStats.arrivalsToday}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {arrivals.length} pending check-in
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">Departures Today</span>
            <div className="stat-card-icon" style={{ background: "var(--amber-50)", color: "var(--amber-600)" }}>
              <LogOut size={18} />
            </div>
          </div>
          <div className="stat-card-value">{demoDashboardStats.departuresToday}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {departures.length} pending check-out
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">In-House Guests</span>
            <div className="stat-card-icon" style={{ background: "var(--purple-50)", color: "var(--purple-600)" }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-card-value">{demoDashboardStats.inHouseGuests}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            Across {demoDashboardStats.roomsOccupied} rooms
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={18} color="var(--color-primary)" />
            Revenue Overview
          </h3>
          <span className="badge badge-primary">INR ₹</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px" }}>
            <div>
              <div className="stat-card-label">Revenue Today</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text)", marginTop: "4px" }}>
                {formatCurrency(demoRevenueStats.revenueToday)}
              </div>
              <span className="text-xs text-secondary">Collected today</span>
            </div>
            <div>
              <div className="stat-card-label">Month to Date (MTD)</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text)", marginTop: "4px" }}>
                {formatCurrency(demoRevenueStats.revenueMTD)}
              </div>
              <span className="text-xs text-success">+18% vs last month</span>
            </div>
            <div>
              <div className="stat-card-label">Expected Revenue</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text)", marginTop: "4px" }}>
                {formatCurrency(demoRevenueStats.expectedRevenue)}
              </div>
              <span className="text-xs text-secondary">From current stays</span>
            </div>
            <div>
              <div className="stat-card-label">Outstanding Payments</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--red-600)", marginTop: "4px" }}>
                {formatCurrency(demoRevenueStats.outstandingPayments)}
              </div>
              <span className="text-xs text-danger">Action required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Arrivals/Departures + Room Status Visualization */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Left Column: Front Desk Quick Workspace */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <div className="tabs">
              <button
                className={`tab ${activeTab === "arrivals" ? "active" : ""}`}
                onClick={() => setActiveTab("arrivals")}
              >
                Today's Arrivals
                <span className="tab-count">{arrivals.length}</span>
              </button>
              <button
                className={`tab ${activeTab === "departures" ? "active" : ""}`}
                onClick={() => setActiveTab("departures")}
              >
                Today's Departures
                <span className="tab-count">{departures.length}</span>
              </button>
            </div>
            <Link href="/dashboard/front-desk" className="btn btn-ghost btn-sm">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="data-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Room Type</th>
                    <th>Source</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "arrivals" ? arrivals : departures).map((res) => (
                    <tr key={res.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{res.guestName}</div>
                        <div className="text-xs text-tertiary mono">{res.confirmationNumber}</div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          #{res.roomNumber || "Unassigned"}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{res.roomType}</td>
                      <td>
                        <span className="badge badge-default">{res.bookingSource}</span>
                      </td>
                      <td className="mono">
                        {res.balanceAmount > 0 ? (
                          <span className="text-danger font-medium">{formatCurrency(res.balanceAmount)}</span>
                        ) : (
                          <span className="text-success font-medium">Paid</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            res.status === "CONFIRMED"
                              ? "badge-primary"
                              : res.status === "CHECKED_IN"
                              ? "badge-success"
                              : "badge-default"
                          }`}
                        >
                          <span className="badge-dot" />
                          {res.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-right">
                        {res.status === "CONFIRMED" ? (
                          <Link href={`/dashboard/reservations/${res.id}`} className="btn btn-primary btn-sm">
                            Check In
                          </Link>
                        ) : (
                          <Link href={`/dashboard/reservations/${res.id}`} className="btn btn-secondary btn-sm">
                            Check Out
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Room Status Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BedDouble size={18} color="var(--color-primary)" />
                Room Status
              </h3>
              <Link href="/dashboard/rooms" className="text-xs text-primary">
                Manage Rooms
              </Link>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="room-cell room-available">
                  <div className="room-cell-number">{demoRoomStatusSummary.available}</div>
                  <div className="room-cell-type">Available</div>
                </div>
                <div className="room-cell room-occupied">
                  <div className="room-cell-number">{demoRoomStatusSummary.occupied}</div>
                  <div className="room-cell-type">Occupied</div>
                </div>
                <div className="room-cell room-dirty">
                  <div className="room-cell-number">{demoRoomStatusSummary.dirty}</div>
                  <div className="room-cell-type">Dirty</div>
                </div>
                <div className="room-cell room-cleaning">
                  <div className="room-cell-number">{demoRoomStatusSummary.cleaning}</div>
                  <div className="room-cell-type">Cleaning</div>
                </div>
                <div className="room-cell room-inspected">
                  <div className="room-cell-number">{demoRoomStatusSummary.inspected}</div>
                  <div className="room-cell-type">Inspected</div>
                </div>
                <div className="room-cell room-maintenance">
                  <div className="room-cell-number">{demoRoomStatusSummary.maintenance}</div>
                  <div className="room-cell-type">Maintenance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="var(--color-primary)" />
                Recent Activity
              </h3>
            </div>
            <div className="card-body">
              <div className="activity-feed">
                {demoActivity.slice(0, 5).map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className="activity-icon" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{act.action}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {act.detail}
                      </div>
                      <div className="activity-time">{act.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

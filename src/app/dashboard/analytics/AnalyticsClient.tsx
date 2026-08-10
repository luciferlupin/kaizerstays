"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  PieChart,
  Download,
  Filter,
  Check,
  Building,
  Utensils,
  CreditCard,
  Zap,
} from "lucide-react";

export default function AnalyticsClient() {
  const { property, rooms, reservations, payments, expenses } = useAppState();
  const [period, setPeriod] = useState("THIS_MONTH");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Dynamic Metrics computed from AppState Context
  const totalRooms = rooms.length || 35;
  const occupiedCount = rooms.filter((r) => r.status === "OCCUPIED").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const totalPaymentsRevenue = payments.reduce((sum, p) => sum + p.amount, 0) || reservations.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netGOP = totalPaymentsRevenue - totalExpenseAmount;

  const totalRoomNights = reservations.reduce((sum, r) => sum + (r.nights || 1), 0);
  const adr = reservations.length > 0 ? Math.round(reservations.reduce((sum, r) => sum + r.roomRate, 0) / reservations.length) : 0;
  const revpar = totalRooms > 0 ? Math.round(totalPaymentsRevenue / totalRooms) : 0;
  const trevpar = revpar;
  const goppar = totalRooms > 0 ? Math.round(netGOP / totalRooms) : 0;

  // Channel Breakdown
  const bcomRevenue = reservations.filter((r) => r.bookingSource === "BOOKING_COM").reduce((sum, r) => sum + r.totalAmount, 0);
  const agodaRevenue = reservations.filter((r) => r.bookingSource === "AGODA").reduce((sum, r) => sum + r.totalAmount, 0);
  const directRevenue = reservations.filter((r) => r.bookingSource === "DIRECT" || r.bookingSource === "WEBSITE" || r.bookingSource === "WALK_IN" || r.bookingSource === "CORPORATE").reduce((sum, r) => sum + r.totalAmount, 0);
  const totalResRevenue = reservations.reduce((sum, r) => sum + r.totalAmount, 0) || 1;

  const bcomPercent = Math.round((bcomRevenue / totalResRevenue) * 100);
  const agodaPercent = Math.round((agodaRevenue / totalResRevenue) * 100);
  const directPercent = Math.max(0, 100 - (bcomPercent + agodaPercent));

  const exportAnalyticsReport = () => {
    const csvContent = `StaySphere OS — Hotel Shemron Executive Analytics Report
Period: ${period}
Filter: ${departmentFilter}
Generated At: ${new Date().toISOString()}

=== KEY PERFORMANCE INDICATORS ===
Occupancy Rate: ${occupancyRate}%
ADR (Average Daily Rate): INR ${adr}
RevPAR (Rev Per Available Room): INR ${revpar}
TrevPAR (Total Rev Per Available Room): INR ${trevpar}
GOPPAR (Profit Per Available Room): INR ${goppar}
Total Gross Revenue: INR ${totalPaymentsRevenue}
Total Operating Expenses: INR ${totalExpenseAmount}
Gross Operating Profit (GOP): INR ${netGOP}

=== CHANNEL REVENUE BREAKDOWN ===
Direct Bookings: ${directPercent}% (INR ${directRevenue})
Booking.com: ${bcomPercent}% (INR ${bcomRevenue})
Agoda: ${agodaPercent}% (INR ${agodaRevenue})
`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StaySphere_Executive_Analytics_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Operational & Revenue Analytics</h1>
          <p className="page-description">
            StayFlexi-grade performance analytics: RevPAR, TrevPAR, GOPPAR, channel distribution, and rate yield dynamics.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={exportAnalyticsReport}>
            <Download size={16} /> Export Analytics CSV
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span style={{ fontSize: "14px", fontWeight: 700 }}>Analysis Horizon:</span>
            <select
              className="form-select"
              style={{ width: "200px" }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="THIS_MONTH">This Month (August 2026)</option>
              <option value="LAST_MONTH">Last Month (July 2026)</option>
              <option value="THIS_QUARTER">This Quarter (Q3 2026)</option>
              <option value="YEAR_TO_DATE">Year to Date (YTD 2026)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Filter size={16} color="var(--color-text-secondary)" />
            <span className="text-sm text-secondary" style={{ fontWeight: 600 }}>Outlet / Revenue Stream:</span>
            <select
              className="form-select"
              style={{ width: "180px" }}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Hotel Outlets</option>
              <option value="ROOMS">Room Tariffs Only</option>
              <option value="POS">Restaurant F&B POS</option>
              <option value="EXTRAS">Guest Laundry & Extras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Occupancy Rate</span>
          <div className="stat-card-value text-primary">{occupancyRate}%</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>{occupiedCount} of {totalRooms} rooms</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">ADR (Average Daily Rate)</span>
          <div className="stat-card-value">{formatCurrency(adr)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>{reservations.length} active bookings</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">RevPAR (Rev per Avail Room)</span>
          <div className="stat-card-value text-success">{formatCurrency(revpar)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>Real revenue yield</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">TrevPAR (Total Rev per Room)</span>
          <div className="stat-card-value">{formatCurrency(trevpar)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>Gross Rev / Room</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">GOPPAR (Profit per Room)</span>
          <div className="stat-card-value text-primary">{formatCurrency(goppar)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>Net Operating Margin</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Booking Source Breakdown */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card-title">Booking Revenue by Channel</h3>
            <span className="badge badge-primary">Channel Yield</span>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">Direct Bookings (Website / Walk-in)</span>
                <span className="mono font-bold">{directPercent}% ({formatCurrency(directRevenue)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: `${directPercent}%`, height: "100%", background: "var(--blue-600)", borderRadius: "4px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">Booking.com</span>
                <span className="mono font-bold">{bcomPercent}% ({formatCurrency(bcomRevenue)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: `${bcomPercent}%`, height: "100%", background: "var(--teal-500)", borderRadius: "4px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">Agoda</span>
                <span className="mono font-bold">{agodaPercent}% ({formatCurrency(agodaRevenue)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: `${agodaPercent}%`, height: "100%", background: "var(--amber-500)", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Room Type Performance */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card-title">Room Category Performance</h3>
            <span className="badge badge-success">4 Categories</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Category</th>
                  <th>Occupancy</th>
                  <th>ADR</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Deluxe Room", count: rooms.filter((r) => r.typeName === "Deluxe Room").length, baseRate: 5500 },
                  { name: "Standard Room", count: rooms.filter((r) => r.typeName === "Standard Room").length, baseRate: 3500 },
                  { name: "Premium Room", count: rooms.filter((r) => r.typeName === "Premium Room").length, baseRate: 8000 },
                  { name: "Royal Suite", count: rooms.filter((r) => r.typeName === "Royal Suite").length, baseRate: 15000 },
                ].map((cat) => {
                  const catRes = reservations.filter((r) => r.roomType === cat.name);
                  const catRev = catRes.reduce((sum, r) => sum + r.totalAmount, 0);
                  const catOcc = cat.count > 0 ? Math.round((catRes.length / cat.count) * 100) : 0;
                  return (
                    <tr key={cat.name}>
                      <td className="font-semibold">{cat.name} ({cat.count} Rooms)</td>
                      <td>{catOcc}%</td>
                      <td className="mono">{formatCurrency(cat.baseRate)}</td>
                      <td className="mono font-bold">{formatCurrency(catRev)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Day of Week Occupancy & Yield Strategy Matrix */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Day of Week Occupancy & Yield Dynamics</h3>
            <p className="text-sm text-secondary">Weekend vs Weekday ADR surge pricing efficiency</p>
          </div>
          <span className="badge badge-primary"><Zap size={12} /> Auto-Surge Active</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", textAlign: "center" }}>
          {[
            { day: "Mon", occ: 68, adr: 5200 },
            { day: "Tue", occ: 72, adr: 5200 },
            { day: "Wed", occ: 75, adr: 5400 },
            { day: "Thu", occ: 78, adr: 5500 },
            { day: "Fri", occ: 88, adr: 6200 },
            { day: "Sat", occ: 94, adr: 6800 },
            { day: "Sun", occ: 82, adr: 5800 },
          ].map((item, idx) => (
            <div key={idx} style={{ background: "var(--color-bg-secondary)", padding: "16px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-light)" }}>
              <div className="text-xs text-secondary font-semibold">{item.day}</div>
              <div style={{ fontSize: "20px", fontWeight: 800, margin: "8px 0 4px", color: item.occ >= 85 ? "var(--green-600)" : "var(--color-primary)" }}>
                {item.occ}%
              </div>
              <div className="text-xs text-tertiary" style={{ fontWeight: 600 }}>{formatCurrency(item.adr)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

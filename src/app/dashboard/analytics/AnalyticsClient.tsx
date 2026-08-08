"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Calendar, Percent, PieChart } from "lucide-react";

export default function AnalyticsClient() {
  const [period, setPeriod] = useState("THIS_MONTH");

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospitality Operational Analytics</h1>
          <p className="page-description">
            Executive performance metrics: Occupancy, ADR, RevPAR, channel distribution, and revenue trends.
          </p>
        </div>
        <div className="page-actions">
          <select
            className="form-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="THIS_MONTH">This Month (August 2026)</option>
            <option value="LAST_MONTH">Last Month (July 2026)</option>
            <option value="THIS_QUARTER">This Quarter (Q3 2026)</option>
          </select>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Average Occupancy</span>
          <div className="stat-card-value text-primary">76.4%</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>+5.1% vs last period</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">ADR (Average Daily Rate)</span>
          <div className="stat-card-value">{formatCurrency(5450)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>+₹420 per night</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">RevPAR (Rev per Avail Room)</span>
          <div className="stat-card-value">{formatCurrency(4163)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>+8.2% growth</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Total Room Revenue</span>
          <div className="stat-card-value text-success">{formatCurrency(2845600)}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} />
            <span>On track to beat target</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Booking Source Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Booking Revenue by Channel</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">Direct Bookings (Website / Walk-in)</span>
                <span className="mono font-bold">42% ({formatCurrency(1195152)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: "42%", height: "100%", background: "var(--blue-600)", borderRadius: "4px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">Booking.com</span>
                <span className="mono font-bold">28% ({formatCurrency(796768)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: "28%", height: "100%", background: "var(--teal-500)", borderRadius: "4px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">MakeMyTrip / Goibibo</span>
                <span className="mono font-bold">18% ({formatCurrency(512208)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: "18%", height: "100%", background: "var(--amber-500)", borderRadius: "4px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="font-semibold">Agoda & Expedia</span>
                <span className="mono font-bold">12% ({formatCurrency(341472)})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--gray-100)", borderRadius: "4px" }}>
                <div style={{ width: "12%", height: "100%", background: "var(--purple-500)", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Room Type Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Room Type Performance</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th>Occupancy</th>
                  <th>ADR</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Deluxe Room</td>
                  <td>82%</td>
                  <td className="mono">{formatCurrency(5500)}</td>
                  <td className="mono font-bold">{formatCurrency(1185000)}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Standard Room</td>
                  <td>74%</td>
                  <td className="mono">{formatCurrency(3500)}</td>
                  <td className="mono font-bold">{formatCurrency(840000)}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Premium Room</td>
                  <td>78%</td>
                  <td className="mono">{formatCurrency(8000)}</td>
                  <td className="mono font-bold">{formatCurrency(620000)}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Royal Suite</td>
                  <td>68%</td>
                  <td className="mono">{formatCurrency(15000)}</td>
                  <td className="mono font-bold">{formatCurrency(480000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

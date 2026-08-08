"use client";

import { useState } from "react";
import {
  generateRateCalendar,
  competitors,
  pricingRules,
  DayRate,
  PricingRule,
} from "@/lib/channels-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Sparkles,
  Sliders,
  CheckCircle2,
  Calendar,
  Building,
  ArrowUpRight,
  Zap,
  Check,
  Plus,
  X,
  Clock,
} from "lucide-react";

export default function RevenueClient() {
  const [calendar, setCalendar] = useState<DayRate[]>(generateRateCalendar());
  const [rules, setRules] = useState<PricingRule[]>(pricingRules);
  const [aiApplied, setAiApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "competitors" | "rules">("calendar");

  const handleApplyAIRates = () => {
    setCalendar((prev) =>
      prev.map((day) => ({
        ...day,
        rates: { ...day.aiSuggested },
      }))
    );
    setAiApplied(true);
    setTimeout(() => setAiApplied(false), 3000);
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)));
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={24} className="text-primary" />
            AI Revenue Optimization & Dynamic Pricing
          </h1>
          <p className="page-description">
            Maximize RevPAR & ADR with AI-driven rate recommendations, demand forecasting, and competitor rate tracking for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleApplyAIRates} style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", border: "none" }}>
            <Sparkles size={16} /> Apply AI Recommended Rates
          </button>
        </div>
      </div>

      {aiApplied && (
        <div
          style={{
            background: "var(--green-50)",
            color: "var(--green-800)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} /> AI Recommended tariffs successfully applied across 30-day booking horizon!
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Average Daily Rate (ADR)</span>
          <div className="stat-card-value text-primary">{formatCurrency(5840)}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>+12.4% vs last month</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">RevPAR</span>
          <div className="stat-card-value text-success">{formatCurrency(4438)}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>Optimized yield</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">30-Day Forecast Occupancy</span>
          <div className="stat-card-value text-warning">74%</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Peak on weekends</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Active Pricing Rules</span>
          <div className="stat-card-value">{rules.filter((r) => r.isActive).length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Auto-adjusting rates</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "calendar" ? "active" : ""}`} onClick={() => setActiveTab("calendar")}>
          30-Day Dynamic Rate Calendar
        </button>
        <button className={`tab ${activeTab === "competitors" ? "active" : ""}`} onClick={() => setActiveTab("competitors")}>
          Competitor Rate Intelligence ({competitors.length})
        </button>
        <button className={`tab ${activeTab === "rules" ? "active" : ""}`} onClick={() => setActiveTab("rules")}>
          Dynamic Pricing Rules ({rules.length})
        </button>
      </div>

      {/* TAB 1: RATE CALENDAR */}
      {activeTab === "calendar" && (
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>30-Day Rate & Demand Matrix</h3>
              <p className="text-xs text-secondary">Click any rate to inspect demand drivers and AI suggestions</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Demand Level</th>
                  <th>Occ. Forecast</th>
                  <th>Standard Room</th>
                  <th>Deluxe Room</th>
                  <th>Premium Room</th>
                  <th>Royal Suite</th>
                  <th>AI Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {calendar.map((day, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{formatDate(day.date, "dd MMM")}</td>
                    <td className="text-secondary">{day.dayOfWeek}</td>
                    <td>
                      <span
                        className={`badge ${
                          day.demand === "PEAK"
                            ? "badge-danger"
                            : day.demand === "HIGH"
                            ? "badge-warning"
                            : day.demand === "MEDIUM"
                            ? "badge-primary"
                            : "badge-default"
                        }`}
                      >
                        {day.demand}
                      </span>
                      {day.eventName && (
                        <div className="text-xs text-primary" style={{ marginTop: "2px", fontWeight: 600 }}>
                          🎉 {day.eventName}
                        </div>
                      )}
                    </td>
                    <td className="mono font-semibold">{day.occupancyForecast}%</td>
                    <td className="mono font-bold">{formatCurrency(day.rates["Standard Room"])}</td>
                    <td className="mono font-bold">{formatCurrency(day.rates["Deluxe Room"])}</td>
                    <td className="mono font-bold">{formatCurrency(day.rates["Premium Room"])}</td>
                    <td className="mono font-bold text-primary">{formatCurrency(day.rates["Royal Suite"])}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="mono text-xs text-purple font-semibold" style={{ background: "var(--purple-50)", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>
                          {formatCurrency(day.aiSuggested["Deluxe Room"])} (Deluxe)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COMPETITORS */}
      {activeTab === "competitors" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {competitors.map((comp, idx) => (
            <div key={idx} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{comp.name}</h3>
                  <div className="text-xs text-secondary">{comp.distance} away • ⭐ {comp.rating}</div>
                </div>
                <Building size={20} className="text-tertiary" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "16px 0" }}>
                {Object.entries(comp.rates).map(([cat, rate]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span className="text-secondary">{cat}</span>
                    <span className="mono font-semibold">{formatCurrency(rate)}</span>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)", fontSize: "12px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                <ArrowUpRight size={14} /> Shemron is priced 8% lower on average
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PRICING RULES */}
      {activeTab === "rules" && (
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Configured Dynamic Pricing Automation Rules</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Trigger Condition</th>
                  <th>Pricing Action</th>
                  <th>Status</th>
                  <th className="text-right">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="font-semibold">{rule.name}</td>
                    <td className="mono text-xs">{rule.condition}</td>
                    <td className="text-primary font-semibold">{rule.action}</td>
                    <td>
                      <span className={`badge ${rule.isActive ? "badge-success" : "badge-default"}`}>
                        {rule.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleRule(rule.id)}>
                        {rule.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

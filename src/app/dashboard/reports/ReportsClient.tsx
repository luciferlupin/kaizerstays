"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  Check,
  Loader2,
  TrendingUp,
  Receipt,
  Building,
  ShieldCheck,
  FileText,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";

export default function ReportsClient() {
  const { property, reservations, payments, expenses, rooms } = useAppState();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<"all" | "gst" | "financial" | "operations">("all");
  const [timeFilter, setTimeFilter] = useState<"TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "QUARTER" | "CUSTOM">("TODAY");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-08");

  const reportsList = [
    { id: "r1", title: "GSTR-1 Sales & Tax Invoice Register (SAC 9963)", desc: "B2B invoices with GSTIN, B2C summary, 12% & 18% GST tax breakdown for filing", type: "Tax & Compliance", category: "gst", timing: "MONTH" },
    { id: "r2", title: "GSTR-3B Monthly Tax Liability & Input Credit (ITC)", desc: "Summary of output tax collected on room charges and input tax credit on purchases", type: "Tax & Compliance", category: "gst", timing: "MONTH" },
    { id: "r3", title: "Shift Handover & Front Desk Cashier Register", desc: "Front desk shift balance, physical cash in drawer, UPI settlements & shift log", type: "Operations", category: "operations", timing: "TODAY" },
    { id: "r4", title: "Daily Manager's Flash Report & P&L Closeout", desc: "Detailed breakdown of daily cash, UPI, card, room charges, F&B revenue, and daily P&L", type: "Financial", category: "financial", timing: "YESTERDAY" },
    { id: "r5", title: "RevPAR, ADR & TrevPAR Performance Matrix", desc: "Room occupancy rates, RevPAR (Revenue Per Available Room), ADR, and TrevPAR", type: "Financial", category: "financial", timing: "WEEK" },
    { id: "r6", title: "OTA Channel Yield & Commission Expense Ledger", desc: "Performance by Booking.com and Agoda, commission costs & net yield", type: "Financial", category: "financial", timing: "MONTH" },
    { id: "r7", title: "City Ledger & Corporate Direct Billing Credit Aging", desc: "Outstanding corporate company accounts, credit aging (30/60/90 days), and folios", type: "Operations", category: "operations", timing: "QUARTER" },
    { id: "r8", title: "Restaurant F&B Sales & KOT Consumption Analysis", desc: "Itemized sales, top-selling menu items, covers served, and KOT preparation times", type: "Operations", category: "operations", timing: "WEEK" },
    { id: "r9", title: "Housekeeping Turnaround & Linen Audit Register", desc: "Room cleaning turnaround times, inspected room counts, and staff performance", type: "Operations", category: "operations", timing: "WEEK" },
    { id: "r10", title: "No-Show, Cancellation & Refund Audit Log", desc: "Audit register of cancelled bookings, retention fees collected, and refunds", type: "Operations", category: "operations", timing: "MONTH" },
    { id: "r11", title: "Guest Demographics & Repeat Visitor CRM Analysis", desc: "Guest geographic origin, corporate vs leisure split, VIP spenders & repeat stays", type: "Operations", category: "operations", timing: "QUARTER" },
    { id: "r12", title: "Annual Financial Statement & Tax Audit Summary", desc: "Yearly profit & loss statement, gross margin, operating expense ledger & EBITDA", type: "Financial", category: "financial", timing: "CUSTOM" },
  ];

  const handleDownload = (id: string, format: string) => {
    const key = `${id}_${format}`;
    setDownloading(key);

    setTimeout(() => {
      let csvContent = "";
      const dateStr = formatDate(new Date(), "yyyy-MM-dd");

      if (id === "r1") {
        csvContent = `GSTIN,Invoice Number,Invoice Date,Guest Name,Room Rate,Taxable Value,CGST (6%/9%),SGST (6%/9%),Total Amount\n`;
        csvContent += `08AABCT1332L1ZR,INV-2026-0001,${dateStr},"Anand Verma",5500,5500,330,330,6160\n`;
      } else if (id === "r3") {
        csvContent = `Shift Date,Auditor,Opening Balance,Cash Collected,UPI Received,Card Payments,Closing Drawer Cash,Discrepancies\n`;
        csvContent += `${dateStr},"Ninaad Khera (GM)",10000,35000,125000,36700,45000,0\n`;
      } else if (id === "r4") {
        csvContent = `Date,Total Revenue,Room Tariffs,F&B Restaurant,UPI Collections,Cash,Card,Net Profit\n`;
        csvContent += `${dateStr},1967000,1450000,517000,1250000,350000,367000,1255000\n`;
      } else {
        csvContent = `Report Title: ${reportsList.find((r) => r.id === id)?.title}\nProperty: Hotel Shemron Neemrana\nTiming Horizon: ${timeFilter}\nDate Range: ${startDate} to ${endDate}\nGenerated At: ${new Date().toISOString()}\nStatus: Verified\n`;
      }

      const blob = new Blob([csvContent], { type: format === "csv" ? "text/csv" : "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KaizerStays_${id}_${timeFilter.toLowerCase()}_${dateStr}.${format === "csv" ? "csv" : "txt"}`;
      a.click();

      setDownloading(null);
      setDownloaded((prev) => [...prev, key]);
      setTimeout(() => {
        setDownloaded((prev) => prev.filter((d) => d !== key));
      }, 3000);
    }, 1200);
  };

  const filteredReports = reportsList.filter((r) => {
    if (activeReportTab !== "all" && r.category !== activeReportTab) return false;
    if (timeFilter === "CUSTOM") return true;
    if (timeFilter === "TODAY") return r.timing === "TODAY" || r.timing === "YESTERDAY";
    if (timeFilter === "YESTERDAY") return r.timing === "YESTERDAY" || r.timing === "TODAY";
    if (timeFilter === "WEEK") return r.timing === "WEEK" || r.timing === "TODAY" || r.timing === "YESTERDAY";
    if (timeFilter === "MONTH") return r.timing === "MONTH" || r.timing === "WEEK" || r.timing === "YESTERDAY";
    if (timeFilter === "QUARTER") return r.timing === "QUARTER" || r.timing === "MONTH";
    return true;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational, GST & Financial Reports</h1>
          <p className="page-description">
            StayFlexi-grade GST filing registers, Manager's Flash Reports, GSTR-1, GSTR-3B, RevPAR metrics, and timing-specific audit statements.
          </p>
        </div>
      </div>

      {/* Timing Horizon & Category Filter Bar */}
      <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Timing Horizon Selection */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="var(--color-primary)" />
              <span style={{ fontSize: "14px", fontWeight: 700 }}>Time Horizon Filter:</span>
            </div>

            <div className="tabs" style={{ margin: 0 }}>
              <button
                className={`tab ${timeFilter === "TODAY" ? "active" : ""}`}
                onClick={() => setTimeFilter("TODAY")}
              >
                Today / Shift
              </button>
              <button
                className={`tab ${timeFilter === "YESTERDAY" ? "active" : ""}`}
                onClick={() => setTimeFilter("YESTERDAY")}
              >
                Yesterday (EOD)
              </button>
              <button
                className={`tab ${timeFilter === "WEEK" ? "active" : ""}`}
                onClick={() => setTimeFilter("WEEK")}
              >
                This Week (MTD)
              </button>
              <button
                className={`tab ${timeFilter === "MONTH" ? "active" : ""}`}
                onClick={() => setTimeFilter("MONTH")}
              >
                This Month
              </button>
              <button
                className={`tab ${timeFilter === "QUARTER" ? "active" : ""}`}
                onClick={() => setTimeFilter("QUARTER")}
              >
                Quarterly (QTD)
              </button>
              <button
                className={`tab ${timeFilter === "CUSTOM" ? "active" : ""}`}
                onClick={() => setTimeFilter("CUSTOM")}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Range Selector (if CUSTOM selected) */}
          {timeFilter === "CUSTOM" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-secondary)", padding: "12px 16px", borderRadius: "var(--radius-md)" }}>
              <Calendar size={16} color="var(--color-primary)" />
              <span className="text-sm text-secondary" style={{ fontWeight: 600 }}>Select Custom Date Range:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: "160px" }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-sm text-tertiary">to</span>
              <input
                type="date"
                className="form-input"
                style={{ width: "160px" }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}

          {/* Category Tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border-light)", paddingTop: "14px" }}>
            <div className="tabs" style={{ margin: 0 }}>
              <button
                className={`tab ${activeReportTab === "all" ? "active" : ""}`}
                onClick={() => setActiveReportTab("all")}
              >
                All Reports ({reportsList.length})
              </button>
              <button
                className={`tab ${activeReportTab === "gst" ? "active" : ""}`}
                onClick={() => setActiveReportTab("gst")}
              >
                <Receipt size={16} /> GST & Tax Filing (2)
              </button>
              <button
                className={`tab ${activeReportTab === "financial" ? "active" : ""}`}
                onClick={() => setActiveReportTab("financial")}
              >
                <TrendingUp size={16} /> Financial & RevPAR (4)
              </button>
              <button
                className={`tab ${activeReportTab === "operations" ? "active" : ""}`}
                onClick={() => setActiveReportTab("operations")}
              >
                <ClipboardList size={16} /> Operations & Audits (6)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {filteredReports.map((r) => (
          <div key={r.id} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span className={`badge ${r.category === "gst" ? "badge-danger" : r.category === "financial" ? "badge-primary" : "badge-secondary"}`}>
                    {r.type}
                  </span>
                  <span className="badge badge-outline text-tertiary" style={{ fontSize: "10px" }}>
                    {r.timing}
                  </span>
                </div>
                <FileSpreadsheet size={22} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px", lineHeight: "1.3" }}>{r.title}</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: "20px", lineHeight: "1.5" }}>{r.desc}</p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleDownload(r.id, "csv")}
                disabled={downloading === `${r.id}_csv`}
              >
                {downloading === `${r.id}_csv` ? (
                  <><Loader2 size={14} className="spin-animation" /> Exporting...</>
                ) : downloaded.includes(`${r.id}_csv`) ? (
                  <><Check size={14} color="var(--green-600)" /> CSV Ready</>
                ) : (
                  <><Download size={14} /> Export CSV</>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleDownload(r.id, "pdf")}
                disabled={downloading === `${r.id}_pdf`}
              >
                {downloading === `${r.id}_pdf` ? (
                  <><Loader2 size={14} className="spin-animation" /> Exporting...</>
                ) : downloaded.includes(`${r.id}_pdf`) ? (
                  <><Check size={14} color="var(--green-600)" /> PDF Ready</>
                ) : (
                  <><Download size={14} /> Export PDF</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

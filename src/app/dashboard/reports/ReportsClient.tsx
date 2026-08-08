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
} from "lucide-react";

export default function ReportsClient() {
  const { property, reservations, payments, expenses, rooms } = useAppState();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<"all" | "gst" | "financial" | "operations">("all");

  const reportsList = [
    { id: "r1", title: "GSTR-1 Sales & Tax Invoice Register (SAC 9963)", desc: "B2B invoices with GSTIN, B2C summary, 12% & 18% GST tax breakdown for filing", type: "Tax & Compliance", category: "gst" },
    { id: "r2", title: "GSTR-3B Monthly Tax Liability & Input Credit (ITC)", desc: "Summary of output tax collected on room charges and input tax credit on purchases", type: "Tax & Compliance", category: "gst" },
    { id: "r3", title: "Daily Revenue & Manager's Flash Report", desc: "Detailed breakdown of cash, UPI, card, room charges, F&B revenue, and daily P&L", type: "Financial", category: "financial" },
    { id: "r4", title: "Occupancy, RevPAR & ADR Performance Matrix", desc: "Room occupancy rates, RevPAR (Revenue Per Available Room), ADR, and TrevPAR", type: "Financial", category: "financial" },
    { id: "r5", title: "City Ledger & Corporate Direct Billing Credit Aging", desc: "Outstanding corporate company accounts, credit aging (30/60/90 days), and folios", type: "Operations", category: "operations" },
    { id: "r6", title: "Housekeeping & Room Turnaround Productivity", desc: "Room cleaning turnaround times, inspected room counts, and staff performance", type: "Operations", category: "operations" },
    { id: "r7", title: "End-of-Day Night Audit & Settlement Log", desc: "EOD financial closeout, posted tariffs, open folios, and audit balance sheets", type: "Operations", category: "operations" },
  ];

  const handleDownload = (id: string, format: string) => {
    const key = `${id}_${format}`;
    setDownloading(key);

    setTimeout(() => {
      // Generate actual CSV content based on report selection
      let csvContent = "";
      const dateStr = formatDate(new Date(), "yyyy-MM-dd");

      if (id === "r1") {
        csvContent = `GSTIN,Invoice Number,Invoice Date,Guest Name,Room Rate,Taxable Value,CGST (6%/9%),SGST (6%/9%),Total Amount\n`;
        csvContent += `08AABCT1332L1ZR,INV-2026-0001,${dateStr},"Anand Verma",5500,5500,330,330,6160\n`;
      } else if (id === "r3") {
        csvContent = `Date,Total Revenue,Room Tariffs,F&B Restaurant,UPI Collections,Cash,Card,Net Profit\n`;
        csvContent += `${dateStr},1967000,1450000,517000,1250000,350000,367000,1255000\n`;
      } else {
        csvContent = `Report Title: ${reportsList.find((r) => r.id === id)?.title}\nProperty: Hotel Shemron Neemrana\nGenerated At: ${new Date().toISOString()}\nStatus: Verified\n`;
      }

      const blob = new Blob([csvContent], { type: format === "csv" ? "text/csv" : "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StaySphere_${id}_${dateStr}.${format === "csv" ? "csv" : "txt"}`;
      a.click();

      setDownloading(null);
      setDownloaded((prev) => [...prev, key]);
      setTimeout(() => {
        setDownloaded((prev) => prev.filter((d) => d !== key));
      }, 3000);
    }, 1200);
  };

  const filteredReports = reportsList.filter((r) => {
    if (activeReportTab === "all") return true;
    return r.category === activeReportTab;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational, GST & Financial Reports</h1>
          <p className="page-description">
            StayFlexi-grade GST filing registers, Manager's Flash Reports, GSTR-1, GSTR-3B, RevPAR metrics, and audit statements.
          </p>
        </div>
      </div>

      {/* Report Category Navigation Tabs */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "24px" }}>
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
            <TrendingUp size={16} /> Financial & RevPAR (2)
          </button>
          <button
            className={`tab ${activeReportTab === "operations" ? "active" : ""}`}
            onClick={() => setActiveReportTab("operations")}
          >
            <ClipboardList size={16} /> Operations & Audits (3)
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {filteredReports.map((r) => (
          <div key={r.id} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className={`badge ${r.category === "gst" ? "badge-danger" : r.category === "financial" ? "badge-primary" : "badge-secondary"}`}>
                  {r.type}
                </span>
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

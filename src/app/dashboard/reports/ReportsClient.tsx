"use client";

import { ClipboardList, Download, FileSpreadsheet } from "lucide-react";

export default function ReportsClient() {
  const reportsList = [
    { title: "Daily Revenue & Collection Report", desc: "Detailed breakdown of daily cash, UPI, card collections & room charges", type: "Financial" },
    { title: "Occupancy & ADR Performance", desc: "Room occupancy rates, RevPAR, and average daily rates by room type", type: "Operations" },
    { title: "GST & Tax Audit Report", desc: "GST tax liability report formatted for accounting software", type: "Tax & Compliance" },
    { title: "Arrivals & Departures Summary", desc: "Guest arrival logs, checked-in status, and pending departures", type: "Front Desk" },
    { title: "Housekeeping & Room Turnaround", desc: "Room cleaning durations and staff productivity metrics", type: "Housekeeping" },
    { title: "Night Audit Report", desc: "End of day financial closeout, open folios, and reconciliation checks", type: "Night Audit" },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational & Financial Reports</h1>
          <p className="page-description">
            Export comprehensive hotel operational, GST, revenue, and night audit reports.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {reportsList.map((r, idx) => (
          <div key={idx} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="badge badge-primary">{r.type}</span>
              <FileSpreadsheet size={20} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "12px 0 4px" }}>{r.title}</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: "16px" }}>{r.desc}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => alert(`Downloading CSV: ${r.title}`)}>
                <Download size={14} /> Download CSV
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => alert(`Exporting PDF: ${r.title}`)}>
                Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

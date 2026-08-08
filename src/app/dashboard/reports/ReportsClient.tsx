"use client";

import { useState } from "react";
import { ClipboardList, Download, FileSpreadsheet, Check, Loader2 } from "lucide-react";

export default function ReportsClient() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);

  const reportsList = [
    { id: "r1", title: "Daily Revenue & Collection Report", desc: "Detailed breakdown of daily cash, UPI, card collections & room charges", type: "Financial" },
    { id: "r2", title: "Occupancy & ADR Performance", desc: "Room occupancy rates, RevPAR, and average daily rates by room type", type: "Operations" },
    { id: "r3", title: "GST & Tax Audit Report", desc: "GST tax liability report formatted for accounting software", type: "Tax & Compliance" },
    { id: "r4", title: "Arrivals & Departures Summary", desc: "Guest arrival logs, checked-in status, and pending departures", type: "Front Desk" },
    { id: "r5", title: "Housekeeping & Room Turnaround", desc: "Room cleaning durations and staff productivity metrics", type: "Housekeeping" },
    { id: "r6", title: "Night Audit Report", desc: "End of day financial closeout, open folios, and reconciliation checks", type: "Night Audit" },
  ];

  const handleDownload = (id: string, format: string) => {
    const key = `${id}_${format}`;
    setDownloading(key);
    // Simulate download
    setTimeout(() => {
      setDownloading(null);
      setDownloaded((prev) => [...prev, key]);
      setTimeout(() => {
        setDownloaded((prev) => prev.filter((d) => d !== key));
      }, 3000);
    }, 1500);
  };

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {reportsList.map((r) => (
          <div key={r.id} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="badge badge-primary">{r.type}</span>
              <FileSpreadsheet size={20} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "12px 0 4px" }}>{r.title}</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: "16px" }}>{r.desc}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload(r.id, "csv")}
                disabled={downloading === `${r.id}_csv`}
              >
                {downloading === `${r.id}_csv` ? (
                  <><Loader2 size={14} className="spin-animation" /> Generating...</>
                ) : downloaded.includes(`${r.id}_csv`) ? (
                  <><Check size={14} /> Downloaded!</>
                ) : (
                  <><Download size={14} /> CSV</>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload(r.id, "pdf")}
                disabled={downloading === `${r.id}_pdf`}
              >
                {downloading === `${r.id}_pdf` ? (
                  <><Loader2 size={14} className="spin-animation" /> Generating...</>
                ) : downloaded.includes(`${r.id}_pdf`) ? (
                  <><Check size={14} /> Downloaded!</>
                ) : (
                  <><Download size={14} /> PDF</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

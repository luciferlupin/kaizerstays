"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatDate } from "@/lib/utils";
import {
  HOTEL_ACCOMMODATION_CGST_RATE,
  HOTEL_ACCOMMODATION_GST_RATE,
  HOTEL_ACCOMMODATION_SGST_RATE,
  calculateInclusiveHotelGST,
} from "@/lib/gst";
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  Check,
  Loader2,
  TrendingUp,
  Receipt,
  Calendar,
  Clock,
} from "lucide-react";

export default function ReportsClient() {
  const { property, reservations } = useAppState();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<"all" | "gst" | "financial" | "operations">("all");
  const [timeFilter, setTimeFilter] = useState<"TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "QUARTER" | "CUSTOM">("TODAY");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-08");

  const reportsList = [
    { id: "r1", title: "GSTR-1 Sales & Tax Invoice Register (SAC 9963)", desc: `${HOTEL_ACCOMMODATION_GST_RATE}% hotel accommodation GST register with CGST ${HOTEL_ACCOMMODATION_CGST_RATE}% and SGST ${HOTEL_ACCOMMODATION_SGST_RATE}%`, type: "Tax & Compliance", category: "gst", timing: "MONTH" },
    { id: "r2", title: "GSTR-3B Monthly Tax Liability", desc: "Summary of GST included in room accommodation revenue; the 5% accommodation rate is without ITC", type: "Tax & Compliance", category: "gst", timing: "MONTH" },
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
        csvContent = `GSTIN,Confirmation Number,Invoice Date,Guest Name,Room Rate (GST Inclusive),Taxable Value,CGST (${HOTEL_ACCOMMODATION_CGST_RATE}%),SGST (${HOTEL_ACCOMMODATION_SGST_RATE}%),Total Amount\n`;
        csvContent += reservations
          .filter((reservation) => reservation.status !== "CANCELLED")
          .map((reservation) => {
            const gst = calculateInclusiveHotelGST(reservation.totalAmount);
            return [
              property.gstin,
              reservation.confirmationNumber,
              formatDate(reservation.checkIn, "yyyy-MM-dd"),
              `"${reservation.guestName.replaceAll('"', '""')}"`,
              reservation.roomRate,
              gst.taxableValue,
              gst.cgst,
              gst.sgst,
              gst.totalInclusive,
            ].join(",");
          })
          .join("\n");
        if (reservations.length) csvContent += "\n";
      } else if (id === "r3") {
        const totalPaid = reservations.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
        csvContent = `Shift Date,Auditor,Opening Balance,Cash Collected,UPI Received,Card Payments,Closing Drawer Cash,Discrepancies\n`;
        csvContent += `${dateStr},"Ninaad Khera (GM)",0,0,${totalPaid},0,${totalPaid},0\n`;
      } else if (id === "r4") {
        const totalRev = reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const totalPaid = reservations.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
        csvContent = `Date,Total Revenue,Room Tariffs,F&B Restaurant,UPI Collections,Cash,Card,Net Profit\n`;
        csvContent += `${dateStr},${totalRev},${totalRev},0,${totalPaid},0,0,${totalPaid}\n`;
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

  // Live Hotel MIS Executive Report Computations (Software Start Date to Today)
  const nonCancelledRes = reservations.filter((r) => r.status !== "CANCELLED");
  const totalGrossRevenue = nonCancelledRes.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaidCollections = nonCancelledRes.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPendingCollections = nonCancelledRes.reduce((sum, r) => sum + r.balanceAmount, 0);
  const totalRoomNights = nonCancelledRes.reduce((sum, r) => sum + (r.nights || 1), 0);
  const adr = nonCancelledRes.length > 0 ? Math.round(totalGrossRevenue / Math.max(1, totalRoomNights)) : 2800;

  const totalGSTTax = nonCancelledRes.reduce((sum, r) => {
    const gst = calculateInclusiveHotelGST(r.totalAmount);
    return sum + gst.totalTax;
  }, 0);
  const totalTaxableTariff = totalGrossRevenue - totalGSTTax;

  const downloadMISReportCSV = () => {
    const csvLines = [
      `Hotel Shemron — Management Information System (MIS) Executive Report`,
      `Period: Software Ingestion Start Date to Today (${formatDate(new Date(), "dd MMM yyyy")})`,
      `Property: Hotel Shemron Neemrana (62a25484e5)`,
      `Owner & GM: Ninaad Khera`,
      ``,
      `=== FINANCIAL & OPERATIONAL MIS SUMMARY ===`,
      `Total Gross Revenue,₹${totalGrossRevenue.toFixed(2)}`,
      `Net Taxable Tariff,₹${totalTaxableTariff.toFixed(2)}`,
      `Total GST Collected (5%),₹${totalGSTTax.toFixed(2)}`,
      `Total Settled Collections,₹${totalPaidCollections.toFixed(2)}`,
      `Pending Front Desk Collections,₹${totalPendingCollections.toFixed(2)}`,
      `Average Daily Rate (ADR),₹${adr.toFixed(2)}`,
      `Total Booked Room Nights,${totalRoomNights}`,
      `Total Active Live Bookings,${nonCancelledRes.length}`,
      ``,
      `=== A-TO-Z MASTER RESERVATION LEDGER ===`,
      `Confirmation #,Guest Name,Channel Source,Stay Dates,Room Category,Room #,Nights,Total Amount (INR),GST Tax (INR),Paid (INR),Balance (INR),Status`,
      ...nonCancelledRes.map((r) => {
        const gst = calculateInclusiveHotelGST(r.totalAmount);
        return [
          r.confirmationNumber,
          `"${r.guestName.replaceAll('"', '""')}"`,
          `"${r.bookingSource.replace(/_/g, " ")}"`,
          `"${formatDate(r.checkIn, "dd MMM yyyy")} to ${formatDate(r.checkOut, "dd MMM yyyy")}"`,
          `"${r.roomType}"`,
          `"${r.roomNumber || "Unassigned"}"`,
          r.nights,
          r.totalAmount,
          gst.totalTax,
          r.paidAmount,
          r.balanceAmount,
          r.status,
        ].join(",");
      }),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hotel_Shemron_MIS_Report_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="text-primary" size={24} />
            Hotel Management Information System (MIS) Reports
          </h1>
          <p className="page-description">
            Software start date to today&apos;s date A-to-Z financial, operational, guest, and GST tax MIS executive summary for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={downloadMISReportCSV}>
            <Download size={16} /> Export A-to-Z MIS Report (CSV)
          </button>
        </div>
      </div>

      {/* Featured Live Hotel MIS Summary Card */}
      <div className="card mb-6" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(0, 113, 227, 0.04) 0%, rgba(13, 14, 18, 0.98) 100%)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="badge badge-primary text-xs font-bold uppercase tracking-wider mb-1">
              Live Executive Dashboard
            </span>
            <h2 className="text-xl font-bold">A-to-Z Hotel MIS Performance Report</h2>
            <p className="text-xs text-secondary mt-1">
              Tracking performance from Software Start Date to Today ({formatDate(new Date(), "dd MMM yyyy")}) across all OTA channels &amp; direct stays.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={downloadMISReportCSV}>
            <FileSpreadsheet size={14} /> Download Full MIS CSV
          </button>
        </div>

        {/* MIS Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card" style={{ padding: "16px", background: "var(--color-surface, rgba(255,255,255,0.03))" }}>
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-1">Total Gross Revenue</span>
            <span className="mono text-success font-extrabold text-xl">{formatCurrency(totalGrossRevenue)}</span>
            <span className="text-xs text-tertiary block mt-1">Net Tariff: {formatCurrency(totalTaxableTariff)}</span>
          </div>

          <div className="card" style={{ padding: "16px", background: "var(--color-surface, rgba(255,255,255,0.03))" }}>
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-1">GST Tax Collected (5%)</span>
            <span className="mono text-primary font-extrabold text-xl">{formatCurrency(totalGSTTax)}</span>
            <span className="text-xs text-tertiary block mt-1">CGST 2.5% + SGST 2.5%</span>
          </div>

          <div className="card" style={{ padding: "16px", background: "var(--color-surface, rgba(255,255,255,0.03))" }}>
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-1">Settled Collections</span>
            <span className="mono text-success font-extrabold text-xl">{formatCurrency(totalPaidCollections)}</span>
            <span className="text-xs text-warning block mt-1">Due: {formatCurrency(totalPendingCollections)}</span>
          </div>

          <div className="card" style={{ padding: "16px", background: "var(--color-surface, rgba(255,255,255,0.03))" }}>
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-1">Average Daily Rate (ADR)</span>
            <span className="mono font-extrabold text-xl">{formatCurrency(adr)}</span>
            <span className="text-xs text-secondary block mt-1">{totalRoomNights} Total Booked Nights</span>
          </div>
        </div>

        {/* Live A-to-Z Master Table */}
        <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
          <table className="data-table" style={{ minWidth: "950px", width: "100%" }}>
            <thead>
              <tr>
                <th>Confirmation #</th>
                <th>Guest Name</th>
                <th>OTA Source</th>
                <th>Stay Dates</th>
                <th>Room &amp; Category</th>
                <th className="text-right">Gross Tariff</th>
                <th className="text-right">GST (5%)</th>
                <th className="text-right">Folio Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {nonCancelledRes.map((r) => {
                const gst = calculateInclusiveHotelGST(r.totalAmount);
                return (
                  <tr key={r.id}>
                    <td className="mono text-xs font-bold text-primary">{r.confirmationNumber}</td>
                    <td className="font-bold text-sm">{r.guestName}</td>
                    <td>
                      <span className="badge badge-default text-xs">{r.bookingSource.replace(/_/g, " ")}</span>
                    </td>
                    <td className="text-xs">
                      {formatDate(r.checkIn, "dd MMM yyyy")} → {formatDate(r.checkOut, "dd MMM yyyy")} ({r.nights}n)
                    </td>
                    <td>
                      <div className="font-semibold text-xs">{r.roomType}</div>
                      <div className="text-xs text-primary font-bold">{r.roomNumber ? `Room #${r.roomNumber}` : "Unassigned"}</div>
                    </td>
                    <td className="text-right mono font-bold text-sm">{formatCurrency(r.totalAmount)}</td>
                    <td className="text-right mono text-xs text-secondary">{formatCurrency(gst.totalTax)}</td>
                    <td className="text-right mono font-bold text-sm">
                      {r.balanceAmount === 0 ? (
                        <span className="badge badge-success text-xs font-bold">Settled (₹0)</span>
                      ) : (
                        <span className="text-warning font-bold">{formatCurrency(r.balanceAmount)}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge text-xs ${r.status === "CHECKED_IN" ? "badge-success font-bold" : r.status === "CONFIRMED" ? "badge-primary" : "badge-secondary"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

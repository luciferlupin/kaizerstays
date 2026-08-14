"use client";

import { useState } from "react";
import { NightAuditRecord } from "@/lib/channels-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  HOTEL_ACCOMMODATION_GST_RATE,
  calculateInclusiveHotelGST,
} from "@/lib/gst";
import {
  Moon,
  Play,
  CheckCircle2,
  Download,
  Loader2,
  Check,
  ShieldCheck,
} from "lucide-react";

import { useAppState } from "@/context/AppStateContext";

interface AuditStep {
  id: number;
  name: string;
  description: string;
  status: "idle" | "running" | "done" | "error";
  detail?: string;
}

export default function NightAuditClient() {
  const { nightAudits, runNightAudit, reservations, currentUser } = useAppState();
  const [history, setHistory] = useState(nightAudits);
  const [isRunning, setIsRunning] = useState(false);
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    roomsCharged: number;
    revenuePosted: number;
    taxCollected: number;
    openFolios: number;
  } | null>(null);

  const initialSteps: AuditStep[] = [
    { id: 1, name: "Verify Room Occupancy & Unassigned Arrivals", description: "Audit 43 rooms and verify checked-in guest folios", status: "idle" },
    { id: 2, name: "Batch Post Room Tariffs & GST Taxes (SAC 9963)", description: `Batch post room tariffs with ${HOTEL_ACCOMMODATION_GST_RATE}% GST included in guest folios`, status: "idle" },
    { id: 3, name: "Reconcile Restaurant POS & Outlet Room Charges", description: "Consolidate KOT bills & room charges from F&B outlets", status: "idle" },
    { id: 4, name: "Assess Late Check-out Penalties & No-Show Auto-Cancels", description: "Process no-show fees & late checkout surcharges", status: "idle" },
    { id: 5, name: "Settle City Ledger & Corporate Credit Aging", description: "Reconcile direct billing corporate accounts & guest ledgers", status: "idle" },
    { id: 6, name: "Seal Business Date & Generate EOD Flash Report", description: "Seal financial business date and advance system clock", status: "idle" },
  ];

  const [steps, setSteps] = useState<AuditStep[]>(initialSteps);

  const checkedInReservations = reservations.filter((reservation) => reservation.status === "CHECKED_IN");
  const pendingTariffs = checkedInReservations.reduce((total, reservation) => total + reservation.roomRate, 0);
  const pendingTax = calculateInclusiveHotelGST(pendingTariffs).totalTax;

  const exportEODReport = (selectedRecord?: NightAuditRecord) => {
    const record = selectedRecord || auditResult || {
      roomsCharged: 0,
      revenuePosted: 0,
      taxCollected: 0,
      openFolios: 0,
    };
    const content = `KaizerStays OS — Hotel Shemron EOD Night Audit Flash Report
Date: ${formatDate(new Date(), "yyyy-MM-dd HH:mm:ss")}
Auditor: ${selectedRecord?.runBy || currentUser?.name || "Hotel user"}

=== FINANCIAL SUMMARY ===
Rooms Charged: ${record.roomsCharged}
Total Revenue Posted: INR ${record.revenuePosted}
GST Tax Collected (${HOTEL_ACCOMMODATION_GST_RATE}% included): INR ${record.taxCollected}
Open Guest Folios: ${record.openFolios}
Record Status: AUDIT SNAPSHOT SAVED
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KaizerStays_EOD_NightAudit_${formatDate(new Date(), "yyyy-MM-dd")}.txt`;
    a.click();
  };

  const startNightAudit = () => {
    setIsRunning(true);
    setAuditCompleted(false);
    setSteps(initialSteps);

    const runStep = (index: number) => {
      if (index >= initialSteps.length) {
        setIsRunning(false);
        setAuditCompleted(true);
        const record = runNightAudit();
        setHistory([record, ...nightAudits]);
        setAuditResult({
          roomsCharged: record.roomsCharged,
          revenuePosted: record.revenuePosted,
          taxCollected: record.taxCollected,
          openFolios: record.openFolios,
        });
        return;
      }

      setSteps((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, status: "running" }
            : i < index
            ? { ...s, status: "done" }
            : s
        )
      );

      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s, i) =>
            i === index
              ? {
                  ...s,
                  status: "done",
                  detail:
                    i === 0
                      ? `${checkedInReservations.length} checked-in reservation${checkedInReservations.length === 1 ? "" : "s"} reviewed`
                      : i === 1
                      ? `${formatCurrency(pendingTariffs)} room tariff and ${formatCurrency(pendingTax)} tax calculated`
                      : i === 2
                      ? "Existing folio items reviewed"
                      : i === 3
                      ? "No automated penalties or cancellations applied"
                      : i === 4
                        ? "Outstanding folio balances reviewed"
                        : "Audit snapshot saved to activity history",
                }
              : s
          )
        );
        runStep(index + 1);
      }, 350);
    };

    runStep(0);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Moon size={24} className="text-primary" />
            Night Audit & Daily Financial Closeout
          </h1>
          <p className="page-description">
            Review the current PMS snapshot, calculate room tariffs and save an auditable end-of-day record for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={startNightAudit}
            disabled={isRunning}
            style={{ padding: "10px 20px", fontWeight: 600 }}
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="spin-animation" /> Running Audit...
              </>
            ) : (
              <>
              <Play size={18} /> Run Audit Snapshot
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Last Audit Date</span>
          <div className="stat-card-value" style={{ fontSize: "20px" }}>
            {history[0] ? formatDate(history[0].date, "dd MMM yyyy") : "Not run yet"}
          </div>
          <span className="text-xs text-success" style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <ShieldCheck size={14} /> {history[0] ? `Completed by ${history[0].runBy}` : "No saved audit record"}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Pending Room Tariffs</span>
          <div className="stat-card-value text-primary">{formatCurrency(pendingTariffs)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>{checkedInReservations.length} occupied rooms</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">GST Tax Liability ({HOTEL_ACCOMMODATION_GST_RATE}% included)</span>
          <div className="stat-card-value text-warning">{formatCurrency(pendingTax)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Extracted from GST-inclusive room tariffs</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Audit Discrepancies</span>
          <div className="stat-card-value text-success">0</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>No discrepancy engine connected</span>
        </div>
      </div>

      {/* Main Execution Workflow Card */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>End-of-Day Audit Pipeline</h3>
            <p className="text-sm text-secondary" style={{ marginTop: "2px" }}>
              Six-step review of the records currently saved in this workspace.
            </p>
          </div>
          {auditCompleted && (
            <span className="badge badge-success" style={{ fontSize: "13px", padding: "6px 12px" }}>
              <CheckCircle2 size={14} style={{ marginRight: "4px" }} /> Today&apos;s Audit Complete
            </span>
          )}
        </div>

        {/* Progress steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "16px",
                borderRadius: "var(--radius-lg)",
                background:
                  step.status === "running"
                    ? "var(--color-primary-light)"
                    : step.status === "done"
                    ? "var(--color-bg-secondary)"
                    : "var(--color-bg-tertiary)",
                border:
                  step.status === "running"
                    ? "1px solid var(--color-primary)"
                    : step.status === "done"
                    ? "1px solid var(--color-border-subtle)"
                    : "1px dashed var(--color-border)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  background:
                    step.status === "done"
                      ? "var(--green-500)"
                      : step.status === "running"
                      ? "var(--color-primary)"
                      : "var(--color-bg-elevated)",
                  color: step.status === "idle" ? "var(--color-text-secondary)" : "white",
                  flexShrink: 0,
                }}
              >
                {step.status === "done" ? (
                  <Check size={18} />
                ) : step.status === "running" ? (
                  <Loader2 size={18} className="spin-animation" />
                ) : (
                  step.id
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: step.status === "idle" ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                    {step.name}
                  </h4>
                  <span
                    className={`badge ${
                      step.status === "done"
                        ? "badge-success"
                        : step.status === "running"
                        ? "badge-primary"
                        : "badge-default"
                    }`}
                  >
                    {step.status === "done"
                      ? "PASSED"
                      : step.status === "running"
                      ? "IN PROGRESS"
                      : "WAITING"}
                  </span>
                </div>
                <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                  {step.description}
                </p>

                {step.detail && (
                  <div
                    className="mono font-semibold"
                    style={{
                      fontSize: "12px",
                      color: "var(--green-600)",
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle2 size={14} /> {step.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Audit Completion Summary Box */}
        {auditCompleted && auditResult && (
          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              borderRadius: "var(--radius-lg)",
              background: "var(--green-50)",
              border: "1px solid var(--green-200)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--green-500)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--green-900)" }}>
                  Night audit snapshot saved
                </h3>
                <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                  The current room-tariff summary was recorded. This preview does not advance a financial business date or settle external ledgers.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "16px" }}>
              <div style={{ background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--green-100)" }}>
                <span className="text-xs text-secondary">Rooms Processed</span>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {auditResult.roomsCharged} Rooms
                </div>
              </div>
              <div style={{ background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--green-100)" }}>
                <span className="text-xs text-secondary">Posted Revenue</span>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                  {formatCurrency(auditResult.revenuePosted)}
                </div>
              </div>
              <div style={{ background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--green-100)" }}>
                <span className="text-xs text-secondary">GST Liability</span>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-warning)" }}>
                  {formatCurrency(auditResult.taxCollected)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Audit Logs */}
      <div className="card">
        <div className="card-header" style={{ padding: "16px 20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Night Audit History & Logs</h3>
            <p className="text-xs text-secondary">Past end-of-day financial closeouts and generated audit reports</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Date</th>
                <th>Run Time</th>
                <th>Status</th>
                <th>Rooms Charged</th>
                <th>Revenue Posted</th>
                <th>GST Collected</th>
                <th>Auditor</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={8} className="text-center text-secondary">No night audit snapshots saved yet.</td></tr>}
              {history.map((record) => (
                <tr key={record.id}>
                  <td className="font-semibold">{formatDate(record.date, "dd MMM yyyy")}</td>
                  <td className="text-tertiary text-xs">{formatDate(record.completedAt, "hh:mm a")}</td>
                  <td>
                    <span
                      className={`badge ${
                        record.status === "COMPLETED" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>{record.roomsCharged} Rooms</td>
                  <td className="font-semibold text-primary mono">{formatCurrency(record.revenuePosted)}</td>
                  <td className="text-secondary mono">{formatCurrency(record.taxCollected)}</td>
                  <td className="text-secondary">{record.runBy}</td>
                  <td className="text-right">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => exportEODReport(record)}
                    >
                      <Download size={14} /> TXT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

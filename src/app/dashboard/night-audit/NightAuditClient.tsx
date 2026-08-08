"use client";

import { useState } from "react";
import { nightAuditHistory } from "@/lib/channels-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Moon,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Download,
  Loader2,
  Check,
  ShieldCheck,
  Building2,
  Receipt,
  DollarSign,
  ArrowRight,
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
  const { nightAudits, runNightAudit } = useAppState();
  const [history, setHistory] = useState(nightAudits);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    roomsCharged: number;
    revenuePosted: number;
    taxCollected: number;
    openFolios: number;
  } | null>(null);

  const initialSteps: AuditStep[] = [
    { id: 1, name: "Verify Room Occupancy & Statuses", description: "Audit 33 occupied rooms and check for unassigned arrivals", status: "idle" },
    { id: 2, name: "Post Room Charges & GST Taxes", description: "Batch post room tariffs & 12% GST to guest folios", status: "idle" },
    { id: 3, name: "Reconcile Restaurant POS & Outlets", description: "Consolidate KOT bills & room charges from F&B outlets", status: "idle" },
    { id: 4, name: "Verify Payment Ledgers & Deposits", description: "Reconcile UPI, credit card VCCs, cash, and bank transfers", status: "idle" },
    { id: 5, name: "Close Financial Day & Generate Reports", description: "Seal business date for 08 Aug 2026 and advance system clock", status: "idle" },
  ];

  const [steps, setSteps] = useState<AuditStep[]>(initialSteps);

  const startNightAudit = () => {
    setIsRunning(true);
    setAuditCompleted(false);
    setSteps(initialSteps);
    setCurrentStepIndex(0);

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

      setCurrentStepIndex(index);
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
                      ? "33/33 rooms verified • 0 status mismatches"
                      : i === 1
                      ? "₹142,800 room revenue & ₹17,136 GST posted"
                      : i === 2
                      ? "₹18,450 F&B charges settled to folios"
                      : i === 3
                      ? "All cash & UPI ledgers balanced cleanly"
                      : "Business date closed • System advanced to 09 Aug",
                }
              : s
          )
        );
        runStep(index + 1);
      }, 1200);
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
            Automate end-of-day revenue posting, GST tax auditing, outlet reconciliation, and daily closeout for Hotel Shemron.
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
                <Play size={18} /> Run Night Audit Now
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
            {formatDate(history[0]?.date || new Date(), "dd MMM yyyy")}
          </div>
          <span className="text-xs text-success" style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <ShieldCheck size={14} /> Completed by {history[0]?.runBy || "System"}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Pending Room Tariffs</span>
          <div className="stat-card-value text-primary">{formatCurrency(142800)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>33 Occupied Rooms</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">GST Tax Liability (12%)</span>
          <div className="stat-card-value text-warning">{formatCurrency(17136)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Auto-calculated</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Audit Discrepancies</span>
          <div className="stat-card-value text-success">0</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>Clean Reconciliation</span>
        </div>
      </div>

      {/* Main Execution Workflow Card */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>End-of-Day Audit Pipeline</h3>
            <p className="text-sm text-secondary" style={{ marginTop: "2px" }}>
              Automated 5-step verification process to seal today's financial transactions.
            </p>
          </div>
          {auditCompleted && (
            <span className="badge badge-success" style={{ fontSize: "13px", padding: "6px 12px" }}>
              <CheckCircle2 size={14} style={{ marginRight: "4px" }} /> Today's Audit Complete
            </span>
          )}
        </div>

        {/* Progress steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {steps.map((step, idx) => (
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
                  Night Audit Successfully Execution & Sealed!
                </h3>
                <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                  Financial date for Hotel Shemron updated cleanly. All folios posted and reports generated.
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
                      onClick={() => alert(`Downloading Night Audit PDF for ${formatDate(record.date, "dd MMM yyyy")}`)}
                    >
                      <Download size={14} /> PDF
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

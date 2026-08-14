"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Plus,
  Search,
  Check,
  Printer,
  X,
  Download,
  Filter,
} from "lucide-react";

export default function PaymentsClient() {
  const { payments, reservations, property, addPayment, addActivity } = useAppState();
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    id: string;
    paymentNumber: string;
    reservationId: string;
    guestName: string;
    amount: number;
    method: string;
    reference: string;
    receivedAt: Date;
  } | null>(null);

  const [saved, setSaved] = useState(false);

  // Record Payment Form state
  const [selectedResId, setSelectedResId] = useState(() => reservations[0]?.id || "res_001");
  const [amount, setAmount] = useState<number | string>(2800);
  const [method, setMethod] = useState("UPI");
  const [ref, setRef] = useState("UPI987654321");

  // Derive complete payments list combining logged payments + prepaid reservation folios
  const allPaymentsList = useMemo(() => {
    const derivedFromReservations = reservations
      .filter((r) => r.paidAmount > 0 && !payments.some((p) => p.reservationId === r.id))
      .map((r, idx) => ({
        id: `py_derived_${r.id}`,
        paymentNumber: `RCT-2026-${(idx + 101).toString().padStart(4, "0")}`,
        reservationId: r.id,
        guestName: r.guestName,
        amount: r.paidAmount,
        method: r.bookingSource === "WALK_IN" ? "CASH" : r.bookingSource === "DIRECT" ? "UPI" : "OTA_SETTLEMENT",
        reference: `${r.bookingSource} Prepaid`,
        receivedAt: new Date(r.checkIn),
      }));

    return [...payments, ...derivedFromReservations];
  }, [payments, reservations]);

  const totalCollected = useMemo(
    () => allPaymentsList.reduce((sum, p) => sum + p.amount, 0),
    [allPaymentsList]
  );

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find((r) => r.id === selectedResId) || reservations[0];
    if (!res) return;
    const safeAmount = Number(amount) || 0;
    addPayment({
      reservationId: res.id,
      guestName: res.guestName,
      amount: safeAmount,
      method,
      reference: ref,
    });
    addActivity("Payment Recorded", "payments", res.id, `${formatCurrency(safeAmount)} received via ${method} for ${res.guestName}`);
    setSaved(true);
    setTimeout(() => {
      setShowRecordModal(false);
      setSaved(false);
    }, 1200);
  };

  const filtered = useMemo(() => {
    return allPaymentsList.filter((p) => {
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.guestName.toLowerCase().includes(q) ||
          p.paymentNumber.toLowerCase().includes(q) ||
          (p.reference && p.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allPaymentsList, methodFilter, search]);

  const receiptReservation = useMemo(() => {
    if (!selectedReceipt) return null;
    return reservations.find((r) => r.id === selectedReceipt.reservationId) || reservations[0];
  }, [selectedReceipt, reservations]);

  const exportPaymentsCSV = () => {
    const csvContent = `KaizerStays OS — Hotel Shemron Payments Collection Ledger
Export Date: ${new Date().toISOString()}
Total Collections: INR ${totalCollected}
Total Transactions: ${allPaymentsList.length}

=== PAYMENT TRANSACTIONS LIST ===
Receipt #,Guest Name,Room #,Confirmation #,Method,Reference,Timestamp,Amount (INR)
${filtered
  .map((p) => {
    const res = reservations.find((r) => r.id === p.reservationId);
    return `"${p.paymentNumber}","${p.guestName.replace(/"/g, '""')}","${
      res?.roomNumber || "101"
    }","${res?.confirmationNumber || "RES-001"}","${p.method}","${(p.reference || "").replace(
      /"/g,
      '""'
    )}","${formatDate(p.receivedAt, "yyyy-MM-dd HH:mm")}",${p.amount}`;
  })
  .join("\n")}
`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KaizerStays_Payments_Ledger_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CreditCard className="text-primary" size={24} />
            Payments Ledger & Guest Receipts
          </h1>
          <p className="page-description">
            Track immutable guest payments, issue settlement receipts, and print payment slips for guests.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={exportPaymentsCSV} disabled={allPaymentsList.length === 0}>
            <Download size={16} /> Export Payments CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <span className="stat-card-label">Total Collections</span>
          <div className="stat-card-value text-success">{formatCurrency(totalCollected)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Gross payment ledger</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label font-semibold">Payment Receipts Issued</span>
          <div className="stat-card-value">{allPaymentsList.length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Receipt transactions</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">In-House & Active Bookings</span>
          <div className="stat-card-value text-primary">
            {reservations.filter((r) => r.status === "CHECKED_IN" || r.status === "CONFIRMED").length}
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Hotel Shemron guests</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-secondary">Method Filter:</span>
            {["ALL", "UPI", "CASH", "CREDIT_CARD", "BANK_TRANSFER", "OTA_COLLECT", "BTC"].map((m) => (
              <button
                key={m}
                type="button"
                className={`btn btn-sm ${methodFilter === m ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setMethodFilter(m)}
              >
                {m === "ALL" ? "All Methods" : m === "OTA_COLLECT" ? "OTA Collect" : m === "BTC" ? "BTC (Due)" : m.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "260px" }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input text-xs"
              placeholder="Search receipt # or guest name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table of Payments */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <CreditCard size={38} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Payment Transactions Found</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Record guest payment receipts via UPI, cash, credit card, or OTA settlements.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowRecordModal(true)}>
                <Plus size={14} /> Record Payment
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Guest Name</th>
                  <th>Room / Booking</th>
                  <th>Payment Method</th>
                  <th>Reference #</th>
                  <th>Timestamp</th>
                  <th className="text-right">Amount Received</th>
                  <th className="text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const res = reservations.find((r) => r.id === p.reservationId);
                  return (
                    <tr key={p.id}>
                      <td className="mono text-xs font-bold text-primary">{p.paymentNumber}</td>
                      <td className="font-semibold">{p.guestName}</td>
                      <td>
                        <span className="badge badge-default">
                          Room #{res?.roomNumber || "101"} · {res?.confirmationNumber || "AIO-RES"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.method === "UPI"
                              ? "badge-info"
                              : p.method === "CASH"
                              ? "badge-success"
                              : p.method === "BTC"
                              ? "badge-warning"
                              : p.method === "OTA_COLLECT" || p.method === "OTA_SETTLEMENT"
                              ? "badge-purple"
                              : "badge-primary"
                          }`}
                        >
                          {p.method === "BTC" ? "BTC (Bill To Company)" : p.method === "OTA_COLLECT" ? "OTA Collect" : p.method.replace("_", " ")}
                        </span>
                      </td>
                      <td className="mono text-xs text-tertiary">{p.reference || "N/A"}</td>
                      <td className="text-xs text-secondary">{formatDate(p.receivedAt, "dd MMM yyyy, hh:mm a")}</td>
                      <td className="text-right mono font-bold text-success" style={{ fontSize: "15px" }}>
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedReceipt(p)}
                          title="Print Payment Receipt"
                        >
                          <Printer size={14} /> Print Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="card modal-card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              background: "var(--color-bg, #0d0e12)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CreditCard size={20} className="text-primary" />
                Record Payment Transaction
              </h3>
              <button type="button" className="btn btn-ghost btn-icon-only btn-sm" onClick={() => setShowRecordModal(false)}>
                <X size={16} />
              </button>
            </div>

            {saved ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--green-50)",
                    color: "var(--green-600)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Check size={24} />
                </div>
                <h3>Payment Recorded & Receipt Generated!</h3>
                <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                  {formatCurrency(amount)} received via {method}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecordPaymentSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-semibold">Select Reservation / Guest</label>
                  <select
                    className="form-control text-sm"
                    value={selectedResId}
                    onChange={(e) => setSelectedResId(e.target.value)}
                  >
                    {reservations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.guestName} ({r.confirmationNumber}) — Room #{r.roomNumber || "101"} [{r.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label text-xs font-semibold">Payment Amount (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      className="form-control text-sm font-bold"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val === "" ? "" : Number(val));
                      }}
                      placeholder="Enter amount (₹)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs font-semibold">Payment Method</label>
                    <select className="form-control text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="UPI">UPI / PhonePe / GPay</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="OTA_COLLECT">OTA Payment (Pre-paid / OTA Collect)</option>
                      <option value="BTC">BTC (Bill To Company / Credit)</option>
                    </select>
                  </div>
                </div>

                {method === "BTC" && (
                  <div style={{ padding: "10px 14px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "6px", fontSize: "12px", color: "var(--amber-700, #b45309)" }}>
                    <strong>BTC (Bill To Company):</strong> Bill is billed to Company credit ledger and marked under Due Payments. When company settles payment later, you can mark it settled.
                  </div>
                )}
                {method === "OTA_COLLECT" && (
                  <div style={{ padding: "10px 14px", background: "rgba(0, 113, 227, 0.08)", border: "1px solid rgba(0, 113, 227, 0.2)", borderRadius: "6px", fontSize: "12px", color: "var(--blue-700, #005bb5)" }}>
                    <strong>OTA Collect:</strong> Payment collected directly by OTA channel (Booking.com / Agoda / MMT) prior to check-in.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label text-xs font-semibold">Transaction Reference / UTR #</label>
                  <input
                    type="text"
                    className="form-control text-sm mono"
                    placeholder="e.g. UPI987654321012 or Cash Ref"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Record Payment & Generate Receipt
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Printable Receipt */}
      {selectedReceipt && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="card modal-card"
            style={{
              width: "100%",
              maxWidth: "780px",
              padding: "32px",
              background: "#ffffff",
              color: "#000000",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                borderBottom: "2px solid #0f172a",
                paddingBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#0071e3",
                  }}
                >
                  OFFICIAL PAYMENT RECEIPT
                </div>
                <h2 style={{ fontSize: "26px", fontWeight: 900, margin: "4px 0", color: "#0f172a" }}>HOTEL SHEMRON</h2>
                <div style={{ fontSize: "12px", color: "#475569" }}>NH-48, Shahjahanpur, Neemrana, Rajasthan · GSTIN: {property.gstin}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm no-print" onClick={() => setSelectedReceipt(null)}>
                <X size={20} style={{ color: "#000" }} />
              </button>
            </div>

            {/* Receipt Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                background: "#f8fafc",
                padding: "18px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Receipt Number</span>
                <div style={{ fontWeight: 800, fontSize: "16px", fontFamily: "monospace", color: "#0071e3", marginTop: "2px" }}>
                  {selectedReceipt.paymentNumber}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Date & Time</span>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginTop: "2px" }}>
                  {formatDate(selectedReceipt.receivedAt, "dd MMM yyyy, hh:mm a")}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Guest Name</span>
                <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a", marginTop: "2px" }}>{selectedReceipt.guestName}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Room & Reservation</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b", marginTop: "2px" }}>
                  Room #{receiptReservation?.roomNumber || "101"} · {receiptReservation?.confirmationNumber || "AIO-RES"}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
              <div
                style={{
                  background: "#f1f5f9",
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontSize: "13px",
                  textTransform: "uppercase",
                  color: "#334155",
                }}
              >
                Payment Transaction Breakdown
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#475569" }}>Payment Method:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{selectedReceipt.method.replace("_", " ")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#475569" }}>Transaction Reference / UTR:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{selectedReceipt.reference || "N/A"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    borderTop: "1px dashed #cbd5e1",
                    paddingTop: "12px",
                    marginTop: "6px",
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>Total Amount Received:</span>
                  <span style={{ fontWeight: 900, fontSize: "20px", color: "#16a34a" }}>
                    {formatCurrency(selectedReceipt.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginBottom: "20px" }}>
              Received with thanks by Front Desk Office · Hotel Shemron Neemrana (Computer Generated Receipt)
            </div>

            <div className="flex items-center justify-end gap-2 no-print" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReceipt(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Guest Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

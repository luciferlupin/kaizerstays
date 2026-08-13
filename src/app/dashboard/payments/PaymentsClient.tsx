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
  Building2,
  Phone,
  Mail,
  Send,
} from "lucide-react";

export default function PaymentsClient() {
  const { payments, reservations, addPayment } = useAppState();
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<typeof payments[0] | null>(null);
  const [saved, setSaved] = useState(false);

  // Record Payment Form state
  const [selectedResId, setSelectedResId] = useState(reservations[0]?.id || "res_001");
  const [amount, setAmount] = useState<number>(5500);
  const [method, setMethod] = useState("UPI");
  const [ref, setRef] = useState("UPI987654321");

  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find((r) => r.id === selectedResId) || reservations[0];
    addPayment({
      reservationId: res.id,
      guestName: res.guestName,
      amount: Number(amount) || 0,
      method,
      reference: ref,
    });
    setSaved(true);
    setTimeout(() => {
      setShowRecordModal(false);
      setSaved(false);
    }, 1200);
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
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
  }, [payments, methodFilter, search]);

  // Find reservation detail for printed receipt
  const receiptReservation = useMemo(() => {
    if (!selectedReceipt) return null;
    return reservations.find((r) => r.id === selectedReceipt.reservationId) || reservations[0];
  }, [selectedReceipt, reservations]);

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
        </div>
        <div className="stat-card">
          <span className="stat-card-label font-semibold">Total Payment Receipts Issued</span>
          <div className="stat-card-value">{payments.length}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">In-House Active Reservations</span>
          <div className="stat-card-value text-primary">
            {reservations.filter((r) => r.status === "CHECKED_IN" || r.status === "CONFIRMED").length}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-secondary">Method Filter:</span>
            {["ALL", "UPI", "CASH", "CREDIT_CARD", "BANK_TRANSFER"].map((m) => (
              <button
                key={m}
                type="button"
                className={`btn btn-sm ${methodFilter === m ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setMethodFilter(m)}
              >
                {m === "ALL" ? "All Methods" : m.replace("_", " ")}
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
                        <span className={`badge ${p.method === "UPI" ? "badge-info" : p.method === "CASH" ? "badge-success" : "badge-primary"}`}>
                          {p.method.replace("_", " ")}
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
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "500px", padding: "24px", background: "var(--color-bg, #0d0e12)", border: "1px solid var(--color-border)" }}>
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
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
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
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs font-semibold">Payment Method</label>
                    <select className="form-control text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>

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

      {/* Printable Official Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "540px", padding: "24px", background: "#ffffff", color: "#000000", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #000", paddingBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Official Payment Receipt</div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0", color: "#0f172a" }}>HOTEL SHEMRON</h2>
                <div style={{ fontSize: "11px", color: "#475569" }}>NH-48, Shahjahanpur, Neemrana, Rajasthan · GSTIN: 08AAAAH9821K1Z2</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedReceipt(null)}>
                <X size={18} style={{ color: "#000" }} />
              </button>
            </div>

            {/* Receipt Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Receipt Number</span>
                <div style={{ fontWeight: 800, fontSize: "14px", fontFamily: "monospace", color: "#0071e3" }}>{selectedReceipt.paymentNumber}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Date & Time</span>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b" }}>{formatDate(selectedReceipt.receivedAt, "dd MMM yyyy, hh:mm a")}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Guest Name</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{selectedReceipt.guestName}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Room & Confirmation</span>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>
                  Room #{receiptReservation?.roomNumber || "101"} · {receiptReservation?.confirmationNumber || "AIO-RES"}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
              <div style={{ background: "#f1f5f9", padding: "10px 14px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", color: "#334155" }}>
                Payment Transaction Details
              </div>
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#475569" }}>Payment Method:</span>
                  <span style={{ fontWeight: 700 }}>{selectedReceipt.method.replace("_", " ")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#475569" }}>Transaction Ref / UTR:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{selectedReceipt.reference || "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "4px" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>Total Amount Received:</span>
                  <span style={{ fontWeight: 800, fontSize: "18px", color: "#16a34a" }}>{formatCurrency(selectedReceipt.amount)}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", marginBottom: "16px" }}>
              Received with thanks by Front Desk Office · Hotel Shemron Neemrana (Computer Generated Receipt)
            </div>

            <div className="flex items-center justify-end gap-2" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
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

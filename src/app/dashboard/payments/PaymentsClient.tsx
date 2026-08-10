"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Plus, Search, Filter, CheckCircle2, X, Check } from "lucide-react";

export default function PaymentsClient() {
  const { payments, reservations, addPayment } = useAppState();
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form
  const [selectedResId, setSelectedResId] = useState(reservations[0]?.id || "res_001");
  const [amount, setAmount] = useState<number>(5500);
  const [method, setMethod] = useState("UPI");
  const [ref, setRef] = useState("UPI987654321");

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleRecordPaymentSubmit = () => {
    const res = reservations.find((r) => r.id === selectedResId) || reservations[0];
    addPayment({
      reservationId: res.id,
      guestName: res.guestName,
      amount,
      method,
      reference: ref,
    });
    setSaved(true);
    setTimeout(() => {
      setShowModal(false);
      setSaved(false);
    }, 1200);
  };

  const filtered = payments.filter((p) => {
    if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.guestName.toLowerCase().includes(q) || p.paymentNumber.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments Ledger</h1>
          <p className="page-description">
            Immutable financial payment transactions, settlement receipts, and audit trail.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total Collections</span>
          <div className="stat-card-value text-success">{formatCurrency(totalCollected)}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Transactions Count</span>
          <div className="stat-card-value">{payments.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <CreditCard size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Payment Transactions Yet</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Record guest payments, UPI receipts, cash deposits, or OTA settlements.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Record Payment
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Guest Name</th>
                  <th>Method</th>
                  <th>Reference #</th>
                  <th>Timestamp</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono text-xs font-semibold">{p.paymentNumber}</td>
                    <td className="font-semibold">{p.guestName}</td>
                    <td><span className="badge badge-default">{p.method}</span></td>
                    <td className="mono text-xs text-tertiary">{p.reference || "N/A"}</td>
                    <td className="text-xs text-secondary">{formatDate(p.receivedAt, "dd MMM yyyy, hh:mm a")}</td>
                    <td className="text-right mono font-bold text-success">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment Transaction</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {saved ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Payment Recorded!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    {formatCurrency(amount)} received via {method}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Select In-House Reservation</label>
                    <select
                      className="form-select"
                      value={selectedResId}
                      onChange={(e) => setSelectedResId(e.target.value)}
                    >
                      {reservations.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.guestName} ({r.confirmationNumber}) — Room #{r.roomNumber || "Unassigned"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transaction Reference #</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ref}
                      onChange={(e) => setRef(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            {!saved && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleRecordPaymentSubmit}>Record Transaction</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

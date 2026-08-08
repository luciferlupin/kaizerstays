"use client";

import { useState } from "react";
import { demoPayments, demoRevenueStats } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Plus, Search, Filter, CheckCircle2 } from "lucide-react";

export default function PaymentsClient() {
  const [payments, setPayments] = useState(demoPayments);
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form
  const [guestName, setGuestName] = useState("Rajesh Sharma");
  const [amount, setAmount] = useState<number>(5500);
  const [method, setMethod] = useState("UPI");
  const [ref, setRef] = useState("UPI987654321");

  const handleRecordPayment = () => {
    const newPayment = {
      id: `pay_${Date.now()}`,
      paymentNumber: `PAY-20260808-000${payments.length + 1}`,
      guestName,
      reservationId: "res_001",
      amount,
      method,
      status: "COMPLETED",
      reference: ref,
      receivedAt: new Date(),
    };
    setPayments([newPayment, ...payments]);
    setShowModal(false);
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

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Collected Today</span>
          <div className="stat-card-value text-success">{formatCurrency(demoRevenueStats.revenueToday)}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Outstanding Balances</span>
          <div className="stat-card-value text-danger">{formatCurrency(demoRevenueStats.outstandingPayments)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="search-input-wrapper" style={{ minWidth: "240px" }}>
            <Search className="search-icon" size={14} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by guest or payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: "160px" }}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Guest</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{p.paymentNumber}</td>
                  <td className="font-semibold">{p.guestName}</td>
                  <td><span className="badge badge-default">{p.method}</span></td>
                  <td className="mono text-xs">{p.reference || "N/A"}</td>
                  <td className="mono font-bold text-success" style={{ fontSize: "15px" }}>
                    {formatCurrency(p.amount)}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <span className="badge-dot" />
                      {p.status}
                    </span>
                  </td>
                  <td className="text-xs text-secondary">{formatDate(p.receivedAt, "dd MMM yyyy, hh:mm a")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Record Payment Transaction</h3>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Guest Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="RAZORPAY">Razorpay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference / UTR</label>
                <input
                  type="text"
                  className="form-input"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleCompletePayment => handleRecordPayment()}>
                Record Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

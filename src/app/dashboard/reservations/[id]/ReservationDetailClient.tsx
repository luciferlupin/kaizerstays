"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  LogIn,
  LogOut,
  CreditCard,
  Plus,
  FileText,
  MessageSquare,
  BedDouble,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Check,
} from "lucide-react";

export default function ReservationDetailClient() {
  const { reservations, guests, addPayment } = useAppState();
  const [activeTab, setActiveTab] = useState<"overview" | "folio" | "payments">("folio");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("UPI");
  const [payDone, setPayDone] = useState(false);

  // Match reservation or fallback to first
  const res = reservations[0];
  const guest = guests.find((g) => g.id === res?.guestId) || guests[0];

  const folioItems = res.folio || [];
  const totalCharges = folioItems
    .filter((f) => f.category !== "PAYMENT")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPaid = res.paidAmount;
  const balanceDue = res.balanceAmount;

  const handleRecordPayment = () => {
    if (payAmount <= 0) return;
    addPayment({
      reservationId: res.id,
      guestName: res.guestName,
      amount: payAmount,
      method: payMethod,
    });
    setPayDone(true);
    setTimeout(() => {
      setShowPayModal(false);
      setPayDone(false);
    }, 1200);
  };

  return (
    <div className="page-content">
      {/* Back Link */}
      <div>
        <Link href="/dashboard/reservations" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to Reservations
        </Link>
      </div>

      {/* Header Banner */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 className="page-title">{res.guestName}</h1>
              <span className="badge badge-primary">
                {res.status}
              </span>
            </div>
            <div className="mono text-secondary text-sm" style={{ marginTop: "4px" }}>
              {res.confirmationNumber} • Booked via {res.bookingSource}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setPayAmount(balanceDue);
                setShowPayModal(true);
              }}
            >
              <CreditCard size={16} /> Collect Payment
            </button>
            <Link href="/dashboard/invoices" className="btn btn-secondary">
              <FileText size={16} /> Print Tax Invoice
            </Link>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <span className="text-xs text-tertiary">Room & Category</span>
            <div style={{ fontWeight: 700, fontSize: "15px" }}>
              {res.roomNumber ? `Room #${res.roomNumber}` : "Unassigned"} ({res.roomType})
            </div>
          </div>

          <div>
            <span className="text-xs text-tertiary">Stay Period</span>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>
              {formatDate(res.checkIn, "dd MMM")} → {formatDate(res.checkOut, "dd MMM")} ({res.nights}n)
            </div>
          </div>

          <div>
            <span className="text-xs text-tertiary">Total Folio Charges</span>
            <div className="mono font-bold text-primary" style={{ fontSize: "16px" }}>
              {formatCurrency(totalCharges)}
            </div>
          </div>

          <div>
            <span className="text-xs text-tertiary">Balance Due</span>
            <div className="mono font-bold" style={{ fontSize: "16px", color: balanceDue > 0 ? "var(--amber-600)" : "var(--green-600)" }}>
              {balanceDue === 0 ? "PAID IN FULL" : formatCurrency(balanceDue)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "folio" ? "active" : ""}`} onClick={() => setActiveTab("folio")}>
          Financial Folio Ledger ({folioItems.length})
        </button>
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          Guest CRM Profile
        </button>
      </div>

      {/* TAB 1: FINANCIAL FOLIO LEDGER */}
      {activeTab === "folio" && (
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Itemized Folio Ledger & Posting History</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Posting Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {folioItems.map((item) => (
                  <tr key={item.id}>
                    <td className="text-sm text-secondary">{formatDate(item.date, "dd MMM yyyy")}</td>
                    <td className="font-semibold">{item.description}</td>
                    <td>
                      <span className={`badge ${item.category === "PAYMENT" ? "badge-success" : "badge-default"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="text-right mono font-bold" style={{ color: item.amount < 0 ? "var(--green-600)" : "var(--color-text-primary)" }}>
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GUEST CRM PROFILE */}
      {activeTab === "overview" && guest && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Guest Profile & CRM History</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <span className="text-xs text-tertiary">Full Name</span>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{guest.firstName} {guest.lastName}</div>
            </div>
            <div>
              <span className="text-xs text-tertiary">Contact Info</span>
              <div style={{ fontSize: "14px" }}>{guest.email} • {guest.phone}</div>
            </div>
            <div>
              <span className="text-xs text-tertiary">Lifetime Stays</span>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{guest.totalStays} Stays ({guest.totalNights} Nights)</div>
            </div>
            <div>
              <span className="text-xs text-tertiary">Lifetime Spend</span>
              <div className="mono font-bold text-success" style={{ fontSize: "16px" }}>{formatCurrency(guest.totalSpent)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Collect Payment — {res.guestName}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPayModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {payDone ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Payment Recorded!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    {formatCurrency(payAmount)} received via {payMethod}. Folio updated.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="UPI">UPI / PhonePe / GPay</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            {!payDone && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleRecordPayment}>Record Payment</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

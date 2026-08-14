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
  RotateCcw,
} from "lucide-react";
import { toDateKey } from "@/lib/rates";

export default function ReservationDetailClient() {
  const { reservations, guests, addPayment, checkInGuest, checkOutGuest, undoCheckIn, cancelReservation } = useAppState();
  const [activeTab, setActiveTab] = useState<"overview" | "folio" | "payments">("folio");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [payMethod, setPayMethod] = useState("UPI");
  const [payDone, setPayDone] = useState(false);

  const params = useParams();
  const resId = params?.id as string | undefined;
  const res = (resId ? reservations.find((r) => r.id === resId || r.confirmationNumber === resId) : null) || reservations[0];
  const guest = guests.find((g) => g.id === res?.guestId || (res && `${g.firstName} ${g.lastName}`.trim() === res.guestName)) || guests[0];

  const folioItems = res.folio || [];
  const totalCharges = folioItems
    .filter((f) => f.category !== "PAYMENT")
    .reduce((sum, item) => sum + item.amount, 0);

  const folioPayments = folioItems
    .filter((f) => f.category === "PAYMENT")
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const totalPaid = Math.max(res.paidAmount || 0, folioPayments);
  const effectiveTotal = Math.max(res.totalAmount || 0, totalCharges);
  const balanceDue = Math.max(0, effectiveTotal - totalPaid);

  const handleRecordPayment = () => {
    const numAmount = Number(payAmount) || 0;
    if (numAmount <= 0 && payMethod !== "BTC") return;
    addPayment({
      reservationId: res.id,
      guestName: res.guestName,
      amount: numAmount,
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

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {res.status === "CONFIRMED" && (
              <button
                className={`btn ${toDateKey(new Date(res.checkIn)) > toDateKey(new Date()) ? "btn-secondary" : "btn-primary"}`}
                onClick={() => {
                  const checkInKey = toDateKey(new Date(res.checkIn));
                  const todayKey = toDateKey(new Date());
                  if (checkInKey > todayKey) {
                    const confirmEarly = window.confirm(
                      `Check-in date for ${res.guestName} is ${formatDate(res.checkIn, "dd MMM yyyy")} (in the future).\n\nDo you want to proceed with Early Check-In today?`
                    );
                    if (!confirmEarly) return;
                  }
                  checkInGuest(res.id, res.roomNumber || "101");
                }}
              >
                <LogIn size={16} /> {toDateKey(new Date(res.checkIn)) > toDateKey(new Date()) ? "Early Check-In" : "Check In Guest"}
              </button>
            )}

            {res.status === "CHECKED_IN" && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (window.confirm(`Check out ${res.guestName} from Room #${res.roomNumber}?`)) {
                      checkOutGuest(res.id);
                    }
                  }}
                >
                  <LogOut size={16} /> Check Out Guest
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (window.confirm(`Revert check-in for ${res.guestName}? Status will return to CONFIRMED.`)) {
                      undoCheckIn(res.id);
                    }
                  }}
                  title="Revert accidental check-in back to Confirmed"
                >
                  <RotateCcw size={16} /> Undo Check-In
                </button>
              </>
            )}

            {(res.status === "CONFIRMED" || res.status === "CHECKED_IN") && (
              <button
                className="btn btn-ghost text-danger"
                onClick={() => {
                  if (window.confirm(`Cancel reservation for ${res.guestName}?`)) {
                    cancelReservation(res.id);
                  }
                }}
              >
                Cancel Reservation
              </button>
            )}

            {balanceDue > 0 ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setPayAmount(balanceDue);
                  setShowPayModal(true);
                }}
              >
                <CreditCard size={16} /> Collect Payment ({formatCurrency(balanceDue)})
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="badge badge-success" style={{ padding: "8px 14px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Paid in Full
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setPayAmount(0);
                    setShowPayModal(true);
                  }}
                  title="Record optional add-on payment if needed"
                >
                  <Plus size={14} /> Add Extra Payment
                </button>
              </div>
            )}
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

          {res.companyName && (
            <div>
              <span className="text-xs text-tertiary">Billed to Corporate Company</span>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-primary)" }}>{res.companyName}</div>
              {res.companyContact && <div className="text-xs text-secondary">Attn: {res.companyContact}</div>}
              {res.companyGstin && <div className="text-xs text-secondary mono">GSTIN: {res.companyGstin}</div>}
              {res.companyAddress && <div className="text-xs text-secondary">{res.companyAddress}</div>}
            </div>
          )}

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
                    {formatCurrency(Number(payAmount) || 0)} received via {payMethod}. Folio updated.
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setPayAmount(val === "" ? "" : Number(val));
                      }}
                      placeholder="Enter payment amount (₹)"
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
                      <option value="OTA_COLLECT">OTA Payment (Pre-paid / OTA Collect)</option>
                      <option value="BTC">BTC (Bill To Company / Credit)</option>
                    </select>
                  </div>
                  {payMethod === "BTC" && (
                    <div style={{ padding: "10px 14px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "6px", fontSize: "12px", color: "var(--amber-700, #b45309)" }}>
                      <strong>BTC (Bill To Company):</strong> Posts payment to Corporate Ledger as Due Payment. When the company settles the payment later, mark it settled in Payments.
                    </div>
                  )}
                  {payMethod === "OTA_COLLECT" && (
                    <div style={{ padding: "10px 14px", background: "rgba(0, 113, 227, 0.08)", border: "1px solid rgba(0, 113, 227, 0.2)", borderRadius: "6px", fontSize: "12px", color: "var(--blue-700, #005bb5)" }}>
                      <strong>OTA Collect:</strong> Pre-paid directly by guest on OTA portal (Booking.com / Agoda / MMT). Collected via channel manager settlement.
                    </div>
                  )}
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

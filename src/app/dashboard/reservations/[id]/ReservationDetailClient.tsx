"use client";

import { useState } from "react";
import Link from "next/link";
import { demoReservations, demoGuests } from "@/lib/demo-data";
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
} from "lucide-react";

export default function ReservationDetailClient() {
  const res = demoReservations[0]; // Rajesh Sharma demo reservation
  const guest = demoGuests[0];
  const [activeTab, setActiveTab] = useState<"overview" | "folio" | "payments" | "notes">("overview");

  // Sample Folio items
  const [folioItems, setFolioItems] = useState([
    { id: "f1", date: "2026-08-08", description: "Deluxe Room Charge - Night 1", category: "ROOM_CHARGE", amount: 5500, tax: 660, total: 6160 },
    { id: "f2", date: "2026-08-08", description: "GST (12%)", category: "TAX", amount: 660, tax: 0, total: 660 },
    { id: "f3", date: "2026-08-08", description: "Restaurant - Room Service Breakfast", category: "RESTAURANT", amount: 850, tax: 42.5, total: 892.5 },
  ]);

  const totalCharges = folioItems.reduce((sum, item) => sum + item.total, 0);
  const totalPaid = res.paidAmount;
  const balanceDue = totalCharges - totalPaid;

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
                <span className="badge-dot" />
                {res.status.replace("_", " ")}
              </span>
            </div>
            <div className="mono text-secondary text-sm" style={{ marginTop: "4px" }}>
              {res.confirmationNumber} • Booked via {res.bookingSource}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {res.status === "CONFIRMED" && (
              <button className="btn btn-primary">
                <LogIn size={16} /> Check In Guest
              </button>
            )}
            {res.status === "CHECKED_IN" && (
              <button className="btn btn-secondary">
                <LogOut size={16} /> Check Out
              </button>
            )}
            <button className="btn btn-secondary">
              <CreditCard size={16} /> Record Payment
            </button>
            <button className="btn btn-secondary">
              <Plus size={16} /> Add Charge
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--color-border-light)" }}>
          <div>
            <div className="text-xs text-tertiary">CHECK-IN</div>
            <div className="font-semibold">{formatDate(res.checkIn, "dd MMM yyyy")}</div>
          </div>
          <div>
            <div className="text-xs text-tertiary">CHECK-OUT</div>
            <div className="font-semibold">{formatDate(res.checkOut, "dd MMM yyyy")}</div>
          </div>
          <div>
            <div className="text-xs text-tertiary">ROOM</div>
            <div className="font-semibold text-primary">#{res.roomNumber} ({res.roomType})</div>
          </div>
          <div>
            <div className="text-xs text-tertiary">TOTAL AMOUNT</div>
            <div className="font-semibold mono">{formatCurrency(res.totalAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-tertiary">BALANCE DUE</div>
            <div className="font-semibold mono text-danger">{formatCurrency(balanceDue)}</div>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={`tab ${activeTab === "folio" ? "active" : ""}`} onClick={() => setActiveTab("folio")}>
          Guest Folio (Ledger)
        </button>
        <button className={`tab ${activeTab === "payments" ? "active" : ""}`} onClick={() => setActiveTab("payments")}>
          Payments ({res.paidAmount > 0 ? "1" : "0"})
        </button>
        <button className={`tab ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>
          Notes & Requests
        </button>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Stay Information</h3>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-secondary">Guest Name</span>
                <span className="font-semibold">{res.guestName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-secondary">Guests</span>
                <span>{res.adults} Adults, {res.children} Children</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-secondary">Room Assigned</span>
                <span className="font-semibold">Room #{res.roomNumber} ({res.roomType})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-secondary">Daily Room Rate</span>
                <span className="mono">{formatCurrency(res.roomRate)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-secondary">Total Nights</span>
                <span>{res.nights} Nights</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-secondary">Booking Channel</span>
                <span className="badge badge-default">{res.bookingSource}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Guest Profile</h3>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontWeight: 600 }}>{guest.firstName} {guest.lastName}</div>
              <div className="text-sm text-secondary">{guest.email}</div>
              <div className="text-sm text-secondary">{guest.phone}</div>
              <div className="text-sm text-secondary">{guest.city}, {guest.country}</div>
              {guest.isVip && <span className="badge badge-purple" style={{ width: "fit-content" }}>VIP Guest</span>}
              <hr style={{ margin: "8px 0", borderColor: "var(--color-border-light)" }} />
              <div className="text-xs text-tertiary">LIFETIME STATS</div>
              <div style={{ fontSize: "13px" }}>
                Total Stays: <strong>{guest.totalStays}</strong> | Lifetime Spend: <strong>{formatCurrency(guest.totalSpent)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: FOLIO LEDGER */}
      {activeTab === "folio" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Guest Folio (FOL-202608-00124)</h3>
            <button className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Charge Item
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="data-table-wrapper" style={{ border: "none" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {folioItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td className="font-medium">{item.description}</td>
                      <td>
                        <span className="badge badge-default">{item.category}</span>
                      </td>
                      <td className="mono">{formatCurrency(item.amount)}</td>
                      <td className="mono">{formatCurrency(item.tax)}</td>
                      <td className="text-right mono font-bold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Folio Financial Summary */}
            <div style={{ padding: "16px 20px", background: "var(--gray-50)", borderTop: "1px solid var(--color-border-light)", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Charges:</span>
                  <span className="mono font-bold">{formatCurrency(totalCharges)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Payments:</span>
                  <span className="mono text-success font-bold">{formatCurrency(totalPaid)}</span>
                </div>
                <hr style={{ margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700 }}>
                  <span>Balance Due:</span>
                  <span className="mono text-danger">{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payment History</h3>
            <button className="btn btn-primary btn-sm">
              <CreditCard size={14} /> Record Payment
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment Ref</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Received Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">PAY-20260808-00043</td>
                  <td>CASH</td>
                  <td className="mono font-bold text-success">{formatCurrency(res.paidAmount)}</td>
                  <td><span className="badge badge-success">COMPLETED</span></td>
                  <td>Today, 11:30 AM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: NOTES */}
      {activeTab === "notes" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Special Requests & Notes</h3>
          </div>
          <div className="card-body">
            <p className="text-secondary">
              Guest requested a quiet room on a higher floor. Prefers extra pillows and non-smoking room.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

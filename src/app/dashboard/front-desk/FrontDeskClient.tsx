"use client";

import { useState } from "react";
import Link from "next/link";
import { demoReservations } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LogIn,
  LogOut,
  UserCheck,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function FrontDeskClient() {
  const [activeTab, setActiveTab] = useState<"arrivals" | "departures" | "in_house" | "walk_ins">("arrivals");
  const [checkInModal, setCheckInModal] = useState<typeof demoReservations[0] | null>(null);
  const [checkOutModal, setCheckOutModal] = useState<typeof demoReservations[0] | null>(null);

  const arrivals = demoReservations.filter((r) => r.status === "CONFIRMED");
  const departures = demoReservations.filter((r) => r.status === "CHECKED_IN" && r.balanceAmount >= 0);
  const inHouse = demoReservations.filter((r) => r.status === "CHECKED_IN");

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Front Desk Workspace</h1>
          <p className="page-description">
            Reception operational desk for arrivals, check-ins, departures, and walk-ins.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> Walk-In Booking
          </Link>
        </div>
      </div>

      {/* Front Desk Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "arrivals" ? "active" : ""}`} onClick={() => setActiveTab("arrivals")}>
          Arrivals Today
          <span className="tab-count">{arrivals.length}</span>
        </button>
        <button className={`tab ${activeTab === "departures" ? "active" : ""}`} onClick={() => setActiveTab("departures")}>
          Departures Today
          <span className="tab-count">{departures.length}</span>
        </button>
        <button className={`tab ${activeTab === "in_house" ? "active" : ""}`} onClick={() => setActiveTab("in_house")}>
          In House Guests
          <span className="tab-count">{inHouse.length}</span>
        </button>
      </div>

      {/* Main Table Content */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reservation Ref</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Room Type</th>
                <th>Dates</th>
                <th>Payment Balance</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "arrivals"
                ? arrivals
                : activeTab === "departures"
                ? departures
                : inHouse
              ).map((res) => (
                <tr key={res.id}>
                  <td className="mono" style={{ fontWeight: 600, fontSize: "12px" }}>
                    <Link href={`/dashboard/reservations/${res.id}`} className="text-primary">
                      {res.confirmationNumber}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{res.guestName}</div>
                    <div className="text-xs text-tertiary">{res.adults} Adults</div>
                  </td>
                  <td>
                    {res.roomNumber ? (
                      <span className="badge badge-primary">#{res.roomNumber}</span>
                    ) : (
                      <span className="badge badge-warning">Unassigned</span>
                    )}
                  </td>
                  <td className="text-sm">{res.roomType}</td>
                  <td className="text-xs">
                    {formatDate(res.checkIn, "dd MMM")} - {formatDate(res.checkOut, "dd MMM")}
                  </td>
                  <td className="mono">
                    {res.balanceAmount > 0 ? (
                      <span className="text-danger font-medium">{formatCurrency(res.balanceAmount)}</span>
                    ) : (
                      <span className="text-success font-medium">Fully Paid</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        res.status === "CONFIRMED"
                          ? "badge-primary"
                          : res.status === "CHECKED_IN"
                          ? "badge-success"
                          : "badge-default"
                      }`}
                    >
                      <span className="badge-dot" />
                      {res.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-right">
                    {res.status === "CONFIRMED" ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setCheckInModal(res)}>
                        <LogIn size={14} /> Check In
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => setCheckOutModal(res)}>
                        <LogOut size={14} /> Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECK-IN WORKFLOW MODAL */}
      {checkInModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Check-In Wizard: {checkInModal.guestName}</h3>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="card" style={{ padding: "12px", background: "var(--gray-50)" }}>
                <div><strong>Reservation:</strong> {checkInModal.confirmationNumber}</div>
                <div><strong>Room Assigned:</strong> #{checkInModal.roomNumber || "301"} ({checkInModal.roomType})</div>
                <div><strong>Nights:</strong> {checkInModal.nights} nights ({formatDate(checkInModal.checkIn, "dd MMM")} - {formatDate(checkInModal.checkOut, "dd MMM")})</div>
              </div>

              <div className="form-group">
                <label className="form-label">Verify Government ID Upload</label>
                <div style={{ padding: "12px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <UserCheck size={24} color="var(--color-primary)" style={{ margin: "0 auto 4px" }} />
                  <div className="text-xs text-secondary">Aadhaar Card uploaded & verified</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Outstanding Balance Settlement</label>
                <div className="mono font-bold text-danger" style={{ fontSize: "16px" }}>
                  {formatCurrency(checkInModal.balanceAmount)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCheckInModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  alert(`Guest ${checkInModal.guestName} successfully checked into Room #${checkInModal.roomNumber || '301'}!`);
                  setCheckInModal(null);
                }}
              >
                Confirm Check In <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-OUT WORKFLOW MODAL */}
      {checkOutModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Check-Out Settlement: {checkOutModal.guestName}</h3>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="card" style={{ padding: "12px", background: "var(--gray-50)" }}>
                <div><strong>Room:</strong> #{checkOutModal.roomNumber} ({checkOutModal.roomType})</div>
                <div><strong>Folio Balance:</strong> {formatCurrency(checkOutModal.balanceAmount)}</div>
              </div>

              <p className="text-sm text-secondary">
                Checking out will automatically:
                <br />1. Mark Room #{checkOutModal.roomNumber} as <strong>DIRTY</strong>.
                <br />2. Automatically generate a <strong>Checkout Housekeeping Task</strong> for housekeeping staff.
                <br />3. Generate tax invoice PDF.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCheckOutModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert(`Guest ${checkOutModal.guestName} checked out! Room #${checkOutModal.roomNumber} is now marked DIRTY and assigned to housekeeping.`);
                  setCheckOutModal(null);
                }}
              >
                Complete Check Out & Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

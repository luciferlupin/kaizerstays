"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  CalendarCheck,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ReservationsClient() {
  const { reservations, cancelReservation } = useAppState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const filtered = reservations.filter((res) => {
    if (statusFilter !== "ALL" && res.status !== statusFilter) return false;
    if (sourceFilter !== "ALL" && res.bookingSource !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        res.guestName.toLowerCase().includes(q) ||
        res.confirmationNumber.toLowerCase().includes(q) ||
        res.roomNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-description">
            Manage all hotel bookings, check-ins, and stay allocations.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> Create Reservation
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div className="search-input-wrapper" style={{ minWidth: "240px", flex: 1 }}>
            <Search className="search-icon" size={14} />
            <input
              type="text"
              className="form-input"
              placeholder="Search guest name, confirmation #, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              className="form-select"
              style={{ width: "160px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              className="form-select"
              style={{ width: "160px" }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Channels</option>
              <option value="DIRECT">Direct</option>
              <option value="WALK_IN">Walk-In</option>
              <option value="WEBSITE">Website</option>
              <option value="BOOKING_COM">Booking.com</option>
              <option value="AGODA">Agoda</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Calendar size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Reservations Found</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Create a new direct walk-in reservation or sync with OTA Extranets (Booking.com, Agoda) to import bookings.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <Link href="/dashboard/reservations/new" className="btn btn-primary btn-sm">
                  <Plus size={14} /> New Reservation
                </Link>
                <Link href="/dashboard/channels" className="btn btn-secondary btn-sm">
                  Channel Manager
                </Link>
              </div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest & Confirmation</th>
                  <th>Room Type / No</th>
                  <th>Dates & Nights</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <div className="font-semibold">{res.guestName}</div>
                      <div className="mono text-tertiary text-xs">{res.confirmationNumber}</div>
                    </td>
                    <td>
                      <div>{res.roomType}</div>
                      <div className="text-xs text-primary font-semibold">
                        {res.roomNumber ? `Room #${res.roomNumber}` : "Unassigned"}
                      </div>
                    </td>
                    <td>
                      <div>{formatDate(res.checkIn, "dd MMM")} → {formatDate(res.checkOut, "dd MMM")}</div>
                      <div className="text-xs text-tertiary">{res.nights} Nights • {res.adults} Adults</div>
                    </td>
                    <td>
                      <span className="badge badge-default">{res.bookingSource}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          res.status === "CHECKED_IN"
                            ? "badge-success"
                            : res.status === "CONFIRMED"
                            ? "badge-primary"
                            : res.status === "CANCELLED"
                            ? "badge-danger"
                            : "badge-default"
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="text-right mono font-semibold">{formatCurrency(res.totalAmount)}</td>
                    <td className="text-right mono font-semibold">
                      {res.balanceAmount === 0 ? (
                        <span className="text-success font-bold">Paid</span>
                      ) : (
                        <span className="text-warning">{formatCurrency(res.balanceAmount)}</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <Link href={`/dashboard/reservations/${res.id}`} className="btn btn-secondary btn-sm">
                          View Folio <ArrowUpRight size={12} />
                        </Link>
                        {res.status === "CONFIRMED" && (
                          <button className="btn btn-ghost btn-sm text-danger" onClick={() => cancelReservation(res.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

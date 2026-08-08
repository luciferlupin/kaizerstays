"use client";

import { useState } from "react";
import Link from "next/link";
import { demoReservations } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  CalendarCheck,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ReservationsClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const filtered = demoReservations.filter((res) => {
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
          <div className="search-input-wrapper" style={{ minWidth: "260px" }}>
            <Search className="search-icon" size={14} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by guest, ID, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* Status Filter */}
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

            {/* Source Filter */}
            <select
              className="form-select"
              style={{ width: "160px" }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Sources</option>
              <option value="DIRECT">Direct</option>
              <option value="WALK_IN">Walk-In</option>
              <option value="WEBSITE">Website</option>
              <option value="BOOKING_COM">Booking.com</option>
              <option value="AGODA">Agoda</option>
              <option value="MAKEMYTRIP">MakeMyTrip</option>
              <option value="EXPEDIA">Expedia</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card">
        <div className="data-table-wrapper" style={{ border: "none" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Guest</th>
                <th>Dates & Nights</th>
                <th>Room</th>
                <th>Source</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => (
                <tr key={res.id}>
                  <td className="mono" style={{ fontWeight: 600, fontSize: "12px" }}>
                    <Link href={`/dashboard/reservations/${res.id}`} className="text-primary">
                      {res.confirmationNumber}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{res.guestName}</div>
                    <div className="text-xs text-tertiary">{res.adults} Adults, {res.children} Children</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "13px" }}>
                      {formatDate(res.checkIn, "dd MMM")} – {formatDate(res.checkOut, "dd MMM yyyy")}
                    </div>
                    <div className="text-xs text-tertiary">{res.nights} {res.nights === 1 ? "night" : "nights"}</div>
                  </td>
                  <td>
                    {res.roomNumber ? (
                      <span className="badge badge-primary">#{res.roomNumber} ({res.roomType})</span>
                    ) : (
                      <span className="badge badge-default">Unassigned ({res.roomType})</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-default">{res.bookingSource}</span>
                  </td>
                  <td className="mono font-medium">{formatCurrency(res.totalAmount)}</td>
                  <td className="mono">
                    {res.balanceAmount > 0 ? (
                      <span className="text-danger font-medium">{formatCurrency(res.balanceAmount)}</span>
                    ) : (
                      <span className="text-success font-medium">Paid</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        res.status === "CONFIRMED"
                          ? "badge-primary"
                          : res.status === "CHECKED_IN"
                          ? "badge-success"
                          : res.status === "CHECKED_OUT"
                          ? "badge-default"
                          : "badge-danger"
                      }`}
                    >
                      <span className="badge-dot" />
                      {res.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link href={`/dashboard/reservations/${res.id}`} className="btn btn-secondary btn-sm">
                      View <ArrowUpRight size={14} />
                    </Link>
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

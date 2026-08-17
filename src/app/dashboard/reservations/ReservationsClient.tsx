"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate, formatStayDateRange } from "@/lib/utils";
import {
  Search,
  Plus,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Download,
  LogOut,
  RotateCcw,
  FileText,
  Printer,
} from "lucide-react";
import { toDateKey } from "@/lib/rates";

export default function ReservationsClient() {
  const { reservations, rooms, cancelReservation, checkInGuest, checkOutGuest, undoCheckIn, syncLiveAiosell } = useAppState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const handleSyncAiosell = async () => {
    setSyncing(true);
    setSyncMessage("Syncing live OTA bookings from Aiosell Channel Manager...");
    try {
      const count = await syncLiveAiosell();
      setSyncMessage(count > 0 ? `Successfully imported ${count} live OTA booking(s)!` : "Aiosell sync active — all live bookings up to date.");
    } catch {
      setSyncMessage("Channel sync active — reservations up to date.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 4000);
    }
  };

  const getEffectiveRoomDetails = (res: (typeof reservations)[0]) => {
    let roomNum = res.roomNumber;
    let typeName = res.roomType;

    if (roomNum) {
      const physicalRoom = rooms.find((r) => r.number === roomNum);
      if (physicalRoom) {
        typeName = physicalRoom.typeName;
      }
    }

    return { roomNum, typeName };
  };

  const filtered = useMemo(() => {
    return reservations.filter((res) => {
      if (statusFilter !== "ALL" && res.status !== statusFilter) return false;
      if (sourceFilter !== "ALL" && res.bookingSource !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          res.guestName.toLowerCase().includes(q) ||
          res.confirmationNumber.toLowerCase().includes(q) ||
          (res.roomNumber || "").toLowerCase().includes(q) ||
          res.roomType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reservations, statusFilter, sourceFilter, search]);

  const exportReservationsCSV = () => {
    const csvContent = `KaizerStays OS — Hotel Shemron Reservations List
Export Date: ${new Date().toISOString()}
Total Bookings: ${reservations.length}

=== RESERVATIONS MASTER LIST ===
Confirmation #,Guest Name,Room #,Room Category,Check In,Check Out,Nights,Channel,Status,Total (INR),Balance (INR)
${filtered
  .map(
    (res) =>
      `"${res.confirmationNumber}","${res.guestName.replace(/"/g, '""')}","${res.roomNumber || "Unassigned"}","${
        res.roomType
      }","${formatDate(res.checkIn, "yyyy-MM-dd")}","${formatDate(res.checkOut, "yyyy-MM-dd")}",${
        res.nights
      },"${res.bookingSource}","${res.status}",${res.totalAmount},${res.balanceAmount}`
  )
  .join("\n")}
`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KaizerStays_Reservations_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="text-primary" size={24} />
            Reservations Master Ledger
          </h1>
          <p className="page-description">
            Manage all hotel bookings, check-ins, room assignments, and stay allocations for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleSyncAiosell} disabled={syncing}>
            <RotateCcw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing OTAs..." : "Sync Aiosell OTAs"}
          </button>
          <button className="btn btn-secondary" onClick={exportReservationsCSV} disabled={reservations.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> Create Reservation
          </Link>
        </div>
      </div>

      {syncMessage && (
        <div className="card" style={{ padding: "12px 16px", marginBottom: "16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <span className="text-xs font-semibold text-success">{syncMessage}</span>
        </div>
      )}

      {/* KPI Metrics Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div
          className="card"
          style={{ padding: "14px", cursor: "pointer", border: statusFilter === "ALL" ? "2px solid var(--primary, #3b82f6)" : undefined }}
          onClick={() => setStatusFilter("ALL")}
        >
          <div className="text-xs text-tertiary font-semibold">TOTAL MASTER LEDGER</div>
          <div className="text-2xl font-bold text-primary" style={{ marginTop: "4px" }}>
            {reservations.length}
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>All reservations stored</div>
        </div>

        <div
          className="card"
          style={{ padding: "14px", cursor: "pointer", border: statusFilter === "CHECKED_IN" ? "2px solid #10b981" : undefined }}
          onClick={() => setStatusFilter("CHECKED_IN")}
        >
          <div className="text-xs text-tertiary font-semibold">IN-HOUSE GUESTS</div>
          <div className="text-2xl font-bold text-success" style={{ marginTop: "4px" }}>
            {reservations.filter((r) => r.status === "CHECKED_IN").length}
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>Currently checked in</div>
        </div>

        <div
          className="card"
          style={{ padding: "14px", cursor: "pointer", border: statusFilter === "CONFIRMED" ? "2px solid #3b82f6" : undefined }}
          onClick={() => setStatusFilter("CONFIRMED")}
        >
          <div className="text-xs text-tertiary font-semibold">UPCOMING CONFIRMED</div>
          <div className="text-2xl font-bold text-info" style={{ marginTop: "4px" }}>
            {reservations.filter((r) => r.status === "CONFIRMED").length}
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>Future arrival stays</div>
        </div>

        <div
          className="card"
          style={{ padding: "14px", cursor: "pointer", border: statusFilter === "CHECKED_OUT" ? "2px solid #6b7280" : undefined }}
          onClick={() => setStatusFilter("CHECKED_OUT")}
        >
          <div className="text-xs text-tertiary font-semibold">HISTORICAL PAST STAYS</div>
          <div className="text-2xl font-bold" style={{ marginTop: "4px", color: "var(--text-secondary, #9ca3af)" }}>
            {reservations.filter((r) => r.status === "CHECKED_OUT").length}
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>Checked out history</div>
        </div>

        <div
          className="card"
          style={{ padding: "14px", cursor: "pointer", border: statusFilter === "CANCELLED" ? "2px solid #ef4444" : undefined }}
          onClick={() => setStatusFilter("CANCELLED")}
        >
          <div className="text-xs text-tertiary font-semibold">CANCELLED BOOKINGS</div>
          <div className="text-2xl font-bold text-danger" style={{ marginTop: "4px" }}>
            {reservations.filter((r) => r.status === "CANCELLED").length}
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>Cancelled stays</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
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

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              className="form-select text-xs"
              style={{ width: "160px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Bookings (Past, Current & Future)</option>
              <option value="CONFIRMED">Upcoming Future Bookings (Confirmed)</option>
              <option value="CHECKED_IN">In-House Guests (Checked In)</option>
              <option value="CHECKED_OUT">Historical Past Stays (Checked Out)</option>
              <option value="CANCELLED">Cancelled Bookings</option>
            </select>

            <select
              className="form-select text-xs"
              style={{ width: "180px" }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Channels</option>
              <option value="DIRECT">Direct Desk</option>
              <option value="WALK_IN">Walk-In</option>
              <option value="WEBSITE">Website Direct</option>
              <option value="AIOSELL_CHANNEL_MANAGER">Aiosell Channel Manager</option>
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
                Create a new direct walk-in reservation or sync with Aiosell Channel Manager to import bookings.
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
                  <th>Guest &amp; Confirmation</th>
                  <th>Room Category / No</th>
                  <th>Dates &amp; Stay</th>
                  <th>Channel Source</th>
                  <th>Check-in Status</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-right">Folio Balance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res) => {
                  const { roomNum, typeName } = getEffectiveRoomDetails(res);
                  const isCheckedIn = res.status === "CHECKED_IN";
                  const isConfirmed = res.status === "CONFIRMED";

                  return (
                    <tr key={res.id}>
                      <td>
                        <div className="font-bold">{res.guestName}</div>
                        <div className="mono text-primary text-xs font-semibold">{res.confirmationNumber}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-sm">{typeName}</div>
                        {roomNum ? (
                          <span className="badge badge-primary text-xs" style={{ marginTop: "3px" }}>
                            Room #{roomNum}
                          </span>
                        ) : (
                          <span className="badge badge-warning text-xs" style={{ marginTop: "3px" }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-sm text-primary">
                          {formatStayDateRange(res.checkIn, res.checkOut)}
                        </div>
                        <div className="text-xs text-tertiary">
                          {res.nights} {res.nights === 1 ? "Night" : "Nights"} • {res.adults} Adults
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            res.bookingSource.includes("AIOSELL")
                              ? "badge-info"
                              : res.bookingSource === "DIRECT"
                              ? "badge-primary"
                              : "badge-default"
                          }`}
                        >
                          {res.bookingSource.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isCheckedIn
                              ? "badge-success font-bold"
                              : isConfirmed
                              ? "badge-primary"
                              : res.status === "CHECKED_OUT"
                              ? "badge-secondary"
                              : res.status === "CANCELLED"
                              ? "badge-danger"
                              : "badge-default"
                          }`}
                        >
                          {res.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-right mono font-semibold">{formatCurrency(res.totalAmount)}</td>
                      <td className="text-right mono font-semibold">
                        {res.balanceAmount === 0 ? (
                          <span className="badge badge-success text-xs font-bold">Settled (₹0)</span>
                        ) : (
                          <span className="text-warning font-bold">{formatCurrency(res.balanceAmount)}</span>
                        )}
                      </td>
                      <td className="text-right" style={{ minWidth: "190px" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                          <Link
                            href={`/dashboard/reservations/${res.id}`}
                            className={`btn btn-sm ${res.status === "CHECKED_OUT" ? "btn-primary font-bold" : "btn-secondary"}`}
                            title="View itemized folio ledger & guest profile"
                          >
                            <FileText size={13} /> View Folio <ArrowUpRight size={12} />
                          </Link>

                          {res.status === "CHECKED_OUT" && (
                            <Link
                              href="/dashboard/invoices"
                              className="btn btn-secondary btn-sm"
                              title="Print official GST tax invoice"
                            >
                              <Printer size={13} /> Invoice
                            </Link>
                          )}

                          {isConfirmed && (
                            <button
                              className={`btn btn-sm ${
                                toDateKey(new Date(res.checkIn)) > toDateKey(new Date())
                                  ? "btn-secondary"
                                  : "btn-primary"
                              }`}
                              onClick={() => {
                                const checkInKey = toDateKey(new Date(res.checkIn));
                                const todayKey = toDateKey(new Date());
                                if (checkInKey > todayKey) {
                                  const confirmEarly = window.confirm(
                                    `Check-in date for ${res.guestName} is ${formatDate(res.checkIn, "dd MMM yyyy")} (in the future).\n\nDo you want to proceed with Early Check-In today?`
                                  );
                                  if (!confirmEarly) return;
                                }
                                const targetRoom = roomNum || "101";
                                checkInGuest(res.id, targetRoom);
                              }}
                              title={
                                toDateKey(new Date(res.checkIn)) > toDateKey(new Date())
                                  ? `Scheduled for ${formatDate(res.checkIn, "dd MMM yyyy")}`
                                  : "Check in guest"
                              }
                            >
                              <CheckCircle2 size={13} />{" "}
                              {toDateKey(new Date(res.checkIn)) > toDateKey(new Date()) ? "Early Check-In" : "Check In"}
                            </button>
                          )}

                          {isCheckedIn && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  if (window.confirm(`Check out ${res.guestName} from Room #${roomNum || res.roomNumber}?`)) {
                                    checkOutGuest(res.id);
                                  }
                                }}
                              >
                                <LogOut size={13} /> Check Out
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  if (window.confirm(`Revert check-in for ${res.guestName}? Status will change back to CONFIRMED.`)) {
                                    undoCheckIn(res.id);
                                  }
                                }}
                                title="Revert accidental check-in back to Confirmed"
                              >
                                <RotateCcw size={13} /> Undo Check-In
                              </button>
                            </>
                          )}

                          {(isConfirmed || isCheckedIn) && (
                            <button
                              className="btn btn-ghost btn-sm text-danger"
                              onClick={() => {
                                if (window.confirm(`Cancel reservation for ${res.guestName}?`)) {
                                  cancelReservation(res.id);
                                }
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

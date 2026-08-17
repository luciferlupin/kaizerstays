"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LogIn,
  LogOut,
  UserCheck,
  Plus,
  X,
  Check,
} from "lucide-react";

export default function FrontDeskClient() {
  const { reservations, rooms, checkInGuest, checkOutGuest, markReservationAsPrepaid } = useAppState();
  const [activeTab, setActiveTab] = useState<"arrivals" | "departures" | "in_house">("arrivals");

  const [checkInModal, setCheckInModal] = useState<typeof reservations[0] | null>(null);
  const [checkOutModal, setCheckOutModal] = useState<typeof reservations[0] | null>(null);
  const [assignedRoomNumber, setAssignedRoomNumber] = useState("");
  const [actionDone, setActionDone] = useState(false);

  const toDateStr = (date: Date | string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date).slice(0, 10);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayKey = toDateStr(new Date());

  // Arrivals: Check-in date is today or overdue (checkIn <= today) and status is CONFIRMED or PENDING
  const arrivals = reservations.filter(
    (r) => !["CHECKED_OUT", "CANCELLED"].includes(r.status) && (r.status === "CONFIRMED" || r.status === "PENDING") && toDateStr(r.checkIn) <= todayKey
  );

  // Departures: Check-out date is today or overdue (checkOut <= today) and status is CHECKED_IN or CONFIRMED
  const departures = reservations.filter(
    (r) => !["CHECKED_OUT", "CANCELLED"].includes(r.status) && (r.status === "CHECKED_IN" || r.status === "CONFIRMED") && toDateStr(r.checkOut) <= todayKey
  );

  // In-House: Currently checked-in guests
  const inHouse = reservations.filter((r) => r.status === "CHECKED_IN");

  const getResRoomCount = (r: (typeof reservations)[0]) =>
    (r as any).roomsCount || (r.roomNumber && r.roomNumber.includes(",") ? r.roomNumber.split(",").filter(Boolean).length : 1);

  const totalArrivingRooms = arrivals.reduce((sum, r) => sum + getResRoomCount(r), 0);
  const totalDepartingRooms = departures.reduce((sum, r) => sum + getResRoomCount(r), 0);
  const totalInHouseRooms = inHouse.reduce((sum, r) => sum + getResRoomCount(r), 0);

  const getEffectiveRoomDetails = (r: (typeof reservations)[0]) => {
    let roomNum = r.roomNumber;
    let typeName = r.roomType;

    if (roomNum) {
      const physicalRoom = rooms.find((room) => room.number === roomNum);
      if (physicalRoom) {
        typeName = physicalRoom.typeName;
      }
    }

    return { roomNum, typeName };
  };

  const handleOpenCheckInModal = (r: (typeof reservations)[0]) => {
    setCheckInModal(r);
    let defaultRoom = r.roomNumber;

    const assignedRooms = new Set(
      reservations
        .filter((res) => res.id !== r.id && res.status !== "CANCELLED" && res.status !== "CHECKED_OUT" && res.roomNumber)
        .map((res) => res.roomNumber)
    );

    if (!defaultRoom || assignedRooms.has(defaultRoom)) {
      const rtStr = (r.roomType || "").toLowerCase();
      const targetTypeId = rtStr.includes("twin")
        ? "twin-room"
        : rtStr.includes("suite")
        ? "suite-room"
        : "deluxe-room";

      const candidateRoom = rooms.find(
        (room) =>
          room.roomTypeId === targetTypeId &&
          room.isActive &&
          room.status !== "OCCUPIED" &&
          !assignedRooms.has(room.number)
      );

      defaultRoom = candidateRoom?.number || "";
    }
    setAssignedRoomNumber(defaultRoom);
  };

  const handleConfirmCheckIn = () => {
    if (!checkInModal) return;
    let roomToAssign = assignedRoomNumber || checkInModal.roomNumber;

    const assignedRooms = new Set(
      reservations
        .filter((res) => res.id !== checkInModal.id && res.status !== "CANCELLED" && res.status !== "CHECKED_OUT" && res.roomNumber)
        .map((res) => res.roomNumber)
    );

    if (!roomToAssign || assignedRooms.has(roomToAssign)) {
      const rtStr = (checkInModal.roomType || "").toLowerCase();
      const targetTypeId = rtStr.includes("twin")
        ? "twin-room"
        : rtStr.includes("suite")
        ? "suite-room"
        : "deluxe-room";

      const candidateRoom = rooms.find(
        (room) =>
          room.roomTypeId === targetTypeId &&
          room.isActive &&
          room.status !== "OCCUPIED" &&
          !assignedRooms.has(room.number)
      );

      roomToAssign = candidateRoom?.number || "101";
    }

    checkInGuest(checkInModal.id, roomToAssign);
    setActionDone(true);
    setTimeout(() => {
      setCheckInModal(null);
      setActionDone(false);
      setAssignedRoomNumber("");
    }, 1200);
  };

  const handleConfirmCheckOut = () => {
    if (!checkOutModal) return;
    checkOutGuest(checkOutModal.id);
    setActionDone(true);
    setTimeout(() => {
      setCheckOutModal(null);
      setActionDone(false);
    }, 1200);
  };

  // Upcoming Confirmed Arrivals (Future Check-Ins)
  const upcomingArrivals = reservations.filter(
    (r) => !["CHECKED_OUT", "CANCELLED", "CHECKED_IN"].includes(r.status) && r.status === "CONFIRMED"
  );

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCheck className="text-primary" size={24} />
            Front Desk Workspace
          </h1>
          <p className="page-description">
            Reception operational desk for arrivals, check-ins, departures, and walk-ins.
          </p>
        </div>
        <div className="page-actions flex items-center gap-2">
          <Link href="/dashboard/channels" className="btn btn-secondary btn-sm">
            <Check size={14} className="text-success" /> Live Aiosell Synced
          </Link>
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> Walk-In Booking
          </Link>
        </div>
      </div>

      {/* Operations Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="text-xs text-secondary font-semibold uppercase tracking-wider">Today's Arrivals</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="text-2xl font-extrabold text-primary">{totalArrivingRooms}</span>
            <span className="text-xs text-secondary">Guests Expected</span>
          </div>
        </div>

        <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="text-xs text-secondary font-semibold uppercase tracking-wider">Today's Departures</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="text-2xl font-extrabold text-warning">{totalDepartingRooms}</span>
            <span className="text-xs text-secondary">Guests Check-Out</span>
          </div>
        </div>

        <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="text-xs text-secondary font-semibold uppercase tracking-wider">In-House Guests</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="text-2xl font-extrabold text-success">{totalInHouseRooms}</span>
            <span className="text-xs text-secondary">Rooms Occupied</span>
          </div>
        </div>

        <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="text-xs text-secondary font-semibold uppercase tracking-wider">Upcoming Bookings</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="text-2xl font-extrabold">{upcomingArrivals.length}</span>
            <span className="text-xs text-secondary">Future Arrivals</span>
          </div>
        </div>
      </div>

      {/* Front Desk Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "arrivals" ? "active" : ""}`} onClick={() => setActiveTab("arrivals")}>
          Arrivals &amp; Upcoming
          <span className="tab-count">{arrivals.length > 0 ? arrivals.length : upcomingArrivals.length}</span>
        </button>
        <button className={`tab ${activeTab === "departures" ? "active" : ""}`} onClick={() => setActiveTab("departures")}>
          Departures Today
          <span className="tab-count">{totalDepartingRooms}</span>
        </button>
        <button className={`tab ${activeTab === "in_house" ? "active" : ""}`} onClick={() => setActiveTab("in_house")}>
          In House Guests
          <span className="tab-count">{totalInHouseRooms}</span>
        </button>
      </div>

      {/* Main Table Content */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {(() => {
            const listToDisplay =
              activeTab === "arrivals"
                ? arrivals.length > 0
                  ? arrivals
                  : upcomingArrivals
                : activeTab === "departures"
                ? departures
                : inHouse;

            if (listToDisplay.length === 0) {
              return (
                <div style={{ padding: "48px 20px", textAlign: "center" }}>
                  <UserCheck size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                    {activeTab === "arrivals"
                      ? "No Arrivals Pending"
                      : activeTab === "departures"
                      ? "No Expected Departures"
                      : "No In-House Guests"}
                  </h3>
                  <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                    {activeTab === "arrivals"
                      ? "All arrivals for today are checked in or synced with Aiosell."
                      : "All guest checkouts and stays will update here."}
                  </p>
                </div>
              );
            }

            return (
              <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
                <table className="data-table" style={{ minWidth: "850px" }}>
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Confirmation #</th>
                      <th>Room Type &amp; Number</th>
                      <th>Stay Dates</th>
                      <th>Source</th>
                      <th>Payment Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listToDisplay.map((r) => {
                      const { roomNum, typeName } = getEffectiveRoomDetails(r);
                      return (
                        <tr key={r.id}>
                          <td className="font-semibold">{r.guestName}</td>
                          <td className="mono text-xs">{r.confirmationNumber}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{typeName}</div>
                            <div className="text-xs text-primary" style={{ fontWeight: 700 }}>
                              {roomNum ? `Room #${roomNum}` : "Unassigned"}
                            </div>
                          </td>
                          <td className="text-sm">
                            {formatDate(r.checkIn, "dd MMM")} → {formatDate(r.checkOut, "dd MMM")} ({r.nights}n)
                          </td>
                          <td>
                            <span className="badge badge-default">{r.bookingSource}</span>
                          </td>
                          <td>
                            {r.balanceAmount === 0 ? (
                              <span className="badge badge-success font-bold">Paid (₹0)</span>
                            ) : (
                              <span className="badge badge-warning font-bold">
                                Due: {formatCurrency(r.balanceAmount)}
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            {activeTab === "arrivals" && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenCheckInModal(r)}
                              >
                                <LogIn size={14} /> Check In
                              </button>
                            )}

                            {(activeTab === "departures" || activeTab === "in_house") && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCheckOutModal(r)}
                              >
                                <LogOut size={14} /> Check Out
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Check In Modal */}
      {checkInModal && (
        <div className="modal-backdrop" onClick={() => setCheckInModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Guest Check-In</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCheckInModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {actionDone ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>{checkInModal.guestName} Checked In!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    Room #{assignedRoomNumber || checkInModal.roomNumber || "301"} status changed to OCCUPIED.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700 }}>{checkInModal.guestName}</div>
                    <div className="text-xs text-secondary">{checkInModal.confirmationNumber} • {checkInModal.roomType}</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Assign Physical Room</label>
                    <select
                      className="form-select"
                      value={assignedRoomNumber}
                      onChange={(e) => setAssignedRoomNumber(e.target.value)}
                    >
                      <option value="">-- Select Physical Room --</option>
                      {rooms
                        .filter((room) => room.isActive)
                        .map((room) => (
                          <option key={room.id} value={room.number}>
                            Room #{room.number} — {room.typeName} ({room.status === "AVAILABLE" ? "Clean & Ready" : room.status})
                          </option>
                        ))}
                    </select>
                  </div>

                  {checkInModal.balanceAmount > 0 ? (
                    <div style={{ background: "var(--amber-50)", padding: "12px 14px", borderRadius: "var(--radius-md)", color: "var(--amber-800)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontWeight: 600 }}>⚠️ Outstanding Balance: {formatCurrency(checkInModal.balanceAmount)}</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => {
                            markReservationAsPrepaid(checkInModal.id);
                            setCheckInModal((prev) => (prev ? { ...prev, paidAmount: prev.totalAmount, balanceAmount: 0 } : null));
                          }}
                        >
                          ✓ Mark as Prepaid (OTA / Online Paid)
                        </button>
                      </div>
                      <div className="text-xs text-secondary">
                        If guest prepaid online via Booking.com, Agoda, or Aiosell, click above to clear outstanding balance.
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "var(--green-50)", padding: "12px 14px", borderRadius: "var(--radius-md)", color: "var(--green-800)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                      ✓ Prepaid Booking / Balance Settled (₹0.00)
                    </div>
                  )}
                </>
              )}
            </div>
            {!actionDone && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setCheckInModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleConfirmCheckIn}>
                  Confirm Check-In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check Out Modal */}
      {checkOutModal && (
        <div className="modal-backdrop" onClick={() => setCheckOutModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Guest Check-Out</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCheckOutModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {actionDone ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Check-Out Completed!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    Room #{checkOutModal.roomNumber} marked DIRTY. Housekeeping task generated automatically.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700 }}>{checkOutModal.guestName}</div>
                    <div className="text-xs text-secondary">Room #{checkOutModal.roomNumber} • {checkOutModal.roomType}</div>
                  </div>

                  <div style={{ background: "var(--green-50)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--green-800)", fontSize: "13px" }}>
                    ✓ All room charges and F&B folios settled. Balance is zero.
                  </div>
                </>
              )}
            </div>
            {!actionDone && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setCheckOutModal(null)}>Cancel</button>
                <button className="btn btn-success" onClick={handleConfirmCheckOut}>
                  Complete Check-Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatDate, getToday } from "@/lib/utils";
import { toDateKey } from "@/lib/rates";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Bed,
} from "lucide-react";
import { getShemronRoomCategory } from "@/lib/demo-data";

export default function CalendarClient() {
  const { rooms, reservations, roomTypes } = useAppState();
  const [viewDays, setViewDays] = useState<7 | 14 | 30>(14);
  const [selectedRoomType, setSelectedRoomType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(getToday());

  const todayStr = toDateKey(getToday());

  // Generate date columns based on viewDays
  const dateColumns: Date[] = [];
  for (let i = 0; i < viewDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dateColumns.push(d);
  }

  // Shift dates by viewDays
  const handlePrev = () => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() - viewDays);
    setStartDate(d);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + viewDays);
    setStartDate(d);
  };

  const handleToday = () => {
    setStartDate(getToday());
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedRoomType !== "ALL" && room.roomTypeId !== selectedRoomType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        room.number.toLowerCase().includes(q) ||
        room.typeName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate metrics for visible range
  const startDateStr = toDateKey(dateColumns[0] || getToday());
  const endDateStr = toDateKey(dateColumns[dateColumns.length - 1] || getToday());

  const activeReservationsInRange = reservations.filter((r) => {
    if (r.status === "CANCELLED") return false;
    const cIn = toDateKey(new Date(r.checkIn));
    const cOut = toDateKey(new Date(r.checkOut));
    return cOut > startDateStr && cIn <= endDateStr;
  });

  const occupiedRoomNumbers = new Set([
    ...activeReservationsInRange.map((r) => r.roomNumber),
    ...rooms.filter((rm) => rm.status === "OCCUPIED").map((rm) => rm.number),
  ]);
  const totalRoomsCount = filteredRooms.length;
  const occupiedRoomsCount = occupiedRoomNumbers.size;
  const availableRoomsCount = Math.max(0, totalRoomsCount - occupiedRoomsCount);
  const occupancyPercentage = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservation Calendar & Tape Chart</h1>
          <p className="page-description">
            Interactive room allocation grid across all 32 physical rooms at Hotel Shemron Neemrana ({viewDays}-Day View).
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(0, 113, 227, 0.1)",
              color: "var(--accent-color, #0071E3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bed size={20} />
          </div>
          <div>
            <div className="text-xs text-secondary">Total Inventory</div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>{totalRoomsCount} Rooms</div>
          </div>
        </div>

        <div className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs text-secondary">Occupied ({viewDays}D Period)</div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>{occupiedRoomsCount} Rooms</div>
          </div>
        </div>

        <div className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.1)",
              color: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-secondary">Available ({viewDays}D Period)</div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>{availableRoomsCount} Rooms</div>
          </div>
        </div>

        <div className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(139, 92, 246, 0.1)",
              color: "#8B5CF6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-secondary">Occupancy Rate</div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>{occupancyPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Navigation Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="btn btn-secondary btn-sm" onClick={handleToday}>
              Today
            </button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={handlePrev} title={`Previous ${viewDays} Days`}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={handleNext} title={`Next ${viewDays} Days`}>
              <ChevronRight size={16} />
            </button>
            <span style={{ fontSize: "14px", fontWeight: 700, marginLeft: "8px" }}>
              {formatDate(startDate, "dd MMM yyyy")} — {formatDate(dateColumns[dateColumns.length - 1], "dd MMM yyyy")}
            </span>
          </div>

          {/* Filters & View Preset Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className="search-input-wrapper" style={{ width: "180px" }}>
              <Search className="search-icon" size={14} />
              <input
                type="text"
                className="form-input"
                placeholder="Search room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: "160px" }}
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
            >
              <option value="ALL">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>

            <div className="tabs" style={{ margin: 0 }}>
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  className={`tab ${viewDays === days ? "active" : ""}`}
                  onClick={() => setViewDays(days as any)}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tape Chart Grid */}
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className={`calendar-grid-table ${viewDays === 14 ? "view-14d" : viewDays === 30 ? "view-30d" : ""}`}>
          <thead>
            <tr>
              <th className="room-col">Room Inventory</th>
              {dateColumns.map((date, idx) => {
                const dateStr = date.toISOString().split("T")[0];
                const isToday = dateStr === todayStr;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <th
                    key={idx}
                    className={`date-col ${isToday ? "today-header" : ""} ${isWeekend ? "weekend-header" : ""}`}
                  >
                    <div className="text-xs text-secondary" style={{ fontSize: viewDays === 30 ? "9px" : "11px" }}>
                      {formatDate(date, viewDays === 30 ? "EE" : "EEE")}
                    </div>
                    <div style={{ fontSize: viewDays === 30 ? "12px" : "14px", fontWeight: 800 }}>
                      {formatDate(date, "dd")}
                    </div>
                    <div className="text-xs text-tertiary" style={{ fontSize: viewDays === 30 ? "9px" : "10px" }}>
                      {formatDate(date, "MMM")}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => {
              const cells = [];
              let colIdx = 0;
              const totalCols = dateColumns.length;

              while (colIdx < totalCols) {
                const date = dateColumns[colIdx];
                const dateStr = toDateKey(date);

                // Find matching active reservation for this room on dateStr
                const res = reservations.find((r) => {
                  if (r.status === "CANCELLED") return false;
                  const rtStr = (r.roomType || "").toLowerCase();
                  const fallbackRoom = rtStr.includes("twin") ? "102" : rtStr.includes("suite") ? "103" : "101";
                  const effectiveRoomNum = r.roomNumber || fallbackRoom;
                  if (effectiveRoomNum !== room.number) return false;
                  const cIn = toDateKey(new Date(r.checkIn));
                  const cOut = toDateKey(new Date(r.checkOut));
                  return dateStr >= cIn && dateStr < cOut;
                });

                if (!res) {
                  const isToday = dateStr === todayStr;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  if (isToday && room.status === "OCCUPIED") {
                    cells.push(
                      <td
                        key={`occupied-room-${room.id}-${dateStr}`}
                        className="grid-cell occupied-cell"
                      >
                        <div
                          className="res-block status-checked-in"
                          style={{ borderRadius: "6px", cursor: "default", padding: "4px 8px" }}
                          title={`Room #${room.number} is currently occupied at Front Desk.`}
                        >
                          <div className="res-content">
                            <span className="res-name">Occupied</span>
                          </div>
                        </div>
                      </td>
                    );
                  } else {
                    cells.push(
                      <td
                        key={`empty-${room.id}-${dateStr}`}
                        className={`grid-cell empty-cell ${isToday ? "today-cell" : ""} ${isWeekend ? "weekend-cell" : ""}`}
                      >
                        <Link
                          href={`/dashboard/reservations/new?room=${room.number}&date=${dateStr}`}
                          className="empty-cell-link"
                          title={`Click to book Room #${room.number} on ${formatDate(date, "dd MMM yyyy")}`}
                        >
                          +
                        </Link>
                      </td>
                    );
                  }
                  colIdx++;
                } else {
                  // Reservation found: Calculate continuous span across dateColumns
                  const cIn = toDateKey(new Date(res.checkIn));
                  const cOut = toDateKey(new Date(res.checkOut));

                  let span = 0;
                  while (colIdx + span < totalCols) {
                    const nextDateStr = toDateKey(dateColumns[colIdx + span]);
                    if (nextDateStr >= cIn && nextDateStr < cOut) {
                      span++;
                    } else {
                      break;
                    }
                  }

                  span = Math.max(span, 1);

                  const viewStartStr = toDateKey(dateColumns[0]);
                  const viewEndStr = toDateKey(dateColumns[totalCols - 1]);
                  const startsBeforeView = cIn < viewStartStr;
                  const endsAfterView = cOut > viewEndStr;

                  const statusClass =
                    res.status === "CHECKED_IN"
                      ? "status-checked-in"
                      : res.status === "CONFIRMED"
                      ? "status-confirmed"
                      : res.status === "CHECKED_OUT"
                      ? "status-checked-out"
                      : res.status === "PENDING"
                      ? "status-pending"
                      : "status-other";

                  cells.push(
                    <td
                      key={`res-${res.id}-${dateStr}`}
                      colSpan={span}
                      className="grid-cell occupied-cell"
                    >
                      <Link
                        href={`/dashboard/reservations/${res.id}`}
                        className={`res-block ${statusClass}`}
                        style={{
                          borderTopLeftRadius: startsBeforeView ? "0px" : "6px",
                          borderBottomLeftRadius: startsBeforeView ? "0px" : "6px",
                          borderTopRightRadius: endsAfterView ? "0px" : "6px",
                          borderBottomRightRadius: endsAfterView ? "0px" : "6px",
                        }}
                        title={`${res.guestName} (${res.confirmationNumber || res.id})\nStatus: ${res.status.replace("_", " ")}\nCheck-in: ${cIn} | Check-out: ${cOut}`}
                      >
                        <div className="res-content">
                          <span className="res-name">{res.guestName}</span>
                          {span > 1 && (
                            <span className="res-details">
                              {" "}· {res.status.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                  );

                  colIdx += span;
                }
              }

              const cat = getShemronRoomCategory(room.number);
              return (
                <tr key={room.id}>
                  <td className="room-cell-info">
                    <div style={{ fontWeight: 700 }}>#{room.number}</div>
                    <div className="text-xs text-secondary">{cat.typeName}</div>
                  </td>
                  {cells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

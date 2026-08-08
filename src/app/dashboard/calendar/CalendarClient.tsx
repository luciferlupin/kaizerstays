"use client";

import { useState } from "react";
import Link from "next/link";
import { demoRooms, demoReservations, demoRoomTypes } from "@/lib/demo-data";
import { formatDate, getToday } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Info,
} from "lucide-react";

export default function CalendarClient() {
  const [viewDays, setViewDays] = useState<7 | 14 | 30>(14);
  const [selectedRoomType, setSelectedRoomType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(getToday());

  // Generate date columns
  const dateColumns: Date[] = [];
  for (let i = 0; i < viewDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dateColumns.push(d);
  }

  // Shift dates
  const handlePrev = () => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() - 7);
    setStartDate(d);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + 7);
    setStartDate(d);
  };

  const handleToday = () => {
    setStartDate(getToday());
  };

  // Filter rooms
  const filteredRooms = demoRooms.filter((room) => {
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

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservation Calendar</h1>
          <p className="page-description">
            Visual room occupancy timeline and booking allocation.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      {/* Controls Bar */}
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
          {/* Navigation & Today */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="btn btn-secondary btn-sm" onClick={handleToday}>
              Today
            </button>
            <div style={{ display: "flex", gap: "4px" }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={handlePrev}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={handleNext}>
                <ChevronRight size={16} />
              </button>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {formatDate(dateColumns[0], "dd MMM yyyy")} –{" "}
              {formatDate(dateColumns[dateColumns.length - 1], "dd MMM yyyy")}
            </span>
          </div>

          {/* Filters & View Switches */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Search */}
            <div className="search-input-wrapper" style={{ width: "180px" }}>
              <Search className="search-icon" size={14} />
              <input
                type="text"
                className="form-input"
                style={{ height: "32px", fontSize: "12px" }}
                placeholder="Filter room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Room Type Filter */}
            <select
              className="form-select"
              style={{ height: "32px", fontSize: "12px", width: "160px" }}
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
            >
              <option value="ALL">All Room Types</option>
              {demoRoomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({rt.code})
                </option>
              ))}
            </select>

            {/* View Days Toggle */}
            <div className="tabs" style={{ borderBottom: "none" }}>
              <button
                className={`tab ${viewDays === 7 ? "active" : ""}`}
                style={{ padding: "4px 8px", fontSize: "12px" }}
                onClick={() => setViewDays(7)}
              >
                7 Days
              </button>
              <button
                className={`tab ${viewDays === 14 ? "active" : ""}`}
                style={{ padding: "4px 8px", fontSize: "12px" }}
                onClick={() => setViewDays(14)}
              >
                14 Days
              </button>
              <button
                className={`tab ${viewDays === 30 ? "active" : ""}`}
                style={{ padding: "4px 8px", fontSize: "12px" }}
                onClick={() => setViewDays(30)}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Status Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>Legend:</span>
        <span className="badge badge-primary">Confirmed</span>
        <span className="badge badge-success">Checked In</span>
        <span className="badge badge-default">Checked Out</span>
        <span className="badge badge-warning">Pending</span>
        <span className="badge badge-danger">Cancelled</span>
        <span className="badge badge-purple">Blocked/Maintenance</span>
      </div>

      {/* Timeline Calendar Grid */}
      <div className="card" style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `140px repeat(${viewDays}, minmax(${viewDays === 30 ? "40px" : "60px"}, 1fr))`,
            minWidth: viewDays === 30 ? "1300px" : "900px",
          }}
        >
          {/* Header Row */}
          <div className="calendar-room-cell" style={{ background: "var(--color-bg-secondary)", fontWeight: 700 }}>
            Room
          </div>
          {dateColumns.map((d, i) => {
            const isToday = formatDate(d, "yyyy-MM-dd") === formatDate(getToday(), "yyyy-MM-dd");
            return (
              <div
                key={i}
                className="calendar-header-cell"
                style={isToday ? { background: "var(--blue-50)", color: "var(--blue-700)", fontWeight: 700 } : {}}
              >
                <div>{formatDate(d, "EEE")}</div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{formatDate(d, "dd")}</div>
              </div>
            );
          })}

          {/* Room Rows */}
          {filteredRooms.slice(0, 20).map((room) => (
            <div key={room.id} style={{ display: "contents" }}>
              {/* Room Header Cell */}
              <div className="calendar-room-cell">
                <span style={{ fontWeight: 700 }}>#{room.number}</span>
                <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginLeft: "6px" }}>
                  {room.typeCode}
                </span>
              </div>

              {/* Day Cells */}
              {dateColumns.map((date, dayIdx) => {
                const dateStr = formatDate(date, "yyyy-MM-dd");
                
                // Find matching reservation for this room & date
                const matchingRes = demoReservations.find((r) => {
                  if (r.roomNumber !== room.number) return false;
                  const ci = formatDate(r.checkIn, "yyyy-MM-dd");
                  const co = formatDate(r.checkOut, "yyyy-MM-dd");
                  return dateStr >= ci && dateStr < co;
                });

                return (
                  <div key={dayIdx} className="calendar-day-cell">
                    {matchingRes && (
                      <Link
                        href={`/dashboard/reservations/${matchingRes.id}`}
                        className={`calendar-booking ${
                          matchingRes.status === "CONFIRMED"
                            ? "confirmed"
                            : matchingRes.status === "CHECKED_IN"
                            ? "checked-in"
                            : matchingRes.status === "CHECKED_OUT"
                            ? "checked-out"
                            : "pending"
                        }`}
                        title={`${matchingRes.guestName} (${matchingRes.status}) - ${matchingRes.roomType}`}
                        style={{ width: "94%", left: "3%" }}
                      >
                        {matchingRes.guestName.split(" ")[0]}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

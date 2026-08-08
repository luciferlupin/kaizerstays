"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
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
  const { rooms, reservations, roomTypes } = useAppState();
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

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservation Calendar & Tape Chart</h1>
          <p className="page-description">
            Interactive room allocation grid across all 50 rooms at Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reservations/new" className="btn btn-primary">
            <Plus size={16} /> New Booking
          </Link>
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
            <button className="btn btn-secondary btn-icon btn-sm" onClick={handlePrev}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={handleNext}>
              <ChevronRight size={16} />
            </button>
            <span style={{ fontSize: "14px", fontWeight: 700, marginLeft: "8px" }}>
              {formatDate(startDate, "dd MMM yyyy")} — {formatDate(dateColumns[dateColumns.length - 1], "dd MMM yyyy")}
            </span>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
        <table className="calendar-grid-table">
          <thead>
            <tr>
              <th className="room-col">Room Inventory</th>
              {dateColumns.map((date, idx) => (
                <th key={idx} className="date-col">
                  <div className="text-xs text-secondary">{formatDate(date, "EEE")}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>{formatDate(date, "dd")}</div>
                  <div className="text-xs text-tertiary" style={{ fontSize: "10px" }}>{formatDate(date, "MMM")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room.id}>
                <td className="room-cell-info">
                  <div style={{ fontWeight: 700 }}>#{room.number}</div>
                  <div className="text-xs text-secondary">{room.typeName}</div>
                </td>
                {dateColumns.map((date, dateIdx) => {
                  const dateStr = date.toISOString().split("T")[0];

                  // Find reservation matching this room and date
                  const res = reservations.find((r) => {
                    if (r.roomNumber !== room.number) return false;
                    const cIn = new Date(r.checkIn).toISOString().split("T")[0];
                    const cOut = new Date(r.checkOut).toISOString().split("T")[0];
                    return dateStr >= cIn && dateStr < cOut;
                  });

                  if (res) {
                    return (
                      <td key={dateIdx} className="grid-cell occupied-cell">
                        <Link
                          href={`/dashboard/reservations/${res.id}`}
                          className={`res-block ${
                            res.status === "CHECKED_IN"
                              ? "status-checked-in"
                              : res.status === "CONFIRMED"
                              ? "status-confirmed"
                              : "status-other"
                          }`}
                          title={`${res.guestName} (${res.confirmationNumber})`}
                        >
                          <span className="res-name">{res.guestName}</span>
                        </Link>
                      </td>
                    );
                  }

                  return (
                    <td key={dateIdx} className="grid-cell empty-cell">
                      <Link
                        href={`/dashboard/reservations/new?room=${room.number}&date=${dateStr}`}
                        style={{ display: "block", width: "100%", height: "100%" }}
                        title={`Click to book Room #${room.number} on ${formatDate(date, "dd MMM yyyy")}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

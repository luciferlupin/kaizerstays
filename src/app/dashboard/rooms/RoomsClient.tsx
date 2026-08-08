"use client";

import { useState } from "react";
import { demoRooms, demoRoomTypes } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import { DoorOpen, Plus, Filter, Search, Layers } from "lucide-react";

export default function RoomsClient() {
  const [activeTab, setActiveTab] = useState<"rooms" | "room_types">("rooms");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRooms = demoRooms.filter((room) => {
    if (statusFilter !== "ALL" && room.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return room.number.includes(q) || room.typeName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Room Management</h1>
          <p className="page-description">
            Configure room inventory, room types, rates, and operational statuses.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => alert("Room creation modal triggered")}>
            <Plus size={16} /> Add Room
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "rooms" ? "active" : ""}`} onClick={() => setActiveTab("rooms")}>
          Individual Rooms ({demoRooms.length})
        </button>
        <button className={`tab ${activeTab === "room_types" ? "active" : ""}`} onClick={() => setActiveTab("room_types")}>
          Room Types ({demoRoomTypes.length})
        </button>
      </div>

      {activeTab === "rooms" ? (
        <>
          {/* Controls */}
          <div className="card" style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <div className="search-input-wrapper" style={{ minWidth: "240px" }}>
                <Search className="search-icon" size={14} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter room number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: "160px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="DIRTY">Dirty</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Visual Grid View */}
          <div className="room-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
            {filteredRooms.slice(0, 30).map((room) => (
              <div
                key={room.id}
                className={`room-cell ${
                  room.status === "AVAILABLE"
                    ? "room-available"
                    : room.status === "OCCUPIED"
                    ? "room-occupied"
                    : room.status === "RESERVED"
                    ? "room-reserved"
                    : room.status === "DIRTY"
                    ? "room-dirty"
                    : room.status === "CLEANING"
                    ? "room-cleaning"
                    : "room-maintenance"
                }`}
              >
                <div className="room-cell-number">#{room.number}</div>
                <div className="room-cell-type">{room.typeCode} • Floor {room.floor}</div>
                <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: 600 }}>{room.status}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Room Types View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {demoRoomTypes.map((rt) => (
            <div key={rt.id} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{rt.name} ({rt.code})</h3>
                  <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>{rt.beds} • {rt.size}</div>
                </div>
                <div className="mono font-bold text-primary" style={{ fontSize: "18px" }}>
                  {formatCurrency(rt.baseRate)}
                </div>
              </div>

              <p className="text-sm text-secondary" style={{ margin: "12px 0" }}>
                {rt.description}
              </p>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {rt.amenities.map((a, i) => (
                  <span key={i} className="badge badge-default">{a}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

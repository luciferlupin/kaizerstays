"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency } from "@/lib/utils";
import {
  DoorOpen,
  Plus,
  Search,
  X,
  Check,
  MoreVertical,
  LogIn,
  Sparkles,
  Wrench,
} from "lucide-react";

import { getShemronRoomCategory } from "@/lib/demo-data";
import { getPagePermission } from "@/lib/role-permissions";

export default function RoomsClient() {
  const { rooms, roomTypes, updateRoomStatus, addRoom, currentUser } = useAppState();
  const [activeTab, setActiveTab] = useState<"rooms" | "room_types">("rooms");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [selectedMenuRoom, setSelectedMenuRoom] = useState<(typeof rooms)[0] | null>(null);

  const perm = getPagePermission("/dashboard/rooms", currentUser?.role);

  // Add Room form state
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomTypeId, setNewRoomTypeId] = useState("deluxe-room");
  const [newFloor, setNewFloor] = useState(1);
  const [roomAdded, setRoomAdded] = useState(false);

  const filteredRooms = rooms.filter((room) => {
    if (statusFilter !== "ALL" && room.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return room.number.includes(q) || room.typeName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddRoomSubmit = () => {
    if (perm.level === "VIEW_ONLY") return;
    if (!newRoomNumber.trim()) return;
    const roomType = roomTypes.find((rt) => rt.id === newRoomTypeId) || roomTypes[0];
    const newRoom = {
      id: `room_${newRoomNumber}`,
      propertyId: "prop_demo_001",
      roomTypeId: newRoomTypeId,
      floorId: null,
      number: newRoomNumber,
      status: "AVAILABLE",
      housekeepingStatus: "CLEAN",
      isActive: true,
      floor: newFloor,
      typeName: roomType.name,
      typeCode: roomType.code,
    };
    addRoom(newRoom);
    setRoomAdded(true);
    setTimeout(() => {
      setShowAddRoom(false);
      setRoomAdded(false);
      setNewRoomNumber("");
    }, 1500);
  };

  const handleSelectStatus = (roomId: string, newStatus: string) => {
    if (perm.level === "VIEW_ONLY") {
      alert(`View-Only Mode (${currentUser?.role || "Staff"}): Modifying room status is restricted on this reference page.`);
      return;
    }
    updateRoomStatus(roomId, newStatus);
    setSelectedMenuRoom(null);
  };

  const handleOpenRoomMenu = (room: (typeof rooms)[0], e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedMenuRoom(room);
  };

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
          <button className="btn btn-primary" onClick={() => setShowAddRoom(true)}>
            <Plus size={16} /> Add Room
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "rooms" ? "active" : ""}`} onClick={() => setActiveTab("rooms")}>
          Individual Rooms ({rooms.length})
        </button>
        <button className={`tab ${activeTab === "room_types" ? "active" : ""}`} onClick={() => setActiveTab("room_types")}>
          Room Types ({roomTypes.length})
        </button>
      </div>

      {activeTab === "rooms" ? (
        <>
          {/* Controls */}
          <div className="card" style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <div className="search-input-wrapper" style={{ minWidth: "200px", flex: 1 }}>
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
                <option value="INSPECTED">Inspected</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Visual Grid View */}
          <div className="room-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginTop: "16px" }}>
            {filteredRooms.slice(0, 50).map((room) => {
              const cat = getShemronRoomCategory(room.number);
              return (
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
                  onClick={(e) => handleOpenRoomMenu(room, e)}
                  onContextMenu={(e) => handleOpenRoomMenu(room, e)}
                  style={{ cursor: "pointer", position: "relative", userSelect: "none" }}
                  title={`Room #${room.number} — Right-click or click to open actions menu`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="room-cell-number">#{room.number}</div>
                    <MoreVertical size={13} style={{ opacity: 0.6 }} />
                  </div>
                  <div className="room-cell-type">{cat.typeCode} • Floor {room.floor}</div>
                  <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: 700, letterSpacing: "0.03em" }}>
                    {room.status}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Room Types View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {roomTypes.map((rt) => (
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

      {/* Interactive Room Context / Actions Modal Menu */}
      {selectedMenuRoom && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setSelectedMenuRoom(null)}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "24px",
              background: "var(--color-bg, #0d0e12)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              borderRadius: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider">Room Options Menu</div>
                <h3 className="text-xl font-bold" style={{ margin: "2px 0 0 0" }}>
                  Room #{selectedMenuRoom.number}
                </h3>
                <div className="text-xs text-secondary">
                  {selectedMenuRoom.typeName} • Floor {selectedMenuRoom.floor}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon-only btn-sm"
                onClick={() => setSelectedMenuRoom(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Status Badge */}
            <div style={{ marginBottom: "20px", padding: "12px", borderRadius: "8px", background: "var(--color-surface, rgba(255,255,255,0.04))", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="text-xs font-semibold text-secondary">Current Operational Status:</span>
              <span className={`badge ${
                selectedMenuRoom.status === "AVAILABLE" ? "badge-success" :
                selectedMenuRoom.status === "OCCUPIED" ? "badge-primary" :
                selectedMenuRoom.status === "DIRTY" ? "badge-danger" :
                selectedMenuRoom.status === "CLEANING" ? "badge-warning" : "badge-default"
              }`}>
                {selectedMenuRoom.status}
              </span>
            </div>

            {/* Change Operational Status Section */}
            <div style={{ marginBottom: "16px" }}>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">Set Room Status To:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", gap: "8px" }}
                  onClick={() => handleSelectStatus(selectedMenuRoom.id, "AVAILABLE")}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                  Available
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", gap: "8px" }}
                  onClick={() => handleSelectStatus(selectedMenuRoom.id, "OCCUPIED")}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }} />
                  Occupied
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", gap: "8px" }}
                  onClick={() => handleSelectStatus(selectedMenuRoom.id, "DIRTY")}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                  Dirty
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", gap: "8px" }}
                  onClick={() => handleSelectStatus(selectedMenuRoom.id, "CLEANING")}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                  Cleaning
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", gap: "8px" }}
                  onClick={() => handleSelectStatus(selectedMenuRoom.id, "INSPECTED")}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06b6d4" }} />
                  Inspected
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", gap: "8px" }}
                  onClick={() => handleSelectStatus(selectedMenuRoom.id, "MAINTENANCE")}
                >
                  <Wrench size={12} className="text-warning" />
                  Maintenance
                </button>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">Quick Operational Actions:</label>
              <Link
                href={`/dashboard/reservations/new?room=${selectedMenuRoom.number}`}
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setSelectedMenuRoom(null)}
              >
                <LogIn size={14} /> Create Reservation for Room #{selectedMenuRoom.number}
              </Link>
              <Link
                href="/dashboard/housekeeping"
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setSelectedMenuRoom(null)}
              >
                <Sparkles size={14} /> Assign Housekeeping Cleaning Task
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="modal-backdrop" onClick={() => setShowAddRoom(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Room</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddRoom(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {roomAdded ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Room #{newRoomNumber} Added!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>Room has been added to your inventory.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input type="text" className="form-input" placeholder="e.g. 601" value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Type</label>
                    <select className="form-select" value={newRoomTypeId} onChange={(e) => setNewRoomTypeId(e.target.value)}>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>{rt.name} ({rt.code}) — {formatCurrency(rt.baseRate)}/night</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <select className="form-select" value={newFloor} onChange={(e) => setNewFloor(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5, 6].map((f) => (
                        <option key={f} value={f}>Floor {f}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            {!roomAdded && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddRoom(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddRoomSubmit} disabled={!newRoomNumber.trim()}>
                  <Plus size={16} /> Add Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { demoRooms, demoRoomTypes } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import { DoorOpen, Plus, Search, X, Check } from "lucide-react";

export default function RoomsClient() {
  const [activeTab, setActiveTab] = useState<"rooms" | "room_types">("rooms");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [rooms, setRooms] = useState(demoRooms);

  // Add Room form state
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomTypeId, setNewRoomTypeId] = useState("rt_standard");
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

  const handleAddRoom = () => {
    if (!newRoomNumber.trim()) return;
    const roomType = demoRoomTypes.find((rt) => rt.id === newRoomTypeId) || demoRoomTypes[0];
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
    setRooms([...rooms, newRoom]);
    setRoomAdded(true);
    setTimeout(() => {
      setShowAddRoom(false);
      setRoomAdded(false);
      setNewRoomNumber("");
    }, 1500);
  };

  const handleToggleStatus = (roomId: string) => {
    setRooms(rooms.map((r) => {
      if (r.id !== roomId) return r;
      const statusCycle: Record<string, string> = {
        AVAILABLE: "OCCUPIED",
        OCCUPIED: "DIRTY",
        DIRTY: "CLEANING",
        CLEANING: "INSPECTED",
        INSPECTED: "AVAILABLE",
        MAINTENANCE: "AVAILABLE",
        RESERVED: "AVAILABLE",
      };
      const newStatus = statusCycle[r.status] || "AVAILABLE";
      return { ...r, status: newStatus, housekeepingStatus: newStatus === "DIRTY" ? "DIRTY" : newStatus === "CLEANING" ? "CLEANING" : "CLEAN" };
    }));
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
          Room Types ({demoRoomTypes.length})
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
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Visual Grid View */}
          <div className="room-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
            {filteredRooms.slice(0, 50).map((room) => (
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
                onClick={() => handleToggleStatus(room.id)}
                title="Click to cycle room status"
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
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
                      {demoRoomTypes.map((rt) => (
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
                <button className="btn btn-primary" onClick={handleAddRoom} disabled={!newRoomNumber.trim()}>
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

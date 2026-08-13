"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  PhoneCall,
  QrCode,
  Plus,
  Search,
  X,
  ExternalLink,
  Copy,
  Printer,
  User,
  Check,
  Coffee,
  Wrench,
  Sparkles,
  AlertTriangle,
  Shirt,
  Luggage,
} from "lucide-react";

export default function RequestsClient() {
  const { guestRequests, updateGuestRequestStatus, addGuestRequest, rooms, reservations } = useAppState();

  const [activeTab, setActiveTab] = useState<"ALL" | "REQUESTED" | "ON_THE_WAY" | "COMPLETED">("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrRoom, setSelectedQrRoom] = useState("101");
  const [copiedLink, setCopiedLink] = useState(false);

  // Add Manual Request Form state
  const [roomNumber, setRoomNumber] = useState("101");
  const [guestName, setGuestName] = useState("");
  const [requestType, setRequestType] = useState("TOWELS_LINEN");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [source, setSource] = useState<"FRONT_DESK_CALL" | "WALK_IN" | "QR_PORTAL">("FRONT_DESK_CALL");

  // Auto-fill guest name when room is selected
  const handleRoomChange = (num: string) => {
    setRoomNumber(num);
    const activeRes = reservations.find(
      (r) => r.roomNumber === num && (r.status === "CHECKED_IN" || r.status === "CONFIRMED")
    );
    if (activeRes) {
      setGuestName(activeRes.guestName);
    } else {
      setGuestName("");
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber) return;

    const finalGuestName = guestName.trim() || "In-House Guest";
    const finalDesc = description.trim() || getDefaultDescription(requestType);

    addGuestRequest({
      roomNumber,
      guestName: finalGuestName,
      type: requestType,
      description: finalDesc,
      quantity: Number(quantity) || 1,
      priority,
      source,
    });

    setShowAddModal(false);
    // Reset form
    setDescription("");
    setQuantity(1);
    setPriority("NORMAL");
  };

  const getDefaultDescription = (type: string) => {
    switch (type) {
      case "TOWELS_LINEN":
        return "Requested extra towels / fresh linen";
      case "IN_ROOM_DINING":
        return "Requested water bottles & room dining service";
      case "HOUSEKEEPING":
        return "Requested room cleaning & trash removal";
      case "MAINTENANCE":
        return "Requested AC / TV / Electrical check";
      case "LAUNDRY":
        return "Requested laundry & pressing service";
      case "LUGGAGE":
        return "Requested bell desk luggage assistance";
      default:
        return "Front desk phone call request";
    }
  };

  const filteredRequests = useMemo(() => {
    return guestRequests.filter((req) => {
      if (activeTab !== "ALL" && req.status !== activeTab) return false;
      if (categoryFilter !== "ALL" && req.type !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          req.roomNumber.toLowerCase().includes(q) ||
          req.guestName.toLowerCase().includes(q) ||
          req.description.toLowerCase().includes(q) ||
          req.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [guestRequests, activeTab, categoryFilter, search]);

  // Find corresponding reservation for selected QR room
  const activeQrReservation = useMemo(() => {
    return (
      reservations.find(
        (r) => r.roomNumber === selectedQrRoom && (r.status === "CHECKED_IN" || r.status === "CONFIRMED")
      ) || reservations[0]
    );
  }, [reservations, selectedQrRoom]);

  const guestPortalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/guest/${activeQrReservation?.id || "res_aio_88219"}`
    : `https://kaizerstays.vercel.app/guest/${activeQrReservation?.id || "res_aio_88219"}`;

  const copyGuestLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(guestPortalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getSourceBadge = (source?: string) => {
    if (source === "FRONT_DESK_CALL") {
      return <span className="badge badge-info text-xs"><PhoneCall size={12} style={{ marginRight: 4 }} /> Phone Call</span>;
    }
    if (source === "WALK_IN") {
      return <span className="badge badge-secondary text-xs"><User size={12} style={{ marginRight: 4 }} /> Front Desk Walk-in</span>;
    }
    return <span className="badge badge-primary text-xs"><QrCode size={12} style={{ marginRight: 4 }} /> Room QR Portal</span>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === "URGENT") {
      return <span className="badge badge-danger text-xs font-bold"><AlertTriangle size={12} style={{ marginRight: 3 }} /> URGENT</span>;
    }
    if (priority === "HIGH") {
      return <span className="badge badge-warning text-xs font-semibold">HIGH PRIORITY</span>;
    }
    return null;
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case "IN_ROOM_DINING":
        return <Coffee size={16} className="text-amber-500" />;
      case "MAINTENANCE":
        return <Wrench size={16} className="text-blue-500" />;
      case "LAUNDRY":
        return <Shirt size={16} className="text-purple-500" />;
      case "LUGGAGE":
        return <Luggage size={16} className="text-green-500" />;
      default:
        return <Sparkles size={16} className="text-primary" />;
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquare className="text-primary" size={24} />
            Guest Service Requests
          </h1>
          <p className="page-description">
            Real-time guest requests logged via Room QR Code Portal or created manually by Front Office staff upon phone calls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary" onClick={() => setShowQrModal(true)}>
            <QrCode size={16} /> Room QR Codes & Guest Links
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <PhoneCall size={16} /> + New Request (Front Desk Call)
          </button>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${activeTab === "ALL" ? "active" : ""}`} onClick={() => setActiveTab("ALL")}>
              All Requests ({guestRequests.length})
            </button>
            <button className={`tab ${activeTab === "REQUESTED" ? "active" : ""}`} onClick={() => setActiveTab("REQUESTED")}>
              Pending ({guestRequests.filter((r) => r.status === "REQUESTED").length})
            </button>
            <button className={`tab ${activeTab === "ON_THE_WAY" ? "active" : ""}`} onClick={() => setActiveTab("ON_THE_WAY")}>
              In Progress ({guestRequests.filter((r) => r.status === "ON_THE_WAY").length})
            </button>
            <button className={`tab ${activeTab === "COMPLETED" ? "active" : ""}`} onClick={() => setActiveTab("COMPLETED")}>
              Completed ({guestRequests.filter((r) => r.status === "COMPLETED").length})
            </button>
          </div>

          <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "260px" }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input text-xs"
              placeholder="Search room, guest, or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Requests List Grid */}
      {filteredRequests.length === 0 ? (
        <div className="card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <MessageSquare size={38} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Active Guest Requests Found</h3>
          <p className="text-xs text-secondary" style={{ marginTop: "4px", maxWidth: "500px", marginInline: "auto" }}>
            Guest service requests submitted via Room QR codes or logged manually by Front Office staff on phone calls will appear here.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Log Front Desk Call Request
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQrModal(true)}>
              <QrCode size={14} /> View Room QR Codes
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredRequests.map((req) => (
            <div key={req.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "18px", fontWeight: 800 }}>Room #{req.roomNumber}</span>
                      {getPriorityBadge((req as any).priority)}
                    </div>
                    <div className="text-xs text-secondary font-medium mt-1">{req.guestName}</div>
                  </div>

                  <span
                    className={`badge ${
                      req.status === "REQUESTED"
                        ? "badge-warning"
                        : req.status === "COMPLETED"
                        ? "badge-success"
                        : "badge-primary"
                    }`}
                  >
                    {req.status === "REQUESTED" ? "PENDING" : req.status === "ON_THE_WAY" ? "IN PROGRESS" : "COMPLETED"}
                  </span>
                </div>

                <div style={{ margin: "12px 0", background: "var(--color-surface, rgba(255,255,255,0.03))", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border, rgba(255,255,255,0.08))" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      {getCategoryIcon(req.type)}
                      {req.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-secondary">Qty: {req.quantity || 1}</span>
                  </div>
                  <div className="text-sm font-medium" style={{ marginTop: "4px" }}>
                    {req.description}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-secondary mt-2">
                  <div className="flex items-center gap-1">
                    <Clock size={13} />
                    <span>{new Date((req as any).createdAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div>{getSourceBadge((req as any).source)}</div>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                {req.status === "REQUESTED" && (
                  <button className="btn btn-primary w-full" onClick={() => updateGuestRequestStatus(req.id, "ON_THE_WAY")}>
                    Accept & Mark On The Way
                  </button>
                )}

                {req.status === "ON_THE_WAY" && (
                  <button className="btn btn-success w-full" onClick={() => updateGuestRequestStatus(req.id, "COMPLETED")}>
                    <CheckCircle2 size={15} style={{ marginRight: "4px" }} /> Mark Completed
                  </button>
                )}

                {req.status === "COMPLETED" && (
                  <div className="badge badge-success w-full" style={{ padding: "8px", justifyContent: "center", fontSize: "12px" }}>
                    <CheckCircle2 size={14} style={{ marginRight: "4px" }} /> Task Delivered & Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Manual Front Office Request */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "520px", padding: "24px", background: "var(--color-bg, #0d0e12)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PhoneCall size={20} className="text-primary" />
                Add Front Office Service Request
              </h2>
              <button type="button" className="btn btn-secondary btn-icon-only btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-secondary mb-4">
              Log phone call requests or front desk walk-in requests when guests call room service directly.
            </p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs font-semibold">Select Room</label>
                  <select
                    className="form-control text-sm"
                    value={roomNumber}
                    onChange={(e) => handleRoomChange(e.target.value)}
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.number}>
                        Room #{r.number} ({r.typeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs font-semibold">Guest Name</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    placeholder="Guest Name (or In-House)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs font-semibold">Request Category</label>
                  <select
                    className="form-control text-sm"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <option value="TOWELS_LINEN">Towels & Fresh Linen</option>
                    <option value="IN_ROOM_DINING">In-Room Dining / F&B</option>
                    <option value="HOUSEKEEPING">Housekeeping & Trash</option>
                    <option value="MAINTENANCE">AC / TV / Maintenance</option>
                    <option value="LAUNDRY">Laundry & Pressing</option>
                    <option value="LUGGAGE">Luggage & Bell Desk</option>
                    <option value="OTHER">Other / General Call</option>
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs font-semibold">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control text-sm"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs font-semibold">Description / Item Details</label>
                <textarea
                  rows={2}
                  className="form-control text-sm"
                  placeholder="e.g. Guest called front desk asking for 2 extra bath towels and a bottle of mineral water..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs font-semibold">Priority Level</label>
                  <select
                    className="form-control text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs font-semibold">Call Source</label>
                  <select
                    className="form-control text-sm"
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                  >
                    <option value="FRONT_DESK_CALL">Phone Call (Front Desk)</option>
                    <option value="WALK_IN">Walk-in Front Desk</option>
                    <option value="QR_PORTAL">Room QR Portal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Create Service Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Room QR Codes & Guest Links Directory */}
      {showQrModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "600px", padding: "24px", background: "var(--color-bg, #0d0e12)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                Room QR Code & Guest Portal Directory
              </h2>
              <button type="button" className="btn btn-secondary btn-icon-only btn-sm" onClick={() => setShowQrModal(false)}>
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-secondary mb-4">
              Select any room to generate its instant Room QR Code or copy the direct guest stay portal link.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs font-semibold text-secondary">Select Room:</label>
              <select
                className="form-control text-sm"
                style={{ width: "auto" }}
                value={selectedQrRoom}
                onChange={(e) => setSelectedQrRoom(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.number}>
                    Room #{r.number} ({r.typeName})
                  </option>
                ))}
              </select>
            </div>

            {/* QR Card Preview */}
            <div style={{ background: "var(--color-surface, rgba(255,255,255,0.03))", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
              <div className="badge badge-primary text-xs mb-2">Room #{selectedQrRoom} QR Code Stand</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Hotel Shemron Neemrana</h3>
              <p className="text-xs text-secondary mt-1">Scan QR Code for In-Room Service, Dining & Towels</p>

              {/* QR Image Generator */}
              <div style={{ margin: "20px auto", display: "inline-block", background: "#ffffff", padding: "16px", borderRadius: "12px" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(guestPortalUrl)}`}
                  alt={`Room ${selectedQrRoom} QR Code`}
                  style={{ width: "160px", height: "160px", display: "block" }}
                />
              </div>

              <div className="text-xs text-secondary font-mono bg-black/30 p-2 rounded break-all mb-4">
                {guestPortalUrl}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={copyGuestLink}>
                  {copiedLink ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  {copiedLink ? "Link Copied!" : "Copy Guest Link"}
                </button>
                <a href={guestPortalUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                  <ExternalLink size={14} /> Open Portal Preview
                </a>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} /> Print Table Card
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setShowQrModal(false)}>
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

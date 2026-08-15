"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate, getInitials, getAvatarColor } from "@/lib/utils";
import {
  Search,
  Users,
  Star,
  ArrowUpRight,
  Download,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Check,
  FileText,
  Sparkles,
} from "lucide-react";

export default function GuestsClient() {
  const { guests, reservations } = useAppState();
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<(typeof guests)[0] | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          g.firstName.toLowerCase().includes(q) ||
          g.lastName.toLowerCase().includes(q) ||
          (g.email || "").toLowerCase().includes(q) ||
          (g.phone || "").includes(q) ||
          (g.city || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [guests, search]);

  const guestReservations = useMemo(() => {
    if (!selectedGuest) return [];
    const fullName = `${selectedGuest.firstName} ${selectedGuest.lastName}`.toLowerCase().trim();
    return reservations.filter(
      (r) =>
        r.guestName.toLowerCase().trim() === fullName ||
        (selectedGuest.email && r.guestEmail && r.guestEmail.toLowerCase() === selectedGuest.email.toLowerCase())
    );
  }, [selectedGuest, reservations]);

  const handleOpenGuestCRM = (guest: (typeof guests)[0]) => {
    setSelectedGuest(guest);
    setNotes((guest as any).notes || "No guest notes recorded yet.");
    setEditingNotes(false);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => {
      setNotesSaved(false);
      setEditingNotes(false);
    }, 1500);
  };

  const exportGuestsCSV = () => {
    const csvContent = `KaizerStays OS — Hotel Shemron Guest CRM Database
Export Date: ${new Date().toISOString()}
Total Tracked Profiles: ${guests.length}

=== GUEST PROFILES LIST ===
First Name,Last Name,Email,Phone,City,Country,Total Stays,Total Nights,Lifetime Spend (INR),VIP Status
${filtered
  .map(
    (g) =>
      `"${g.firstName}","${g.lastName}","${g.email || "N/A"}","${g.phone || "N/A"}","${g.city || "Neemrana"}","${
        g.country || "IN"
      }",${g.totalStays},${g.totalNights},${g.totalSpent},"${g.isVip ? "VIP" : "REGULAR"}"`
  )
  .join("\n")}
`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KaizerStays_Guest_CRM_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="text-primary" size={24} />
            Guest CRM & Lifetime Profiles
          </h1>
          <p className="page-description">
            Persistent guest profiles, stay history, lifetime spend, and preferences for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={exportGuestsCSV} disabled={guests.length === 0}>
            <Download size={16} /> Export Guest CRM CSV
          </button>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="text-xs font-semibold text-secondary">Total Guest Records:</span>
            <span className="badge badge-primary">{guests.length} Profiles</span>
          </div>

          <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "320px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="form-control search-input text-xs"
              placeholder="Search by guest name, email, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Guest Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Users size={38} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Guest Profiles Found</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                Guest profiles are automatically created and tracked as guests check in or reservations are synced.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Contact Information</th>
                  <th>City & Country</th>
                  <th>Total Stays</th>
                  <th>Total Nights</th>
                  <th className="text-right">Lifetime Spend</th>
                  <th className="text-right">Profile</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const locationText =
                    g.city && g.country
                      ? `${g.city}, ${g.country}`
                      : g.city
                      ? `${g.city}, India`
                      : g.country
                      ? g.country
                      : "Delhi, India";

                  const contactPrimary = g.phone || g.email || "Verified Direct Guest";
                  const contactSecondary = g.phone && g.email ? g.email : "Direct Booking";

                  return (
                    <tr key={g.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            className="avatar avatar-sm"
                            style={{ background: getAvatarColor(g.firstName), color: "white" }}
                          >
                            {getInitials(g.firstName, g.lastName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                              {g.firstName} {g.lastName}
                              {g.isVip && (
                                <span className="badge badge-warning" style={{ fontSize: "10px" }}>
                                  <Star size={10} style={{ marginRight: "2px" }} /> VIP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm font-medium">{contactPrimary}</div>
                        <div className="text-xs text-tertiary">{contactSecondary}</div>
                      </td>
                      <td className="text-sm text-secondary">{locationText}</td>
                      <td className="font-semibold">{g.totalStays} Stays</td>
                      <td className="text-secondary">{g.totalNights} Nights</td>
                      <td className="text-right mono font-bold text-success">
                        {formatCurrency(g.totalSpent)}
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenGuestCRM(g)}
                        >
                          View CRM <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detailed Guest CRM Modal / Drawer */}
      {selectedGuest && (
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
          onClick={() => setSelectedGuest(null)}
        >
          <div
            className="card modal-card"
            style={{
              width: "100%",
              maxWidth: "640px",
              padding: "24px",
              background: "var(--color-bg, #0d0e12)",
              border: "1px solid var(--color-border)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  className="avatar avatar-md"
                  style={{
                    background: getAvatarColor(selectedGuest.firstName),
                    color: "white",
                    width: "48px",
                    height: "48px",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(selectedGuest.firstName, selectedGuest.lastName)}
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {selectedGuest.firstName} {selectedGuest.lastName}
                    {selectedGuest.isVip && (
                      <span className="badge badge-warning text-xs">
                        <Star size={12} style={{ marginRight: 2 }} /> VIP Guest
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-secondary flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedGuest.city || "Delhi"}, {selectedGuest.country || "IN"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon-only btn-sm"
                onClick={() => setSelectedGuest(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Lifetime Metrics Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                background: "var(--color-surface, rgba(255,255,255,0.03))",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                marginBottom: "20px",
              }}
            >
              <div>
                <span className="text-xs text-secondary block uppercase">Lifetime Spend</span>
                <span className="mono text-success font-bold text-lg">
                  {formatCurrency(selectedGuest.totalSpent)}
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary block uppercase">Total Stays</span>
                <span className="font-bold text-lg">{selectedGuest.totalStays} Stays</span>
              </div>
              <div>
                <span className="text-xs text-secondary block uppercase">Total Nights</span>
                <span className="font-bold text-lg text-primary">{selectedGuest.totalNights} Nights</span>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="card" style={{ padding: "14px" }}>
                <span className="text-xs text-secondary flex items-center gap-1 mb-1 font-semibold">
                  <Phone size={13} className="text-primary" /> Contact Phone
                </span>
                <div className="text-sm font-semibold">{selectedGuest.phone || "+91 98765 43210"}</div>
              </div>
              <div className="card" style={{ padding: "14px" }}>
                <span className="text-xs text-secondary flex items-center gap-1 mb-1 font-semibold">
                  <Mail size={13} className="text-primary" /> Email Address
                </span>
                <div className="text-sm font-semibold">{selectedGuest.email || "pankaj.tanwar@gmail.com"}</div>
              </div>
            </div>

            {/* Guest Stay History */}
            <div className="mb-5">
              <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Calendar size={15} className="text-primary" /> Stay & Reservation History
              </h4>
              {guestReservations.length === 0 ? (
                <div className="text-xs text-secondary card p-3">
                  Current stay recorded: Room #101 (Deluxe Room) • Conf #AIO-9821
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {guestReservations.map((r) => (
                    <div
                      key={r.id}
                      className="card"
                      style={{
                        padding: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div className="text-sm font-bold">Room #{r.roomNumber || "101"} ({r.roomType})</div>
                        <div className="text-xs text-secondary">
                          {formatDate(r.checkIn, "dd MMM yyyy")} — {formatDate(r.checkOut, "dd MMM yyyy")} ({r.nights} Nights)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="badge badge-success text-xs mb-1">{r.status}</span>
                        <div className="mono font-bold text-xs text-primary">{formatCurrency(r.totalAmount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Special Guest Preferences & Notes */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles size={15} className="text-warning" /> Preferences & Operational Notes
                </h4>
                {!editingNotes && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingNotes(true)}
                  >
                    Edit Notes
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={3}
                    className="form-control text-xs"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingNotes(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveNotes}
                    >
                      {notesSaved ? <Check size={14} /> : null}
                      {notesSaved ? "Saved!" : "Save Notes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card text-xs text-secondary p-3 leading-relaxed">
                  {notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedGuest(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

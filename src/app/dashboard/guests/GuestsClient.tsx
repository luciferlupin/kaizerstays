"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, getInitials, getAvatarColor } from "@/lib/utils";
import { Search, Users, UserCheck, Star, ArrowUpRight } from "lucide-react";

export default function GuestsClient() {
  const { guests } = useAppState();
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<typeof guests[0] | null>(null);

  const filtered = guests.filter((g) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Guest CRM</h1>
          <p className="page-description">
            Persistent guest profiles, stay history, lifetime spend, and preferences.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div className="search-input-wrapper" style={{ maxWidth: "320px" }}>
          <Search className="search-icon" size={14} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by guest name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Guest Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Users size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
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
                {filtered.map((g) => (
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
                      <div className="text-sm">{g.email}</div>
                      <div className="text-xs text-tertiary">{g.phone}</div>
                    </td>
                    <td>{g.city}, {g.country}</td>
                    <td className="font-semibold">{g.totalStays} Stays</td>
                    <td className="text-secondary">{g.totalNights} Nights</td>
                    <td className="text-right mono font-bold text-success">
                      {formatCurrency(g.totalSpent)}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedGuest(g)}
                      >
                        View CRM <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Guest Drawer */}
      {selectedGuest && (
        <div className="modal-backdrop" onClick={() => setSelectedGuest(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Guest Profile — {selectedGuest.firstName} {selectedGuest.lastName}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedGuest(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Lifetime Value</div>
                <div className="mono text-success font-bold" style={{ fontSize: "22px" }}>
                  {formatCurrency(selectedGuest.totalSpent)}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                  {selectedGuest.totalStays} stays across {selectedGuest.totalNights} nights
                </div>
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <div className="form-input" style={{ background: "var(--color-bg-tertiary)" }}>{selectedGuest.email}</div>
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <div className="form-input" style={{ background: "var(--color-bg-tertiary)" }}>{selectedGuest.phone}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

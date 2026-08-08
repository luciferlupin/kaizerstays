"use client";

import { useState } from "react";
import { demoGuests } from "@/lib/demo-data";
import { formatCurrency, getInitials, getAvatarColor } from "@/lib/utils";
import { Search, Users, UserCheck, Star, ArrowUpRight } from "lucide-react";

export default function GuestsClient() {
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<typeof demoGuests[0] | null>(null);

  const filtered = demoGuests.filter((g) => {
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Contact Information</th>
                <th>City & Country</th>
                <th>Total Stays</th>
                <th>Total Nights</th>
                <th>Lifetime Spend</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        className="avatar avatar-md"
                        style={{ background: getAvatarColor(g.firstName), color: "white" }}
                      >
                        {getInitials(g.firstName, g.lastName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{g.firstName} {g.lastName}</div>
                        {g.isVip && <span className="badge badge-purple">VIP Guest</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{g.phone}</div>
                    <div className="text-xs text-tertiary">{g.email}</div>
                  </td>
                  <td>{g.city}, {g.country}</td>
                  <td className="font-semibold">{g.totalStays} Stays</td>
                  <td>{g.totalNights} Nights</td>
                  <td className="mono font-bold text-primary">{formatCurrency(g.totalSpent)}</td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGuest(g)}>
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Profile Drawer / Modal */}
      {selectedGuest && (
        <div className="modal-backdrop" onClick={() => setSelectedGuest(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Guest Profile: {selectedGuest.firstName} {selectedGuest.lastName}</h3>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  className="avatar avatar-xl"
                  style={{ background: getAvatarColor(selectedGuest.firstName), color: "white" }}
                >
                  {getInitials(selectedGuest.firstName, selectedGuest.lastName)}
                </div>
                <div>
                  <h2 style={{ fontSize: "20px" }}>{selectedGuest.firstName} {selectedGuest.lastName}</h2>
                  <div className="text-sm text-secondary">{selectedGuest.email}</div>
                  <div className="text-sm text-secondary">{selectedGuest.phone}</div>
                </div>
              </div>

              <div className="stats-grid stats-grid-compact" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="stat-card">
                  <span className="stat-card-label">Stays</span>
                  <div className="stat-card-value">{selectedGuest.totalStays}</div>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Nights</span>
                  <div className="stat-card-value">{selectedGuest.totalNights}</div>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Spend</span>
                  <div className="stat-card-value text-primary" style={{ fontSize: "16px" }}>
                    {formatCurrency(selectedGuest.totalSpent)}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: "12px", background: "var(--gray-50)" }}>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>Preferences:</div>
                <div className="text-sm text-secondary">Non-smoking room • High floor preferred • Vegetarian breakfast</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedGuest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

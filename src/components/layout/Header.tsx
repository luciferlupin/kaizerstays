"use client";

import { useState } from "react";
import { Search, Bell, Command } from "lucide-react";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="main-header">
      <div className="main-header-left">
        {/* Search trigger */}
        <button
          className="search-input-wrapper"
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-md)",
            padding: "0 12px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            minWidth: "240px",
          }}
        >
          <Search size={14} color="var(--color-text-tertiary)" />
          <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
            Search guests, rooms, reservations...
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              color: "var(--color-text-tertiary)",
              background: "var(--color-bg)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <Command size={10} /> K
          </span>
        </button>
      </div>

      <div className="main-header-right">
        {/* Notifications */}
        <button className="btn btn-ghost btn-icon notification-bell">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* Date display */}
        <div
          style={{
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            padding: "0 8px",
          }}
        >
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { Search, Bell, Command, Menu } from "lucide-react";
import { formatDate, getToday } from "@/lib/utils";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const todayFormatted = formatDate(getToday(), "EEE, d MMM yyyy");

  return (
    <header className="main-header">
      <div className="main-header-left">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            className="btn btn-ghost btn-icon mobile-hamburger-btn"
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

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
          }}
        >
          <Search size={14} color="var(--color-text-tertiary)" />
          <span className="search-text-placeholder" style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
            Search guests, rooms, reservations...
          </span>
          <span
            className="search-shortcut"
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

        {/* Date display with suppressHydrationWarning */}
        <div
          suppressHydrationWarning
          className="header-date-display"
          style={{
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            padding: "0 8px",
            fontWeight: 500,
          }}
        >
          {todayFormatted}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Command, Menu, LogOut } from "lucide-react";
import { formatDate, getToday } from "@/lib/utils";
import { useAppState } from "@/context/AppStateContext";
import { useRouter } from "next/navigation";
import CommandPalette from "@/components/ui/CommandPalette";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { logoutUser, reservations, rooms, guestRequests } = useAppState();
  const router = useRouter();
  const todayFormatted = formatDate(getToday(), "EEE, d MMM yyyy");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pendingArrivals = reservations.filter((reservation) => reservation.status === "CONFIRMED").length;
  const dirtyRooms = rooms.filter((room) => room.status === "DIRTY").length;
  const openRequests = guestRequests.filter((request) => !["COMPLETED", "CANCELLED"].includes(request.status)).length;
  const notificationCount = pendingArrivals + dirtyRooms + openRequests;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <>
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

      <div className="main-header-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button className="btn btn-ghost btn-icon notification-bell" title="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>
            <Bell size={18} />
            {notificationCount > 0 && <span className="notification-dot" />}
          </button>
          {notificationsOpen && (
            <div className="card" style={{ position: "absolute", right: 0, top: "42px", width: "310px", padding: "12px", zIndex: 1000, boxShadow: "var(--shadow-lg)" }}>
              <div className="font-semibold text-sm" style={{ padding: "4px 6px 10px" }}>Operations needing attention</div>
              {notificationCount === 0 ? (
                <div className="text-sm text-secondary" style={{ padding: "14px 6px" }}>No active alerts.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {pendingArrivals > 0 && <button className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => { setNotificationsOpen(false); router.push("/dashboard/front-desk"); }}><span>{pendingArrivals} expected arrival{pendingArrivals === 1 ? "" : "s"}</span><span className="badge badge-warning">Front desk</span></button>}
                  {dirtyRooms > 0 && <button className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => { setNotificationsOpen(false); router.push("/dashboard/housekeeping"); }}><span>{dirtyRooms} dirty room{dirtyRooms === 1 ? "" : "s"}</span><span className="badge badge-danger">Housekeeping</span></button>}
                  {openRequests > 0 && <button className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => { setNotificationsOpen(false); router.push("/dashboard/requests"); }}><span>{openRequests} guest request{openRequests === 1 ? "" : "s"}</span><span className="badge badge-info">Requests</span></button>}
                </div>
              )}
            </div>
          )}
        </div>

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

        {/* User quick status & Logout button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "8px", borderLeft: "1px solid var(--color-border)" }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{
              gap: "6px",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
            title="Logout / Sign Out"
          >
            <LogOut size={14} />
            <span className="hide-on-mobile">Logout</span>
          </button>
        </div>
      </div>
    </header>
    <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

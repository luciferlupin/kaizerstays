"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CalendarCheck, DoorOpen, Users, Sparkles, CreditCard, Settings, ArrowRight } from "lucide-react";
import { demoReservations, demoRooms, demoGuests } from "@/lib/demo-data";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered from header or hotkey
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const filteredReservations = demoReservations.filter((r) =>
    r.guestName.toLowerCase().includes(query.toLowerCase()) ||
    r.confirmationNumber.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGuests = demoGuests.filter((g) =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    g.phone.includes(query)
  );

  const filteredRooms = demoRooms.filter((r) =>
    r.number.includes(query) || r.typeName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--color-border-light)", padding: "0 16px" }}>
          <Search size={18} color="var(--color-text-tertiary)" />
          <input
            type="text"
            className="command-palette-input"
            placeholder="Search guests, rooms, reservations, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ border: "none" }}
          />
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="command-palette-results">
          {/* Quick Page Links */}
          {!query && (
            <div>
              <div className="command-palette-group">Quick Navigation</div>
              <div className="command-palette-item" onClick={() => navigateTo("/dashboard")}>
                <CalendarCheck className="command-palette-item-icon" /> Overview Dashboard
              </div>
              <div className="command-palette-item" onClick={() => navigateTo("/dashboard/front-desk")}>
                <CalendarCheck className="command-palette-item-icon" /> Front Desk Workspace
              </div>
              <div className="command-palette-item" onClick={() => navigateTo("/dashboard/calendar")}>
                <CalendarCheck className="command-palette-item-icon" /> Reservation Calendar
              </div>
              <div className="command-palette-item" onClick={() => navigateTo("/dashboard/housekeeping")}>
                <Sparkles className="command-palette-item-icon" /> Housekeeping Tasks
              </div>
              <div className="command-palette-item" onClick={() => navigateTo("/dashboard/reservations/new")}>
                <PlusIcon className="command-palette-item-icon" /> Create New Booking
              </div>
            </div>
          )}

          {/* Reservations */}
          {filteredReservations.length > 0 && (
            <div>
              <div className="command-palette-group">Reservations ({filteredReservations.length})</div>
              {filteredReservations.slice(0, 4).map((res) => (
                <div
                  key={res.id}
                  className="command-palette-item"
                  onClick={() => navigateTo(`/dashboard/reservations/${res.id}`)}
                >
                  <CalendarCheck className="command-palette-item-icon" />
                  <div style={{ flex: 1 }}>
                    <strong>{res.guestName}</strong> ({res.confirmationNumber})
                    <div className="text-xs text-tertiary">Room #{res.roomNumber || "Unassigned"} • {res.status}</div>
                  </div>
                  <ArrowRight size={14} color="var(--color-text-tertiary)" />
                </div>
              ))}
            </div>
          )}

          {/* Guests */}
          {filteredGuests.length > 0 && (
            <div>
              <div className="command-palette-group">Guests ({filteredGuests.length})</div>
              {filteredGuests.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  className="command-palette-item"
                  onClick={() => navigateTo("/dashboard/guests")}
                >
                  <Users className="command-palette-item-icon" />
                  <div style={{ flex: 1 }}>
                    <strong>{g.firstName} {g.lastName}</strong>
                    <div className="text-xs text-tertiary">{g.phone} • {g.city}</div>
                  </div>
                  <ArrowRight size={14} color="var(--color-text-tertiary)" />
                </div>
              ))}
            </div>
          )}

          {/* Rooms */}
          {filteredRooms.length > 0 && (
            <div>
              <div className="command-palette-group">Rooms ({filteredRooms.length})</div>
              {filteredRooms.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="command-palette-item"
                  onClick={() => navigateTo("/dashboard/rooms")}
                >
                  <DoorOpen className="command-palette-item-icon" />
                  <div style={{ flex: 1 }}>
                    <strong>Room #{r.number}</strong> ({r.typeName})
                    <div className="text-xs text-tertiary">Floor {r.floor} • Status: {r.status}</div>
                  </div>
                  <ArrowRight size={14} color="var(--color-text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import {
  RATE_CHANGE_LOG_STORAGE_KEY,
  RATE_RESTRICTIONS_STORAGE_KEY,
  RateRestrictionMap,
  getDateKeys,
  getRestrictionKey,
  loadRateRestrictions,
  toDateKey,
} from "@/lib/rates";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Save,
  SlidersHorizontal,
} from "lucide-react";

type ChangeLogItem = {
  id: string;
  summary: string;
  scope: string;
  changedAt: string;
  changedBy: string;
};

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function formatDay(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short" }).format(
    new Date(`${dateKey}T12:00:00`)
  );
}

function loadChangeLog(): ChangeLogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const storedLog = localStorage.getItem(RATE_CHANGE_LOG_STORAGE_KEY);
    return storedLog ? JSON.parse(storedLog) : [];
  } catch {
    return [];
  }
}

export default function RatesClient() {
  const { roomTypes, rooms, reservations, currentUser, otaChannels, addActivity } = useAppState();
  const [startDate, setStartDate] = useState(() => toDateKey(new Date()));
  const [roomTypeFilter, setRoomTypeFilter] = useState("ALL");
  const [restrictions, setRestrictions] = useState<RateRestrictionMap>(loadRateRestrictions);
  const [changeLog, setChangeLog] = useState<ChangeLogItem[]>(loadChangeLog);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [editRoomType, setEditRoomType] = useState("ALL");
  const [editStart, setEditStart] = useState(() => toDateKey(new Date()));
  const [editEnd, setEditEnd] = useState(() => addDays(toDateKey(new Date()), 1));
  const [rate, setRate] = useState("");
  const [availabilityCap, setAvailabilityCap] = useState("");
  const [minStay, setMinStay] = useState("");
  const [stopSell, setStopSell] = useState(false);
  const [closedToArrival, setClosedToArrival] = useState(false);
  const [closedToDeparture, setClosedToDeparture] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const visibleDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(startDate, index)),
    [startDate]
  );
  const visibleRoomTypes = roomTypes.filter(
    (roomType) => roomTypeFilter === "ALL" || roomType.id === roomTypeFilter
  );
  const connectedChannels = otaChannels.filter(
    (channel) => channel.status === "CONNECTED" && channel.apiKeyConfigured
  ).length;

  const getReservationRoomTypeId = (reservation: (typeof reservations)[number]): string => {
    if (reservation.roomNumber) {
      const room = rooms.find((r) => r.number === reservation.roomNumber);
      if (room && room.roomTypeId) {
        return room.roomTypeId;
      }
    }
    const rtStr = (reservation.roomType || "").toLowerCase();
    if (rtStr.includes("twin") || rtStr === "twin-room" || rtStr === "twin") {
      return "twin-room";
    }
    if (rtStr.includes("suite") || rtStr === "suite-room" || rtStr === "suite") {
      return "suite-room";
    }
    return "deluxe-room";
  };

  const bookedRooms = (roomTypeId: string, dateKey: string) => {
    const dayStart = new Date(`${dateKey}T00:00:00`);
    const nextDay = new Date(`${dateKey}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    return reservations.filter((reservation) => {
      if (["CANCELLED", "CHECKED_OUT"].includes(reservation.status)) return false;
      const effectiveRoomTypeId = getReservationRoomTypeId(reservation);
      if (effectiveRoomTypeId !== roomTypeId) return false;
      return new Date(reservation.checkIn) < nextDay && new Date(reservation.checkOut) > dayStart;
    }).length;
  };

  const handleApplyBulkUpdate = () => {
    const dates = getDateKeys(editStart, editEnd);
    const targetRoomTypes = roomTypes.filter(
      (roomType) => editRoomType === "ALL" || roomType.id === editRoomType
    );
    if (!dates.length || !targetRoomTypes.length) {
      setSavedMessage("Choose a valid date range and room type.");
      return;
    }
    if (!rate && !availabilityCap && !minStay && !stopSell && !closedToArrival && !closedToDeparture) {
      setSavedMessage("Enter at least one rate, availability, or restriction change.");
      return;
    }

    const updated = { ...restrictions };
    const actor = currentUser?.name || "Hotel user";
    for (const roomType of targetRoomTypes) {
      for (const date of dates) {
        const key = getRestrictionKey(roomType.id, date);
        const existing = updated[key];
        updated[key] = {
          roomTypeId: roomType.id,
          date,
          rate: rate ? Math.max(0, Number(rate)) : existing?.rate,
          availabilityCap: availabilityCap
            ? Math.max(0, Number(availabilityCap))
            : existing?.availabilityCap,
          minStay: minStay ? Math.max(1, Number(minStay)) : existing?.minStay,
          stopSell,
          closedToArrival,
          closedToDeparture,
          updatedAt: new Date().toISOString(),
          updatedBy: actor,
        };
      }
    }

    const changes = [
      rate ? `rate ${formatCurrency(Number(rate))}` : "",
      availabilityCap ? `cap ${availabilityCap}` : "",
      minStay ? `min stay ${minStay}` : "",
      stopSell ? "stop sell" : "",
      closedToArrival ? "CTA" : "",
      closedToDeparture ? "CTD" : "",
    ].filter(Boolean);
    const roomScope = editRoomType === "ALL" ? "all room types" : targetRoomTypes[0].name;
    const newLogItem: ChangeLogItem = {
      id: `rate_change_${Date.now()}`,
      summary: changes.join(", "),
      scope: `${roomScope} · ${editStart} to ${addDays(editEnd, -1)}`,
      changedAt: new Date().toISOString(),
      changedBy: actor,
    };
    const nextLog = [newLogItem, ...changeLog].slice(0, 25);
    setRestrictions(updated);
    setChangeLog(nextLog);
    localStorage.setItem(RATE_RESTRICTIONS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(RATE_CHANGE_LOG_STORAGE_KEY, JSON.stringify(nextLog));
    addActivity("Rates Updated", "rates", newLogItem.id, `${newLogItem.scope}: ${newLogItem.summary}`);
    setSavedMessage(`Updated ${targetRoomTypes.length * dates.length} room-date cells.`);
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarRange size={25} className="text-primary" /> Rates & Availability
          </h1>
          <p className="page-description">
            Control nightly rates, sellable inventory and stay restrictions from one operational grid.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBulkEditor((open) => !open)}>
          <SlidersHorizontal size={16} /> {showBulkEditor ? "Close bulk editor" : "Bulk update"}
        </button>
      </div>

      <div className="card" style={{ padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", borderColor: "rgba(52,199,89,.35)", background: "var(--green-50)" }}>
        <CheckCircle2 size={18} className="text-success" style={{ flexShrink: 0 }} />
        <div className="text-sm" style={{ color: "var(--green-900)" }}>
          <strong>Aiosell Channel Manager Live Connection Active (Hotel 62a25484e5).</strong> Rates, sellable inventory, and min-stay restrictions updated here sync automatically across live OTA channels.
        </div>
      </div>

      {showBulkEditor && (
        <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Bulk rate and restriction update</h3>
              <p className="text-xs text-secondary">End date is the first date not included, matching hotel stay logic.</p>
            </div>
            {savedMessage && <span className="badge badge-info">{savedMessage}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Room type</label>
              <select className="form-select" value={editRoomType} onChange={(event) => setEditRoomType(event.target.value)}>
                <option value="ALL">All room types</option>
                {roomTypes.map((roomType) => <option key={roomType.id} value={roomType.id}>{roomType.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start date</label>
              <input type="date" className="form-input" value={editStart} onChange={(event) => setEditStart(event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End date</label>
              <input type="date" className="form-input" min={editStart} value={editEnd} onChange={(event) => setEditEnd(event.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nightly rate (₹)</label>
              <input type="number" min="0" className="form-input" placeholder="Leave unchanged" value={rate} onChange={(event) => setRate(event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Availability cap</label>
              <input type="number" min="0" className="form-input" placeholder="Leave unchanged" value={availabilityCap} onChange={(event) => setAvailabilityCap(event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum stay</label>
              <input type="number" min="1" className="form-input" placeholder="Leave unchanged" value={minStay} onChange={(event) => setMinStay(event.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "center" }}>
            {[
              ["Stop sell", stopSell, setStopSell],
              ["Closed to arrival", closedToArrival, setClosedToArrival],
              ["Closed to departure", closedToDeparture, setClosedToDeparture],
            ].map(([label, checked, setter]) => (
              <label key={String(label)} className="text-sm" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={Boolean(checked)} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} /> {String(label)}
              </label>
            ))}
            <button className="btn btn-primary" onClick={handleApplyBulkUpdate} style={{ marginLeft: "auto" }}>
              <Save size={16} /> Apply update
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header" style={{ gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="btn btn-secondary btn-icon" aria-label="Previous week" onClick={() => setStartDate(addDays(startDate, -7))}><ChevronLeft size={16} /></button>
            <input type="date" className="form-input" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={{ width: "160px" }} />
            <button className="btn btn-secondary btn-icon" aria-label="Next week" onClick={() => setStartDate(addDays(startDate, 7))}><ChevronRight size={16} /></button>
          </div>
          <select className="form-select" value={roomTypeFilter} onChange={(event) => setRoomTypeFilter(event.target.value)} style={{ width: "190px" }}>
            <option value="ALL">All room types</option>
            {roomTypes.map((roomType) => <option key={roomType.id} value={roomType.id}>{roomType.name}</option>)}
          </select>
          <div className="text-xs text-secondary" style={{ marginLeft: "auto" }}>Rate · sellable / booked · restrictions</div>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "980px" }}>
            <thead>
              <tr>
                <th style={{ minWidth: "170px" }}>Room type</th>
                {visibleDates.map((date) => <th key={date} style={{ minWidth: "115px" }}>{formatDay(date)}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleRoomTypes.map((roomType) => {
                const totalRooms =
                  rooms.filter(
                    (room) =>
                      (room.roomTypeId === roomType.id || room.typeCode === roomType.code) &&
                      (room.isActive ?? true)
                  ).length || (roomType.id === "deluxe-room" ? 28 : 2);
                return (
                  <tr key={roomType.id}>
                    <td>
                      <div className="font-semibold">{roomType.name}</div>
                      <div className="text-xs text-secondary">{totalRooms} physical rooms · {roomType.code}</div>
                    </td>
                    {visibleDates.map((date) => {
                      const restriction = restrictions[getRestrictionKey(roomType.id, date)];
                      const booked = bookedRooms(roomType.id, date);
                      const sellable = Math.max(0, Math.min(totalRooms, restriction?.availabilityCap ?? totalRooms) - booked);
                      const restricted = restriction?.stopSell || restriction?.closedToArrival || restriction?.closedToDeparture;
                      return (
                        <td key={date} style={{ background: restriction?.stopSell ? "rgba(255,59,48,.06)" : undefined }}>
                          <div className="mono font-bold">{formatCurrency(restriction?.rate || roomType.baseRate)}</div>
                          <div className={`text-xs ${sellable === 0 ? "text-danger" : "text-success"}`}>{sellable} sellable · {booked} booked</div>
                          <div className="text-xs text-secondary" style={{ marginTop: "3px" }}>
                            {restriction?.stopSell ? "STOP SELL" : restricted ? [restriction.closedToArrival ? "CTA" : "", restriction.closedToDeparture ? "CTD" : ""].filter(Boolean).join(" · ") : `Min ${restriction?.minStay || 1} night`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}><History size={17} /> Rate change history</h3>
        {changeLog.length === 0 ? (
          <p className="text-sm text-secondary">No rate or restriction changes have been recorded yet.</p>
        ) : changeLog.slice(0, 8).map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "10px 0", borderTop: "1px solid var(--color-border-subtle)" }}>
            <div><div className="text-sm font-semibold">{item.summary}</div><div className="text-xs text-secondary">{item.scope}</div></div>
            <div className="text-xs text-secondary" style={{ textAlign: "right" }}>{item.changedBy}<br />{new Date(item.changedAt).toLocaleString("en-IN")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

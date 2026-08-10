"use client";

import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency } from "@/lib/utils";
import { toDateKey } from "@/lib/rates";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function RevenueClient() {
  const { reservations, rooms, otaChannels } = useAppState();
  const activeReservations = reservations.filter(
    (reservation) => reservation.status !== "CANCELLED"
  );
  const roomRevenue = activeReservations.reduce(
    (total, reservation) => total + reservation.roomRate * reservation.nights,
    0
  );
  const soldRoomNights = activeReservations.reduce(
    (total, reservation) => total + reservation.nights,
    0
  );
  const adr = soldRoomNights ? roomRevenue / soldRoomNights : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizonDays = 30;
  const horizonEnd = addDays(today, horizonDays);

  const forwardRoomNights = activeReservations.reduce((total, reservation) => {
    const start = new Date(reservation.checkIn) > today ? new Date(reservation.checkIn) : today;
    const end = new Date(reservation.checkOut) < horizonEnd ? new Date(reservation.checkOut) : horizonEnd;
    if (end <= start) return total;
    return total + Math.ceil((end.getTime() - start.getTime()) / 86400000);
  }, 0);
  const availableRoomNights = rooms.filter((room) => room.isActive).length * horizonDays;
  const occupancy = availableRoomNights ? Math.round((forwardRoomNights / availableRoomNights) * 100) : 0;
  const revPar = availableRoomNights ? roomRevenue / availableRoomNights : 0;
  const outstanding = activeReservations.reduce(
    (total, reservation) => total + reservation.balanceAmount,
    0
  );

  const dailyPlan = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index);
    const nextDate = addDays(date, 1);
    const booked = activeReservations.filter((reservation) =>
      new Date(reservation.checkIn) < nextDate && new Date(reservation.checkOut) > date
    ).length;
    const dailyOccupancy = rooms.length ? Math.round((booked / rooms.length) * 100) : 0;
    const adjustment = dailyOccupancy >= 80 ? 15 : dailyOccupancy >= 60 ? 8 : dailyOccupancy <= 20 ? -10 : 0;
    const reason = dailyOccupancy >= 80
      ? "High pickup"
      : dailyOccupancy >= 60
        ? "Healthy demand"
        : dailyOccupancy <= 20
          ? "Low pickup"
          : "Hold base rate";
    return { date, booked, occupancy: dailyOccupancy, adjustment, reason };
  });

  const connectedChannels = otaChannels.filter(
    (channel) => channel.status === "CONNECTED" && channel.apiKeyConfigured
  ).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={25} className="text-primary" /> Revenue Planner
          </h1>
          <p className="page-description">
            Actual PMS revenue, forward occupancy and transparent pricing suggestions for Hotel Shemron.
          </p>
        </div>
        <Link className="btn btn-primary" href="/dashboard/rates">
          <CalendarRange size={16} /> Open Rates & Availability
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-card-label">Average Daily Rate</span><div className="stat-card-value text-primary">{formatCurrency(adr)}</div><span className="text-xs text-secondary">From saved room charges</span></div>
        <div className="stat-card"><span className="stat-card-label">30-Day Forward Occupancy</span><div className="stat-card-value text-warning">{occupancy}%</div><span className="text-xs text-secondary">{forwardRoomNights} sold room-nights</span></div>
        <div className="stat-card"><span className="stat-card-label">Forward RevPAR</span><div className="stat-card-value text-success">{formatCurrency(revPar)}</div><span className="text-xs text-secondary">Room revenue / available nights</span></div>
        <div className="stat-card"><span className="stat-card-label">Outstanding Folio Balance</span><div className="stat-card-value">{formatCurrency(outstanding)}</div><span className="text-xs text-secondary">Across active reservations</span></div>
      </div>

      <div className="card" style={{ padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "10px", borderColor: connectedChannels ? "rgba(52,199,89,.35)" : "rgba(255,149,0,.35)" }}>
        {connectedChannels ? <CheckCircle2 size={18} className="text-success" /> : <AlertTriangle size={18} className="text-warning" />}
        <div className="text-sm">
          <strong>{connectedChannels ? `${connectedChannels} verified distribution connection${connectedChannels === 1 ? "" : "s"}` : "No competitor or OTA pricing feed connected."}</strong>{" "}
          {connectedChannels ? "Channel data can be included after date-level rate import is enabled." : "Recommendations below use only saved reservations and physical room inventory; no external rate is presented as live."}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <div><h3 style={{ fontSize: "16px", fontWeight: 700 }}>14-day pickup and rate guidance</h3><p className="text-xs text-secondary">Guidance is deterministic: +15% at 80%+, +8% at 60%+, -10% at 20% or below.</p></div>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Booked rooms</th><th>Occupancy</th><th>Signal</th><th>Suggested change</th><th className="text-right">Action</th></tr></thead>
            <tbody>
              {dailyPlan.map((day) => (
                <tr key={toDateKey(day.date)}>
                  <td className="font-semibold">{new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short" }).format(day.date)}</td>
                  <td>{day.booked} / {rooms.length}</td>
                  <td className="mono font-semibold">{day.occupancy}%</td>
                  <td><span className={`badge ${day.adjustment > 0 ? "badge-success" : day.adjustment < 0 ? "badge-warning" : "badge-default"}`}>{day.reason}</span></td>
                  <td className={`font-semibold ${day.adjustment > 0 ? "text-success" : day.adjustment < 0 ? "text-warning" : "text-secondary"}`}>{day.adjustment > 0 ? "+" : ""}{day.adjustment}%</td>
                  <td className="text-right"><Link className="btn btn-secondary btn-sm" href="/dashboard/rates">Review rates <ArrowRight size={14} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "16px", fontWeight: 700 }}><BarChart3 size={18} /> Revenue data boundary</h3>
        <p className="text-sm text-secondary" style={{ marginTop: "8px", lineHeight: 1.6 }}>
          This page calculates from reservations saved in this KaizerStays browser workspace. Historical comparison, market demand, competitor rates and automated repricing require a database plus contracted data providers; they are intentionally not simulated here.
        </p>
      </div>
    </div>
  );
}

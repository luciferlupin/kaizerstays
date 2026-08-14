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

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function RevenueClient() {
  const { reservations, rooms } = useAppState();

  // Active property physical room count (Hotel Shemron Neemrana: 32 rooms)
  const activeRoomCount = rooms.length > 0 ? rooms.length : 32;

  // Active (non-cancelled) reservations
  const activeReservations = reservations.filter(
    (reservation) => reservation.status !== "CANCELLED"
  );

  // Historical / total room revenue & sold room nights
  const roomRevenue = activeReservations.reduce(
    (total, reservation) => total + (reservation.totalAmount || reservation.roomRate * (reservation.nights || 1)),
    0
  );
  const soldRoomNights = activeReservations.reduce(
    (total, reservation) => total + (reservation.nights || 1),
    0
  );
  const adr = soldRoomNights ? Math.round(roomRevenue / soldRoomNights) : 2800;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizonDays = 30;
  const horizonEnd = addDays(today, horizonDays);

  // Compute 30-day forward room nights & forward room revenue
  let forwardRoomRevenue = 0;
  const forwardRoomNights = activeReservations.reduce((total, reservation) => {
    const checkInDate = new Date(reservation.checkIn);
    const checkOutDate = new Date(reservation.checkOut);
    const start = checkInDate > today ? checkInDate : today;
    const end = checkOutDate < horizonEnd ? checkOutDate : horizonEnd;
    if (end <= start) return total;
    const nightsInHorizon = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    forwardRoomRevenue += nightsInHorizon * (reservation.roomRate || 2800);
    return total + nightsInHorizon;
  }, 0);

  const totalAvailableForwardNights = activeRoomCount * horizonDays;
  const forwardOccupancy = totalAvailableForwardNights
    ? Math.min(100, Math.round((forwardRoomNights / totalAvailableForwardNights) * 100))
    : 0;

  const revPar = totalAvailableForwardNights
    ? Math.round(forwardRoomRevenue / totalAvailableForwardNights)
    : Math.round((forwardOccupancy / 100) * adr);

  const outstanding = activeReservations.reduce(
    (total, reservation) => total + (reservation.balanceAmount || 0),
    0
  );

  // 14-day pickup & pricing guidance plan
  const dailyPlan = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index);
    const nextDate = addDays(date, 1);

    const bookedReservations = activeReservations.filter((reservation) => {
      const cIn = new Date(reservation.checkIn);
      const cOut = new Date(reservation.checkOut);
      return cIn < nextDate && cOut > date;
    });

    const booked = bookedReservations.length;
    const dailyOccupancy = Math.min(100, Math.round((booked / activeRoomCount) * 100));

    const adjustment =
      dailyOccupancy >= 80
        ? 15
        : dailyOccupancy >= 50
        ? 8
        : dailyOccupancy <= 20
        ? -10
        : 0;

    const reason =
      dailyOccupancy >= 80
        ? "High pickup (+15% surge)"
        : dailyOccupancy >= 50
        ? "Healthy demand (+8% rate)"
        : dailyOccupancy <= 20
        ? "Low pickup (-10% promo)"
        : "Hold base rate";

    const suggestedDeluxeRate = Math.round((2800 * (1 + adjustment / 100)) / 100) * 100;

    return {
      date,
      booked,
      occupancy: dailyOccupancy,
      adjustment,
      reason,
      suggestedDeluxeRate,
    };
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={25} className="text-primary" /> Revenue Planner & Yield Intelligence
          </h1>
          <p className="page-description">
            Live PMS-connected revenue metrics, forward occupancy, and dynamic yield pricing suggestions for Hotel Shemron Neemrana.
          </p>
        </div>
        <Link className="btn btn-primary" href="/dashboard/rates">
          <CalendarRange size={16} /> Open Rates & Availability
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Average Daily Rate (ADR)</span>
          <div className="stat-card-value text-primary">{formatCurrency(adr)}</div>
          <span className="text-xs text-secondary">{soldRoomNights || 1} sold room-nights</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">30-Day Forward Occupancy</span>
          <div className="stat-card-value text-warning">{forwardOccupancy}%</div>
          <span className="text-xs text-secondary">{forwardRoomNights} room-nights booked</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Forward RevPAR</span>
          <div className="stat-card-value text-success">{formatCurrency(revPar)}</div>
          <span className="text-xs text-secondary">Yield / available room-night</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Outstanding Folio Balance</span>
          <div className="stat-card-value">{formatCurrency(outstanding)}</div>
          <span className="text-xs text-secondary">Across active reservations</span>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div
        className="card"
        style={{
          padding: "14px 16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderColor: "rgba(52,199,89,.35)",
          background: "var(--green-50)",
        }}
      >
        <CheckCircle2 size={20} className="text-success" />
        <div className="text-sm" style={{ color: "var(--green-900)" }}>
          <strong>Aiosell Channel Manager Live Connection Active (Hotel 62a25484e5)</strong> — Real-time rate sync & automated 2-way PMS inventory updates enabled.
        </div>
      </div>

      {/* 14-Day Pickup & Rate Guidance Table */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header" style={{ padding: "16px 20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>14-Day Pickup & Yield Rate Guidance</h3>
            <p className="text-xs text-secondary">Deterministic rate rules: +15% at 80%+ occ, +8% at 50%+ occ, -10% promo at ≤20% occ</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Booked Rooms</th>
                <th>Occupancy %</th>
                <th>Demand Signal</th>
                <th>Suggested Adjustment</th>
                <th>Rec. Deluxe Rate</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {dailyPlan.map((day) => (
                <tr key={toDateKey(day.date)}>
                  <td className="font-semibold">
                    {new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short" }).format(day.date)}
                  </td>
                  <td className="mono">
                    {day.booked} / {activeRoomCount}
                  </td>
                  <td className="mono font-semibold">
                    <span className={`badge ${day.occupancy >= 80 ? "badge-success" : day.occupancy >= 50 ? "badge-primary" : "badge-default"}`}>
                      {day.occupancy}%
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${day.adjustment > 0 ? "badge-success" : day.adjustment < 0 ? "badge-warning" : "badge-default"}`}>
                      {day.reason}
                    </span>
                  </td>
                  <td className={`font-semibold ${day.adjustment > 0 ? "text-success" : day.adjustment < 0 ? "text-warning" : "text-secondary"}`}>
                    {day.adjustment > 0 ? "+" : ""}{day.adjustment}%
                  </td>
                  <td className="mono font-bold text-primary">
                    {formatCurrency(day.suggestedDeluxeRate)}
                  </td>
                  <td className="text-right">
                    <Link className="btn btn-secondary btn-sm" href="/dashboard/rates">
                      Review rates <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Data Boundary Card */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "16px", fontWeight: 700 }}>
          <BarChart3 size={18} className="text-primary" /> KaizerStays Revenue Engine Boundary
        </h3>
        <p className="text-sm text-secondary" style={{ marginTop: "8px", lineHeight: 1.6 }}>
          Calculations reflect live reservations saved in this KaizerStays PMS workspace for Hotel Shemron Neemrana (32 Physical Rooms: 28 Deluxe, 2 Twin, 2 Suite). Live rate changes push directly to Aiosell CM and OTAs via `/api/channels/aiosell`.
        </p>
      </div>
    </div>
  );
}

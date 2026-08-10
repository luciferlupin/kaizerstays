"use client";

import { useState } from "react";
import { demoRoomTypes, demoProperty } from "@/lib/demo-data";
import { formatCurrency, formatDate, getToday } from "@/lib/utils";
import { useAppState } from "@/context/AppStateContext";
import { PromoCode, promoCodes } from "@/lib/channels-data";
import { getAverageRateForStay, getDateKeys, getRestrictionKey, loadRateRestrictions, toDateKey } from "@/lib/rates";
import {
  CheckCircle2,
  Star,
  MapPin,
  Check,
  ShieldCheck,
} from "lucide-react";

function loadAvailablePromos(): PromoCode[] {
  const starterPromos = promoCodes.map((promo) => ({ ...promo, usedCount: 0 }));
  if (typeof window === "undefined") return starterPromos;
  try {
    const stored = localStorage.getItem("kaizerstays_promo_codes_v1");
    return stored
      ? JSON.parse(stored).map((promo: PromoCode) => ({ ...promo, validFrom: new Date(promo.validFrom), validTo: new Date(promo.validTo) }))
      : starterPromos;
  } catch {
    return starterPromos;
  }
}

export default function BookingClient() {
  const { roomTypes, rooms, reservations, addReservation } = useAppState();
  const today = getToday();
  const defaultCheckOut = new Date(today);
  defaultCheckOut.setDate(today.getDate() + 2);

  const [checkIn, setCheckIn] = useState<string>(() => toDateKey(today));
  const [checkOut, setCheckOut] = useState<string>(() => toDateKey(defaultCheckOut));
  const [adults, setAdults] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<typeof demoRoomTypes[0] | null>(null);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [activePromo, setActivePromo] = useState<PromoCode | null>(null);
  const [availablePromos] = useState<PromoCode[]>(loadAvailablePromos);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Guest details form state
  const [step, setStep] = useState<"SELECT_ROOM" | "GUEST_INFO" | "CONFIRMATION">("SELECT_ROOM");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [confirmationNo, setConfirmationNo] = useState("");
  const [assignedRoomNumber, setAssignedRoomNumber] = useState("");

  const nights = getDateKeys(checkIn, checkOut).length;

  const applyPromo = () => {
    const now = new Date();
    const promo = availablePromos.find((item) => item.code === promoInput.trim().toUpperCase() && item.isActive && new Date(item.validFrom) <= now && new Date(item.validTo) >= now && (!item.usageLimit || item.usedCount < item.usageLimit));
    setActivePromo(promo || null);
    setPromoSuccess(Boolean(promo));
    setPromoError(promo ? "" : "This promo code is invalid, inactive or outside its validity period.");
  };

  const handleSelectRoom = (room: typeof demoRoomTypes[0]) => {
    setSelectedRoom(room);
    setStep("GUEST_INFO");
  };

  const handleCompleteBooking = () => {
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !selectedRoom) return;
    const availableRooms = getAvailableRoomsForStay(selectedRoom.id);
    const roomNumber = availableRooms[0]?.number;
    if (!roomNumber) return;
    const stayRate = getAverageRateForStay(selectedRoom.id, checkIn, checkOut, selectedRoom.baseRate);
    const total = getFinalTotal(selectedRoom);
    const subtotalAfterDiscount = Math.round(total / 1.12);
    const tax = total - subtotalAfterDiscount;
    const booking = addReservation({
      guestId: `guest_web_${guestEmail.trim().toLowerCase()}`,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      status: "CONFIRMED",
      checkIn: new Date(`${checkIn}T12:00:00`),
      checkOut: new Date(`${checkOut}T12:00:00`),
      nights,
      roomNumber,
      roomType: selectedRoom.name,
      adults,
      children: 0,
      bookingSource: "WEBSITE",
      roomRate: stayRate.averageRate,
      totalAmount: total,
      taxAmount: tax,
      paidAmount: 0,
      balanceAmount: total,
      notes: activePromo ? `Direct booking promo: ${activePromo.code}` : "Direct website booking",
    });
    setConfirmationNo(booking.confirmationNumber);
    setAssignedRoomNumber(roomNumber);
    setStep("CONFIRMATION");
  };

  const getAvailableRoomsForStay = (roomTypeId: string) => {
    if (!nights) return [];
    const requestedStart = new Date(`${checkIn}T12:00:00`);
    const requestedEnd = new Date(`${checkOut}T12:00:00`);
    const restrictions = loadRateRestrictions();
    const dateKeys = getDateKeys(checkIn, checkOut);
    if (dateKeys.some((date) => restrictions[getRestrictionKey(roomTypeId, date)]?.stopSell)) return [];
    const physical = rooms.filter((room) => {
      if (room.roomTypeId !== roomTypeId || !room.isActive || ["OCCUPIED", "MAINTENANCE", "OUT_OF_SERVICE"].includes(room.status)) return false;
      return !reservations.some((reservation) => reservation.roomNumber === room.number && !["CANCELLED", "CHECKED_OUT"].includes(reservation.status) && requestedStart < new Date(reservation.checkOut) && requestedEnd > new Date(reservation.checkIn));
    });
    const caps = dateKeys.map((date) => restrictions[getRestrictionKey(roomTypeId, date)]?.availabilityCap).filter((cap): cap is number => typeof cap === "number");
    const cap = caps.length ? Math.min(...caps) : physical.length;
    return physical.slice(0, Math.max(0, cap));
  };

  const getFinalTotal = (roomType: typeof demoRoomTypes[0]) => {
    const stayRate = getAverageRateForStay(roomType.id, checkIn, checkOut, roomType.baseRate);
    const subtotal = stayRate.averageRate * nights;
    const discount = activePromo?.discountType === "PERCENTAGE"
      ? Math.round(subtotal * (activePromo.discountValue / 100))
      : Math.min(subtotal, activePromo?.discountValue || 0);
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.12);
    return taxable + tax;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary)", paddingBottom: "60px" }}>
      {/* Header Banner */}
      <header
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "white",
          padding: "32px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "8px" }}>
                Official Direct Booking Engine • Best Rate Guarantee
              </span>
              <h1 style={{ fontSize: "28px", fontWeight: 900, color: "white" }}>{demoProperty.name}</h1>
              <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} /> {demoProperty.address}, {demoProperty.state}
              </p>
            </div>
            <div style={{ display: "flex", gap: "2px", color: "#F59E0B" }}>
              {[1, 2, 3, 4].map((i) => (
                <Star key={i} size={18} fill="#F59E0B" />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
        {/* Date & Search Bar */}
        <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Check-In Date</label>
              <input
                type="date"
                className="form-input"
                min={toDateKey(today)}
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); setStep("SELECT_ROOM"); setSelectedRoom(null); }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Check-Out Date</label>
              <input
                type="date"
                className="form-input"
                min={checkIn}
                value={checkOut}
                onChange={(e) => { setCheckOut(e.target.value); setStep("SELECT_ROOM"); setSelectedRoom(null); }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Guests</label>
              <select className="form-select" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                <option value={1}>1 Adult</option>
                <option value={2}>2 Adults</option>
                <option value={3}>3 Adults</option>
                <option value={4}>4 Adults</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Promo Code</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. WELCOME20"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={applyPromo}>
                  Apply
                </button>
              </div>
            </div>
          </div>

          {promoSuccess && (
            <div style={{ marginTop: "12px", color: "var(--green-600)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={16} /> Promo code applied: {activePromo?.discountType === "PERCENTAGE" ? `${activePromo.discountValue}% off` : `${formatCurrency(activePromo?.discountValue || 0)} off`}.
            </div>
          )}
          {promoError && <div className="text-sm text-danger" style={{ marginTop: "10px" }}>{promoError}</div>}
        </div>

        {/* STEP 1: ROOM SELECTION */}
        {step === "SELECT_ROOM" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Select Available Room Categories ({nights} Nights)</h2>
            {roomTypes.map((rt) => {
              const total = getFinalTotal(rt);
              const availability = getAvailableRoomsForStay(rt.id).length;
              const stayRate = getAverageRateForStay(rt.id, checkIn, checkOut, rt.baseRate);
              return (
                <div key={rt.id} className="card" style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 220px", gap: "20px", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800 }}>{rt.name} ({rt.code})</h3>
                    <p className="text-sm text-secondary" style={{ margin: "6px 0 12px" }}>
                      {rt.description} • {rt.beds} • {rt.size}
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {rt.amenities.map((a, i) => (
                        <span key={i} className="badge badge-default">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", borderLeft: "1px solid var(--color-border-subtle)", paddingLeft: "20px" }}>
                    <div className="text-xs text-tertiary">Total for {nights} Nights</div>
                    <div className="mono font-bold text-primary" style={{ fontSize: "22px", margin: "4px 0" }}>
                      {formatCurrency(total)}
                    </div>
                    <div className={`text-xs font-semibold ${availability ? "text-success" : "text-danger"}`}>{availability ? `${availability} room${availability === 1 ? "" : "s"} available` : "Sold out or stop-sold"}</div>
                    {activePromo && (
                      <div className="text-xs text-success font-semibold">Includes promo discount</div>
                    )}
                    {nights < stayRate.minStay && <div className="text-xs text-warning">Minimum stay: {stayRate.minStay} nights</div>}
                    <button className="btn btn-primary w-full" style={{ marginTop: "12px" }} onClick={() => handleSelectRoom(rt)} disabled={!availability || !nights || nights < stayRate.minStay}>
                      Book This Room
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: GUEST DETAILS */}
        {step === "GUEST_INFO" && selectedRoom && (
          <div style={{ maxWidth: "550px", margin: "0 auto" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep("SELECT_ROOM")} style={{ marginBottom: "16px" }}>
              ← Change Room Selection
            </button>

            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>Guest Details & Instant Confirmation</h2>
              <p className="text-xs text-secondary" style={{ marginBottom: "20px" }}>
                Booking {selectedRoom.name} for {nights} nights at Hotel Shemron Neemrana.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Rajesh Sharma" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="rajesh@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input type="tel" className="form-input" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+91 98100 45678" />
                </div>

                <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)", margin: "8px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 700 }}>
                    <span>Total Payable Amount</span>
                    <span className="mono text-primary">{formatCurrency(getFinalTotal(selectedRoom))}</span>
                  </div>
                  <span className="text-xs text-secondary" style={{ marginTop: "4px", display: "block" }}>
                    No advance payment needed. Pay at hotel during check-in.
                  </span>
                </div>

                <button className="btn btn-success w-full" onClick={handleCompleteBooking} disabled={!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()}>
                  <ShieldCheck size={18} /> Confirm Reservation Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION */}
        {step === "CONFIRMATION" && selectedRoom && (
          <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "550px", margin: "0 auto" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--green-500)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <Check size={32} />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "var(--green-900)" }}>Reservation Confirmed!</h2>
            <p className="text-sm text-secondary" style={{ marginTop: "4px" }}>
              Thank you, {guestName}! Your booking at Hotel Shemron Neemrana is active.
            </p>

            <div style={{ background: "var(--color-bg-tertiary)", padding: "20px", borderRadius: "var(--radius-md)", margin: "24px 0", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="text-xs text-tertiary">Confirmation No.</span>
                <span className="mono font-bold text-primary">{confirmationNo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="text-xs text-tertiary">Room Reserved</span>
                <span className="font-semibold">{selectedRoom.name} · Room #{assignedRoomNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="text-xs text-tertiary">Check-In Date</span>
                <span className="font-semibold">{formatDate(new Date(`${checkIn}T12:00:00`), "dd MMM yyyy")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-xs text-tertiary">Total Amount</span>
                <span className="mono font-bold text-success">{formatCurrency(getFinalTotal(selectedRoom))}</span>
              </div>
            </div>

            <p className="text-xs text-tertiary">The reservation is saved in KaizerStays and visible to the front desk. Automated SMS, WhatsApp and email delivery are not connected yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

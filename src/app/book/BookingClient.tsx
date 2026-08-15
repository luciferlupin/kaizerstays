"use client";

import { useState } from "react";
import { demoRoomTypes, demoProperty } from "@/lib/demo-data";
import { formatCurrency, formatDate, getToday } from "@/lib/utils";
import {
  HOTEL_ACCOMMODATION_GST_RATE,
  calculateInclusiveHotelGST,
  roundMoney,
} from "@/lib/gst";
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
    const pricing = getRoomPricingDetails(selectedRoom);
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
      roomRate: pricing.nightlyRate,
      totalAmount: pricing.totalInclusive,
      taxAmount: pricing.gstTax,
      paidAmount: 0,
      balanceAmount: pricing.totalInclusive,
      notes: activePromo ? `Direct booking promo: ${activePromo.code}` : "Direct website booking",
    });
    setConfirmationNo(booking.confirmationNumber);
    setAssignedRoomNumber(roomNumber);
    setStep("CONFIRMATION");
  };

  const getAvailableRoomsForStay = (roomTypeId: string) => {
    if (!nights || nights <= 0) return [];
    const requestedStart = new Date(`${checkIn}T12:00:00`);
    const requestedEnd = new Date(`${checkOut}T12:00:00`);
    const restrictions = loadRateRestrictions();
    const dateKeys = getDateKeys(checkIn, checkOut);

    if (dateKeys.some((date) => restrictions[getRestrictionKey(roomTypeId, date)]?.stopSell)) {
      return [];
    }

    const physical = rooms.filter(
      (room) => room.roomTypeId === roomTypeId && room.isActive && !["MAINTENANCE", "OUT_OF_SERVICE"].includes(room.status)
    );

    const activeBookingsCount = reservations.filter((res) => {
      if (["CANCELLED", "CHECKED_OUT"].includes(res.status)) return false;
      const cIn = new Date(res.checkIn);
      const cOut = new Date(res.checkOut);
      if (requestedStart >= cOut || requestedEnd <= cIn) return false;

      if (res.roomNumber) {
        const assignedRoom = rooms.find((r) => r.number === res.roomNumber);
        if (assignedRoom) return assignedRoom.roomTypeId === roomTypeId;
      }
      const rtStr = (res.roomType || "").toLowerCase();
      if (roomTypeId === "twin-room") return rtStr.includes("twin");
      if (roomTypeId === "suite-room") return rtStr.includes("suite");
      return rtStr.includes("deluxe") || (!rtStr.includes("twin") && !rtStr.includes("suite"));
    }).length;

    const caps = dateKeys
      .map((date) => restrictions[getRestrictionKey(roomTypeId, date)]?.availabilityCap)
      .filter((cap): cap is number => typeof cap === "number");

    const cap = caps.length ? Math.min(...caps) : physical.length;
    const netAvailable = Math.max(0, Math.min(cap, physical.length - activeBookingsCount));
    return physical.slice(0, netAvailable);
  };

  const [selectedMealPlan, setSelectedMealPlan] = useState<"EP" | "CP">("EP");

  const getRoomPricingDetails = (roomType: typeof demoRoomTypes[0], plan: "EP" | "CP" = selectedMealPlan) => {
    const pmsType = roomTypes.find((r) => r.id === roomType.id || r.code === roomType.code);
    const liveBaseRate = pmsType?.baseRate || roomType.baseRate;
    const stayRateInfo = getAverageRateForStay(roomType.id, checkIn, checkOut, liveBaseRate);
    const breakfastSupplement = roomType.id === "suite-room" ? 700 : 500;
    const nightlyRate = plan === "CP" ? stayRateInfo.averageRate + breakfastSupplement : stayRateInfo.averageRate;
    const baseSubtotal = nightlyRate * Math.max(1, nights);

    const discount = activePromo?.discountType === "PERCENTAGE"
      ? Math.round(baseSubtotal * (activePromo.discountValue / 100))
      : Math.min(baseSubtotal, activePromo?.discountValue || 0);

    const discountedSubtotal = Math.max(0, baseSubtotal - discount);
    const gstTax = Math.round(discountedSubtotal * 0.05);
    const totalInclusive = discountedSubtotal + gstTax;

    return {
      nightlyRate,
      baseSubtotal,
      discount,
      discountedSubtotal,
      gstTax,
      totalInclusive,
      minStay: stayRateInfo.minStay,
    };
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
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Select Rate Plan (EP vs CP)</h3>
                  <p className="text-xs text-secondary">Every room category offers Room Only (EP) or Breakfast Included (CP)</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedMealPlan === "EP" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setSelectedMealPlan("EP")}
                  >
                    EP — Without Breakfast
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedMealPlan === "CP" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setSelectedMealPlan("CP")}
                  >
                    CP — With Breakfast Included
                  </button>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: 800 }}>
              Available Room Categories ({nights} Nights — {selectedMealPlan === "CP" ? "CP: Breakfast Included" : "EP: Without Breakfast"})
            </h2>
            {roomTypes.map((rt) => {
              const pricing = getRoomPricingDetails(rt);
              const availableRooms = getAvailableRoomsForStay(rt.id);
              const availability = availableRooms.length;
              return (
                <div key={rt.id} className="card" style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 240px", gap: "20px", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 800 }}>{rt.name}</h3>
                      <span className="badge badge-primary">{rt.code}</span>
                    </div>
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
                    <div className="text-xs text-secondary font-semibold">
                      Tariff: {formatCurrency(pricing.discountedSubtotal)} <span className="text-tertiary">({nights} n @ {formatCurrency(pricing.nightlyRate)}/n)</span>
                    </div>
                    <div className="text-xs font-bold" style={{ color: "#0071e3", marginTop: "2px" }}>
                      + GST (5%): <span className="mono">{formatCurrency(pricing.gstTax)}</span>
                    </div>
                    <div className="mono font-bold text-primary" style={{ fontSize: "22px", margin: "4px 0 2px" }}>
                      {formatCurrency(pricing.totalInclusive)}
                    </div>
                    <div className="text-xs text-secondary font-medium" style={{ marginBottom: "6px" }}>
                      Total Payable Amount
                    </div>
                    <div className={`text-xs font-semibold ${availability ? "text-success" : "text-danger"}`}>
                      {availability ? `${availability} room${availability === 1 ? "" : "s"} available` : "Sold out or stop-sold"}
                    </div>
                    {activePromo && (
                      <div className="text-xs text-success font-semibold" style={{ marginTop: "2px" }}>
                        Includes promo discount (-{formatCurrency(pricing.discount)})
                      </div>
                    )}
                    {nights < pricing.minStay && (
                      <div className="text-xs text-warning" style={{ marginTop: "2px" }}>
                        Min stay: {pricing.minStay} nights
                      </div>
                    )}
                    <button
                      className="btn btn-primary w-full"
                      style={{ marginTop: "12px" }}
                      onClick={() => handleSelectRoom(rt)}
                      disabled={!availability || !nights || nights < pricing.minStay}
                    >
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

              {(() => {
                const pricing = getRoomPricingDetails(selectedRoom);
                return (
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
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                        <span className="text-secondary">Base Rate ({nights} Nights @ {formatCurrency(pricing.nightlyRate)}/n)</span>
                        <span className="mono font-semibold">{formatCurrency(pricing.baseSubtotal)}</span>
                      </div>
                      {pricing.discount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--green-600)", marginBottom: "6px" }}>
                          <span>Promo Discount ({activePromo?.code})</span>
                          <span className="mono font-semibold">-{formatCurrency(pricing.discount)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                        <span className="text-secondary">Hotel Accommodation GST (5%)</span>
                        <span className="mono font-semibold">{formatCurrency(pricing.gstTax)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 800, paddingTop: "8px", borderTop: "1px solid var(--color-border-subtle)" }}>
                        <span>Total Payable Amount</span>
                        <span className="mono text-primary">{formatCurrency(pricing.totalInclusive)}</span>
                      </div>
                      <span className="text-xs text-secondary" style={{ marginTop: "6px", display: "block" }}>
                        No advance payment needed; pay at hotel during check-in.
                      </span>
                    </div>

                    <button className="btn btn-success w-full" onClick={handleCompleteBooking} disabled={!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()}>
                      <ShieldCheck size={18} /> Confirm Reservation Now
                    </button>
                  </div>
                );
              })()}
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

            {(() => {
              const pricing = getRoomPricingDetails(selectedRoom);
              return (
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
                    <span className="mono font-bold text-success">{formatCurrency(pricing.totalInclusive)}</span>
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-tertiary">The reservation is saved in KaizerStays and visible to the front desk. Automated SMS, WhatsApp and email delivery are not connected yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

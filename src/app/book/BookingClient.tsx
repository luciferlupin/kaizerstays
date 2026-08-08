"use client";

import { useState } from "react";
import { demoRoomTypes, demoProperty } from "@/lib/demo-data";
import { formatCurrency, formatDate, getToday } from "@/lib/utils";
import {
  Hotel,
  Calendar,
  Users,
  CheckCircle2,
  Tag,
  Star,
  MapPin,
  Check,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export default function BookingClient() {
  const today = getToday();
  const defaultCheckOut = new Date(today);
  defaultCheckOut.setDate(today.getDate() + 2);

  const [checkIn, setCheckIn] = useState<Date>(today);
  const [checkOut, setCheckOut] = useState<Date>(defaultCheckOut);
  const [adults, setAdults] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<typeof demoRoomTypes[0] | null>(null);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoSuccess, setPromoSuccess] = useState(false);

  // Guest details form state
  const [step, setStep] = useState<"SELECT_ROOM" | "GUEST_INFO" | "CONFIRMATION">("SELECT_ROOM");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [confirmationNo, setConfirmationNo] = useState("");

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === "WELCOME20") {
      setDiscountPercent(20);
      setPromoSuccess(true);
    } else if (promoInput.trim().toUpperCase() === "SHEMRON15") {
      setDiscountPercent(15);
      setPromoSuccess(true);
    } else {
      alert("Invalid promo code. Try 'WELCOME20' for 20% discount!");
    }
  };

  const handleSelectRoom = (room: typeof demoRoomTypes[0]) => {
    setSelectedRoom(room);
    setStep("GUEST_INFO");
  };

  const handleCompleteBooking = () => {
    if (!guestName.trim() || !guestEmail.trim()) return;
    const conf = `SS-SHM-${formatDate(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setConfirmationNo(conf);
    setStep("CONFIRMATION");
  };

  const getFinalTotal = (baseRate: number) => {
    const subtotal = baseRate * nights;
    const discount = Math.round(subtotal * (discountPercent / 100));
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
              <h1 style={{ fontSize: "28px", fontWeight: 900 }}>{demoProperty.name}</h1>
              <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} /> {demoProperty.address}, {demoProperty.city}, {demoProperty.state}
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
                value={checkIn.toISOString().split("T")[0]}
                onChange={(e) => setCheckIn(new Date(e.target.value))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Check-Out Date</label>
              <input
                type="date"
                className="form-input"
                value={checkOut.toISOString().split("T")[0]}
                onChange={(e) => setCheckOut(new Date(e.target.value))}
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
              <CheckCircle2 size={16} /> Promo Code Applied! {discountPercent}% Direct Booking Discount Active.
            </div>
          )}
        </div>

        {/* STEP 1: ROOM SELECTION */}
        {step === "SELECT_ROOM" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Select Available Room Categories ({nights} Nights)</h2>
            {demoRoomTypes.map((rt) => {
              const total = getFinalTotal(rt.baseRate);
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
                    {discountPercent > 0 && (
                      <div className="text-xs text-success font-semibold">Includes {discountPercent}% Promo Discount</div>
                    )}
                    <button className="btn btn-primary w-full" style={{ marginTop: "12px" }} onClick={() => handleSelectRoom(rt)}>
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
                    <span className="mono text-primary">{formatCurrency(getFinalTotal(selectedRoom.baseRate))}</span>
                  </div>
                  <span className="text-xs text-secondary" style={{ marginTop: "4px", display: "block" }}>
                    No advance payment needed. Pay at hotel during check-in.
                  </span>
                </div>

                <button className="btn btn-success w-full" onClick={handleCompleteBooking} disabled={!guestName.trim() || !guestEmail.trim()}>
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
                <span className="font-semibold">{selectedRoom.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="text-xs text-tertiary">Check-In Date</span>
                <span className="font-semibold">{formatDate(checkIn, "dd MMM yyyy")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-xs text-tertiary">Total Amount</span>
                <span className="mono font-bold text-success">{formatCurrency(getFinalTotal(selectedRoom.baseRate))}</span>
              </div>
            </div>

            <p className="text-xs text-tertiary">A confirmation SMS & WhatsApp email has been dispatched to {guestPhone}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

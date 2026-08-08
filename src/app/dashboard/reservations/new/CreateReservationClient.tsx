"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, calculateNights, calculateRoomCharges } from "@/lib/utils";
import { Check, ArrowRight, ArrowLeft, Calendar, User, CreditCard, Sparkles, Building } from "lucide-react";

export default function CreateReservationClient() {
  const router = useRouter();
  const { roomTypes, rooms, addReservation } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [checkIn, setCheckIn] = useState<string>("2026-08-08");
  const [checkOut, setCheckOut] = useState<string>("2026-08-11");
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("rt_deluxe");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>("301");

  const [firstName, setFirstName] = useState<string>("Rohan");
  const [lastName, setLastName] = useState<string>("Verma");
  const [email, setEmail] = useState<string>("rohan.verma@gmail.com");
  const [phone, setPhone] = useState<string>("+91 98765 12345");
  const [idType, setIdType] = useState<string>("AADHAAR");
  const [idNumber, setIdNumber] = useState<string>("9876 5432 1098");

  const [bookingSource, setBookingSource] = useState<string>("DIRECT");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [notes, setNotes] = useState<string>("Late arrival expected around 6 PM.");
  const [createdResId, setCreatedResId] = useState<string>("");

  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId) || roomTypes[1];
  const nights = calculateNights(new Date(checkIn), new Date(checkOut));
  const pricing = calculateRoomCharges(selectedRoomType.baseRate, nights, 12);

  const handleComplete = () => {
    const newRes = addReservation({
      guestId: `guest_${Date.now()}`,
      guestName: `${firstName} ${lastName}`,
      status: "CONFIRMED",
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      nights,
      roomNumber: selectedRoomNumber,
      roomType: selectedRoomType.name,
      adults,
      children,
      bookingSource,
      roomRate: selectedRoomType.baseRate,
      totalAmount: pricing.total,
      taxAmount: pricing.tax,
      paidAmount: depositAmount,
      balanceAmount: Math.max(0, pricing.total - depositAmount),
    });

    setCreatedResId(newRes.id);
    setStep(6);
  };

  return (
    <div className="page-content" style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Reservation</h1>
          <p className="page-description">Step {step} of 6 — Guided booking workflow</p>
        </div>
        <Link href="/dashboard/reservations" className="btn btn-ghost">
          Cancel
        </Link>
      </div>

      {/* Stepper Progress Bar */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div className="stepper">
          {[
            { num: 1, label: "Stay" },
            { num: 2, label: "Room" },
            { num: 3, label: "Guest" },
            { num: 4, label: "Source" },
            { num: 5, label: "Payment" },
            { num: 6, label: "Confirmation" },
          ].map((s) => (
            <div
              key={s.num}
              className={`stepper-step ${
                step === s.num ? "active" : step > s.num ? "completed" : ""
              }`}
            >
              <div className="stepper-icon">
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className="stepper-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Stay Details */}
      {step === 1 && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>1. Stay Dates & Guests</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Check-In Date *</label>
              <input type="date" className="form-input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Check-Out Date *</label>
              <input type="date" className="form-input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Adults *</label>
              <select className="form-select" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => (<option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Children</label>
              <select className="form-select" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                {[0, 1, 2, 3].map((n) => (<option key={n} value={n}>{n} Children</option>))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Next: Select Room <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Room Selection */}
      {step === 2 && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>2. Select Room Category & Number</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {roomTypes.map((rt) => (
              <div
                key={rt.id}
                onClick={() => setSelectedRoomTypeId(rt.id)}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: selectedRoomTypeId === rt.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: selectedRoomTypeId === rt.id ? "var(--color-primary-light)" : "white",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700 }}>{rt.name}</div>
                <div className="mono font-bold text-primary" style={{ marginTop: "4px" }}>{formatCurrency(rt.baseRate)}/n</div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Assign Specific Room Number</label>
            <select className="form-select" value={selectedRoomNumber} onChange={(e) => setSelectedRoomNumber(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.number}>
                  Room #{r.number} ({r.typeName}) — {r.status}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Guest Info <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 3: Guest Details */}
      {step === 3 && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>3. Guest Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Next: Source & Notes <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 4: Source & Notes */}
      {step === 4 && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>4. Booking Source & Notes</h3>
          <div className="form-group">
            <label className="form-label">Booking Channel Source</label>
            <select className="form-select" value={bookingSource} onChange={(e) => setBookingSource(e.target.value)}>
              <option value="DIRECT">Direct (Phone / Email)</option>
              <option value="WALK_IN">Walk-In Desk</option>
              <option value="WEBSITE">Direct Website</option>
              <option value="BOOKING_COM">Booking.com</option>
              <option value="MAKEMYTRIP">MakeMyTrip</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Special Requests / Internal Notes</label>
            <textarea className="form-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(5)}>Next: Payment Deposit <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 5: Payment */}
      {step === 5 && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>5. Deposit Settlement</h3>
          <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Tariff ({nights} nights + 12% GST):</span>
              <span className="mono font-bold text-primary">{formatCurrency(pricing.total)}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Advance Deposit Collected (₹)</label>
            <input type="number" className="form-input" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setStep(4)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-success" onClick={handleComplete}>
              Complete Booking & Create Folio <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Confirmation */}
      {step === 6 && (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--green-500)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Check size={32} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Reservation Created Successfully!</h2>
          <p className="text-sm text-secondary" style={{ marginTop: "4px" }}>
            Guest {firstName} {lastName} is confirmed for Room #{selectedRoomNumber}.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={() => router.push(`/dashboard/reservations/${createdResId}`)}>
              View Folio & Details
            </button>
            <button className="btn btn-secondary" onClick={() => router.push("/dashboard/reservations")}>
              Back to Reservations List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

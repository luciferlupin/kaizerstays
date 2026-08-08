"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demoRoomTypes, demoRooms } from "@/lib/demo-data";
import { formatCurrency, calculateNights, calculateRoomCharges, getToday } from "@/lib/utils";
import { Check, ArrowRight, ArrowLeft, Calendar, User, CreditCard, Sparkles, Building } from "lucide-react";

export default function CreateReservationClient() {
  const router = useRouter();
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

  const selectedRoomType = demoRoomTypes.find((rt) => rt.id === selectedRoomTypeId) || demoRoomTypes[1];
  const nights = calculateNights(new Date(checkIn), new Date(checkOut));
  const pricing = calculateRoomCharges(selectedRoomType.baseRate, nights, 12);

  const handleComplete = () => {
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
            { num: 4, label: "Booking" },
            { num: 5, label: "Payment" },
            { num: 6, label: "Confirm" },
          ].map((s, idx) => (
            <div
              key={s.num}
              className={`stepper-step ${
                step === s.num ? "active" : step > s.num ? "completed" : ""
              }`}
            >
              <div className="stepper-number">
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className="stepper-label">{s.label}</span>
              {idx < 5 && <div className="stepper-divider" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card" style={{ padding: "24px" }}>
        
        {/* STEP 1: STAY DETAILS */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3>Step 1: Stay Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Check-In Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-Out Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Adults</label>
                <select
                  className="form-select"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Children</label>
                <select
                  className="form-select"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                >
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                </select>
              </div>
            </div>

            <div className="card" style={{ background: "var(--blue-50)", border: "1px solid var(--blue-100)", padding: "16px" }}>
              <div style={{ fontWeight: 600, color: "var(--blue-800)" }}>
                Stay Summary: {nights} {nights === 1 ? "Night" : "Nights"}
              </div>
              <div className="text-sm text-secondary" style={{ marginTop: "4px" }}>
                Check-in: 02:00 PM | Check-out: 11:00 AM
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Next: Select Room <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ROOM SELECTION */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3>Step 2: Select Room & Rate</h3>

            <div className="form-group">
              <label className="form-label">Room Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {demoRoomTypes.map((rt) => (
                  <div
                    key={rt.id}
                    className={`card ${selectedRoomTypeId === rt.id ? "room-occupied" : ""}`}
                    style={{
                      padding: "16px",
                      cursor: "pointer",
                      border: selectedRoomTypeId === rt.id ? "2px solid var(--blue-600)" : "1px solid var(--color-border)",
                    }}
                    onClick={() => setSelectedRoomTypeId(rt.id)}
                  >
                    <div style={{ fontWeight: 700 }}>{rt.name} ({rt.code})</div>
                    <div className="text-xs text-secondary" style={{ margin: "4px 0" }}>
                      {rt.beds} • Max {rt.maxOccupancy} Guests
                    </div>
                    <div className="mono font-bold text-primary" style={{ fontSize: "16px" }}>
                      {formatCurrency(rt.baseRate)} / night
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Specific Room (Optional)</label>
              <select
                className="form-select"
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
              >
                <option value="">Auto-Assign at Check-in</option>
                {demoRooms
                  .filter((r) => r.roomTypeId === selectedRoomTypeId && r.status === "AVAILABLE")
                  .map((r) => (
                    <option key={r.id} value={r.number}>
                      Room #{r.number} (Floor {r.floor})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Next: Guest Info <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUEST INFORMATION */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3>Step 3: Guest Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Government ID Type</label>
                <select
                  className="form-select"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="PAN">PAN Card</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                Next: Booking Source <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: BOOKING DETAILS */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3>Step 4: Booking Source & Notes</h3>

            <div className="form-group">
              <label className="form-label">Booking Channel / Source</label>
              <select
                className="form-select"
                value={bookingSource}
                onChange={(e) => setBookingSource(e.target.value)}
              >
                <option value="DIRECT">Direct (Phone / Email)</option>
                <option value="WALK_IN">Walk-In</option>
                <option value="WEBSITE">Direct Website</option>
                <option value="BOOKING_COM">Booking.com</option>
                <option value="AGODA">Agoda</option>
                <option value="MAKEMYTRIP">MakeMyTrip</option>
                <option value="EXPEDIA">Expedia</option>
                <option value="CORPORATE">Corporate Booking</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Special Requests & Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(5)}>
                Next: Payment <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PAYMENT & BILLING */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3>Step 5: Billing & Deposit</h3>

            <div className="card" style={{ padding: "16px", background: "var(--gray-50)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Room Charges ({nights} nights × {formatCurrency(selectedRoomType.baseRate)})</span>
                <span className="mono">{formatCurrency(pricing.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Taxes & Service GST (12%)</span>
                <span className="mono">{formatCurrency(pricing.tax)}</span>
              </div>
              <hr style={{ margin: "12px 0", borderColor: "var(--color-border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "16px" }}>
                <span>Total Stay Amount</span>
                <span className="mono text-primary">{formatCurrency(pricing.total)}</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="RAZORPAY">Razorpay Payment Link</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deposit Amount Collected Now (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={() => setStep(4)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-success" onClick={handleComplete}>
                Confirm Booking <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: CONFIRMATION SUCCESS */}
        {step === 6 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--green-50)",
                color: "var(--green-600)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Check size={32} />
            </div>

            <h2>Reservation Created Successfully!</h2>
            <div className="mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--blue-600)", margin: "8px 0 16px" }}>
              KS-IMP-20260808-00130
            </div>

            <p className="text-secondary" style={{ maxWidth: "420px", margin: "0 auto 24px" }}>
              Reservation for <strong>{firstName} {lastName}</strong> has been confirmed. Confirmation details sent via Email & WhatsApp.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link href="/dashboard/reservations" className="btn btn-primary">
                View All Reservations
              </Link>
              <Link href="/dashboard/calendar" className="btn btn-secondary">
                Open Calendar
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

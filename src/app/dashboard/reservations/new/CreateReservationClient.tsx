"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, calculateNights, calculateRoomCharges } from "@/lib/utils";
import { HOTEL_ACCOMMODATION_GST_RATE } from "@/lib/gst";
import { getAverageRateForStay, toDateKey } from "@/lib/rates";
import { Check, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export default function CreateReservationClient() {
  const router = useRouter();
  const { roomTypes, rooms, reservations, addReservation } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [checkIn, setCheckIn] = useState<string>(() => futureDate(1));
  const [checkOut, setCheckOut] = useState<string>(() => futureDate(2));
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(1);

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(() => roomTypes[0]?.id || "");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>("");

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [idType, setIdType] = useState<string>("AADHAAR");
  const [idNumber, setIdNumber] = useState<string>("");

  const [bookingSource, setBookingSource] = useState<string>("DIRECT");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [depositAmount, setDepositAmount] = useState<number | string>(0);
  const [mealPlan, setMealPlan] = useState<"EP" | "CP">("EP");
  const [notes, setNotes] = useState<string>("");
  const [isCorporate, setIsCorporate] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyContact, setCompanyContact] = useState<string>("");
  const [companyGstin, setCompanyGstin] = useState<string>("");
  const [companyAddress, setCompanyAddress] = useState<string>("");
  const [createdResId, setCreatedResId] = useState<string>("");

  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId) || roomTypes[0];
  const nights = calculateNights(new Date(checkIn), new Date(checkOut));
  const stayRate = getAverageRateForStay(selectedRoomType.id, checkIn, checkOut, selectedRoomType.baseRate);
  const breakfastSupplement = selectedRoomTypeId === "suite-room" ? 700 : 500;
  const effectiveNightlyRate = mealPlan === "CP" ? stayRate.averageRate + breakfastSupplement : stayRate.averageRate;
  const pricing = calculateRoomCharges(effectiveNightlyRate * roomsCount, nights);
  const datesValid = Boolean(checkIn && checkOut && new Date(checkOut) > new Date(checkIn));
  const stayAllowed = datesValid && stayRate.blockedDates.length === 0 && nights >= stayRate.minStay;

  const availableRooms = useMemo(() => {
    if (!datesValid) return [];
    const requestedStart = new Date(`${checkIn}T12:00:00`);
    const requestedEnd = new Date(`${checkOut}T12:00:00`);
    return rooms.filter((room) => {
      if (room.roomTypeId !== selectedRoomTypeId || !room.isActive) return false;
      if (["OCCUPIED", "MAINTENANCE", "OUT_OF_SERVICE"].includes(room.status)) return false;
      return !reservations.some((reservation) => {
        if (reservation.roomNumber !== room.number || ["CANCELLED", "CHECKED_OUT"].includes(reservation.status)) return false;
        const existingStart = new Date(reservation.checkIn);
        const existingEnd = new Date(reservation.checkOut);
        return requestedStart < existingEnd && requestedEnd > existingStart;
      });
    });
  }, [checkIn, checkOut, datesValid, reservations, rooms, selectedRoomTypeId]);

  const effectiveSelectedRoomNumber = useMemo(() => {
    const availableNums = availableRooms.map((r) => r.number);
    if (roomsCount > 1) {
      return availableNums.slice(0, roomsCount).join(", ");
    }
    return availableNums.some((num) => num === selectedRoomNumber)
      ? selectedRoomNumber
      : availableNums[0] || "";
  }, [availableRooms, roomsCount, selectedRoomNumber]);

  const handleComplete = () => {
    const newRes = addReservation({
      guestId: `guest_direct_${email.trim().toLowerCase()}`,
      guestName: `${firstName} ${lastName}`,
      status: "CONFIRMED",
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      nights,
      roomsCount,
      roomNumber: effectiveSelectedRoomNumber,
      roomType: `${selectedRoomType.name}${roomsCount > 1 ? ` (${roomsCount} Rooms)` : ""} (${mealPlan})`,
      adults,
      children,
      bookingSource,
      roomRate: effectiveNightlyRate,
      totalAmount: pricing.total,
      taxAmount: pricing.tax,
      paidAmount: Number(depositAmount) || 0,
      balanceAmount: Math.max(0, pricing.total - (Number(depositAmount) || 0)),
      guestEmail: email.trim(),
      guestPhone: phone.trim(),
      guestIdType: idType,
      guestIdNumber: idNumber.trim(),
      notes: `Rooms: ${roomsCount}. Meal Plan: ${mealPlan === "CP" ? "CP (Continental Plan - With Breakfast)" : "EP (European Plan - Without Breakfast / Room Only)"}.${isCorporate && companyName ? ` Company: ${companyName}` : ""} ${notes.trim()}`,
      isCorporate,
      companyName: isCorporate ? companyName.trim() : undefined,
      companyContact: isCorporate ? companyContact.trim() : undefined,
      companyGstin: isCorporate ? companyGstin.trim() : undefined,
      companyAddress: isCorporate ? companyAddress.trim() : undefined,
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
              <input type="date" className="form-input" min={futureDate(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Check-Out Date *</label>
              <input type="date" className="form-input" min={checkIn || futureDate(0)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Number of Rooms *</label>
              <select className="form-select" value={roomsCount} onChange={(e) => setRoomsCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n} Room{n > 1 ? "s" : ""}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Adults *</label>
              <select className="form-select" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (<option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Children</label>
              <select className="form-select" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                {[0, 1, 2, 3, 4].map((n) => (<option key={n} value={n}>{n} Children</option>))}
              </select>
            </div>
          </div>
          {!stayAllowed && (
            <div className="text-sm text-warning" style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px" }}>
              <AlertTriangle size={16} />
              {!datesValid
                ? "Check-out must be after check-in."
                : stayRate.blockedDates.length
                  ? `Selected room type is stop-sold on ${stayRate.blockedDates.join(", ")}.`
                  : `This rate plan requires a minimum stay of ${stayRate.minStay} nights.`}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!stayAllowed}>
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
              <button
                type="button"
                key={rt.id}
                onClick={() => setSelectedRoomTypeId(rt.id)}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: selectedRoomTypeId === rt.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: selectedRoomTypeId === rt.id ? "var(--color-primary-light)" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 700 }}>{rt.name}</div>
                <div className="mono font-bold text-primary" style={{ marginTop: "4px" }}>{formatCurrency(rt.baseRate)}/n</div>
              </button>
            ))}
          </div>

          {/* Rate Plan Selection (EP vs CP) */}
          <div style={{ marginBottom: "20px" }}>
            <label className="form-label font-semibold text-xs text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Rate Plan (EP vs CP)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => setMealPlan("EP")}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: mealPlan === "EP" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: mealPlan === "EP" ? "var(--color-primary-light)" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>EP — European Plan</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>Without Breakfast (Room Only)</div>
                <div className="mono font-bold text-primary" style={{ marginTop: "6px", fontSize: "15px" }}>{formatCurrency(stayRate.averageRate)} / night</div>
              </button>

              <button
                type="button"
                onClick={() => setMealPlan("CP")}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: mealPlan === "CP" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: mealPlan === "CP" ? "var(--color-primary-light)" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>CP — Continental Plan</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>With Breakfast Included</div>
                <div className="mono font-bold text-primary" style={{ marginTop: "6px", fontSize: "15px" }}>{formatCurrency(stayRate.averageRate + (selectedRoomTypeId === "suite-room" ? 700 : 500))} / night</div>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Specific Room Number</label>
            <select className="form-select" value={effectiveSelectedRoomNumber} onChange={(e) => setSelectedRoomNumber(e.target.value)}>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.number}>
                  Room #{r.number} ({r.typeName}) — available
                </option>
              ))}
            </select>
            <div className="text-xs text-secondary" style={{ marginTop: "6px" }}>
              {availableRooms.length} room{availableRooms.length === 1 ? "" : "s"} available for these dates.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!effectiveSelectedRoomNumber}>Next: Guest Info <ArrowRight size={16} /></button>
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
              <label className="form-label">Identity document type</label>
              <select className="form-select" value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option value="AADHAAR">Aadhaar</option><option value="PASSPORT">Passport</option><option value="DRIVING_LICENSE">Driving licence</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Identity document number</label>
              <input type="text" className="form-input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} autoComplete="off" />
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

          {/* Corporate / Company Booking Option */}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>
              <input
                type="checkbox"
                checked={isCorporate}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsCorporate(checked);
                  if (checked && bookingSource !== "CORPORATE") {
                    setBookingSource("CORPORATE");
                  }
                }}
              />
              Guest is from a Company / Corporate Account
            </label>

            {isCorporate && (
              <div style={{ marginTop: "16px", padding: "18px", background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "14px", border: "1px solid var(--color-border)" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Company / Corporate Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tata Consultancy Services Ltd."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ramesh Kumar (HR Manager)"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company GSTIN</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 08AAAAA0000A1Z5"
                      value={companyGstin}
                      onChange={(e) => setCompanyGstin(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Billing Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Cyber City, Phase-2, Gurugram"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)} disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}>Next: Source & Notes <ArrowRight size={16} /></button>
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
              <option value="AGODA">Agoda</option>
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
              <span>Total Tariff ({nights} nights at average {formatCurrency(stayRate.averageRate)}, including {HOTEL_ACCOMMODATION_GST_RATE}% GST):</span>
              <span className="mono font-bold text-primary">{formatCurrency(pricing.total)}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Advance Deposit Collected (₹)</label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={pricing.total}
              value={depositAmount === 0 ? "" : depositAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setDepositAmount("");
                } else {
                  setDepositAmount(Math.min(pricing.total, Math.max(0, Number(val))));
                }
              }}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="UPI">UPI / PhonePe / GPay</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTA_COLLECT">OTA Collect (Pre-paid via OTA)</option>
              <option value="BTC">BTC (Bill To Company / Credit)</option>
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
            Guest {firstName} {lastName} is confirmed for Room #{effectiveSelectedRoomNumber}.
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

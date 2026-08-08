"use client";

import { useState } from "react";
import { demoReservations, demoProperty } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Hotel,
  Wifi,
  Key,
  Receipt,
  MessageSquare,
  Sparkles,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Send,
  Check,
  CreditCard,
  ChevronRight,
  ArrowUpRight,
  Coffee,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export default function GuestPortalClient() {
  const reservation = demoReservations[0]; // Rajesh Sharma demo stay
  const [activeTab, setActiveTab] = useState<"overview" | "folio" | "request" | "upgrade">("overview");

  // Requests state
  const [requestedService, setRequestedService] = useState<string | null>(null);
  const [customRequestText, setCustomRequestText] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  // Payment state
  const [paid, setPaid] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const handleSendRequest = (serviceName: string) => {
    setRequestedService(serviceName);
    setRequestSent(true);
    setTimeout(() => {
      setRequestSent(false);
      setRequestedService(null);
    }, 3000);
  };

  const handlePayBalance = () => {
    setPaid(true);
  };

  const handleUpgradeRoom = () => {
    setUpgraded(true);
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 40px", fontFamily: "var(--font-sans)" }}>
      {/* Mobile Top Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "white",
          borderRadius: "0 0 24px 24px",
          padding: "24px 20px",
          margin: "0 -16px 20px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>
              StaySphere MagicLink™
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0" }}>{demoProperty.name}</h1>
            <p style={{ fontSize: "12px", color: "#CBD5E1", display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={12} /> {demoProperty.city}, {demoProperty.state}
            </p>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "18px",
            }}
          >
            S
          </div>
        </div>
      </div>

      {/* Guest Welcome Card */}
      <div className="card" style={{ padding: "20px", marginBottom: "16px", border: "1px solid var(--color-primary-light)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="badge badge-success" style={{ marginBottom: "8px" }}>
              <CheckCircle2 size={12} style={{ marginRight: "4px" }} /> {reservation.status}
            </span>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Welcome, {reservation.guestName}!</h2>
            <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>
              Confirmation #{reservation.confirmationNumber}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="text-xs text-secondary">Room</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--color-primary)" }}>
              #{reservation.roomNumber}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <div className="text-xs text-tertiary">Check-In</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{formatDate(reservation.checkIn, "dd MMM yyyy")}</div>
            <div className="text-xs text-secondary">2:00 PM</div>
          </div>
          <div>
            <div className="text-xs text-tertiary">Check-Out</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{formatDate(reservation.checkOut, "dd MMM yyyy")}</div>
            <div className="text-xs text-secondary">11:00 AM</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: "16px" }}>
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          Stay Key & WiFi
        </button>
        <button className={`tab ${activeTab === "folio" ? "active" : ""}`} onClick={() => setActiveTab("folio")}>
          Folio & Pay
        </button>
        <button className={`tab ${activeTab === "request" ? "active" : ""}`} onClick={() => setActiveTab("request")}>
          Services
        </button>
        <button className={`tab ${activeTab === "upgrade" ? "active" : ""}`} onClick={() => setActiveTab("upgrade")}>
          Upgrade
        </button>
      </div>

      {/* TAB 1: OVERVIEW & WIFI */}
      {activeTab === "overview" && (
        <div>
          {/* WiFi Card */}
          <div className="card" style={{ padding: "20px", marginBottom: "16px", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", border: "1px solid #BFDBFE" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <Wifi size={24} className="text-primary" />
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>High-Speed Hotel WiFi</h3>
                <p className="text-xs text-secondary">Complimentary guest access</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)", margin: "8px 0" }}>
              <span className="text-xs text-secondary">Network SSID:</span>
              <span className="mono font-bold text-primary">ShemronGuest_WiFi</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)" }}>
              <span className="text-xs text-secondary">Password:</span>
              <span className="mono font-bold text-primary">Shemron2026</span>
            </div>
          </div>

          {/* Digital Key Card */}
          <div className="card" style={{ padding: "20px", marginBottom: "16px", textAlign: "center" }}>
            <Key size={40} className="text-primary" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Mobile Digital Key</h3>
            <p className="text-xs text-secondary" style={{ margin: "4px 0 16px" }}>
              Hold your phone near door lock of Room #{reservation.roomNumber}
            </p>
            <button className="btn btn-primary w-full" onClick={() => alert("Unlocking Room #301 via NFC...")}>
              Unlock Room #{reservation.roomNumber}
            </button>
          </div>

          {/* Hotel Contact Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <a
              href="https://wa.me/911494228800"
              target="_blank"
              rel="noreferrer"
              className="card"
              style={{ padding: "16px", textDecoration: "none", color: "inherit", textAlign: "center" }}
            >
              <MessageSquare size={24} style={{ color: "#25D366", margin: "0 auto 8px" }} />
              <div style={{ fontSize: "14px", fontWeight: 600 }}>WhatsApp Desk</div>
              <div className="text-xs text-tertiary">Instant Help</div>
            </a>

            <a
              href="tel:+911494228800"
              className="card"
              style={{ padding: "16px", textDecoration: "none", color: "inherit", textAlign: "center" }}
            >
              <Phone size={24} className="text-primary" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Call Front Desk</div>
              <div className="text-xs text-tertiary">Dial Ext 0</div>
            </a>
          </div>
        </div>
      )}

      {/* TAB 2: FOLIO & PAY */}
      {activeTab === "folio" && (
        <div>
          <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Room Folio Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span>Deluxe Room (3 Nights x ₹5,500)</span>
                <span className="mono font-semibold">{formatCurrency(16500)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span>GST Tax (12%)</span>
                <span className="mono font-semibold">{formatCurrency(1980)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span>Restaurant Charge (KOT-0045)</span>
                <span className="mono font-semibold">{formatCurrency(840)}</span>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "15px" }}>
                <span>Total Charges</span>
                <span className="mono">{formatCurrency(19320)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--green-600)" }}>
                <span>Advance Paid</span>
                <span className="mono font-semibold">-{formatCurrency(5500)}</span>
              </div>

              {paid && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--green-600)" }}>
                  <span>Online Settlement</span>
                  <span className="mono font-semibold">-{formatCurrency(13820)}</span>
                </div>
              )}

              <div style={{ background: paid ? "var(--green-50)" : "var(--color-primary-light)", padding: "16px", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <span style={{ fontWeight: 700 }}>{paid ? "Balance Cleared" : "Outstanding Balance"}</span>
                <span className="mono" style={{ fontSize: "20px", fontWeight: 800, color: paid ? "var(--green-600)" : "var(--color-primary)" }}>
                  {paid ? formatCurrency(0) : formatCurrency(13820)}
                </span>
              </div>
            </div>

            {!paid ? (
              <button className="btn btn-success w-full" style={{ marginTop: "16px" }} onClick={handlePayBalance}>
                <CreditCard size={16} /> Pay Outstanding Balance via UPI
              </button>
            ) : (
              <div style={{ textAlign: "center", marginTop: "16px", color: "var(--green-600)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <CheckCircle2 size={18} /> Express Checkout Enabled! You can leave key at desk.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES */}
      {activeTab === "request" && (
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>One-Tap Room Service Requests</h3>
          <p className="text-xs text-secondary" style={{ marginBottom: "16px" }}>
            Select items to send directly to Hotel Shemron housekeeping & front desk.
          </p>

          {requestSent && (
            <div style={{ background: "var(--green-50)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--green-700)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <CheckCircle2 size={16} /> Request for "{requestedService}" sent! Staff is on the way.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { name: "Extra Fresh Towels", icon: Sparkles },
              { name: "Room Cleaning", icon: CheckCircle2 },
              { name: "Coffee / Tea Set", icon: Coffee },
              { name: "Water Bottles", icon: Sparkles },
              { name: "Late Checkout Request", icon: Clock },
              { name: "Luggage Pickup", icon: Hotel },
            ].map((s) => (
              <button
                key={s.name}
                className="btn btn-secondary"
                style={{ flexDirection: "column", padding: "16px 12px", height: "auto", gap: "6px" }}
                onClick={() => handleSendRequest(s.name)}
              >
                <s.icon size={20} className="text-primary" />
                <span style={{ fontSize: "12px" }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: UPGRADE OFFER */}
      {activeTab === "upgrade" && (
        <div className="card" style={{ padding: "20px" }}>
          <div className="badge badge-warning" style={{ marginBottom: "8px" }}>
            Exclusive Guest Offer
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Upgrade to Royal Suite</h3>
          <p className="text-xs text-secondary" style={{ margin: "4px 0 16px" }}>
            Enjoy 720 sq ft, private balcony with fort view, jacuzzi, and complimentary breakfast.
          </p>

          <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span className="text-xs text-tertiary">Special Upgrade Rate</span>
              <div className="mono font-bold text-primary" style={{ fontSize: "18px" }}>
                +₹4,000 / night
              </div>
            </div>
            <span className="badge badge-success">3 Suites Available</span>
          </div>

          {!upgraded ? (
            <button className="btn btn-primary w-full" onClick={handleUpgradeRoom}>
              <Sparkles size={16} /> Confirm Room Upgrade Now
            </button>
          ) : (
            <div style={{ background: "var(--green-50)", padding: "16px", borderRadius: "var(--radius-md)", color: "var(--green-800)", textAlign: "center" }}>
              <CheckCircle2 size={24} style={{ margin: "0 auto 8px" }} />
              <h4>Room Upgraded to Royal Suite #501!</h4>
              <p className="text-xs" style={{ marginTop: "4px" }}>Front desk will provide your new room key upon arrival.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

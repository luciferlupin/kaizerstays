"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Hotel,
  Key,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  Sparkles,
  Wifi,
} from "lucide-react";

function loadGuestWifi() {
  if (typeof window === "undefined") return { wifiNetwork: "", wifiPass: "" };
  try {
    const stored = localStorage.getItem("kaizerstays_property_policies_v1");
    const parsed = stored ? JSON.parse(stored) : {};
    return { wifiNetwork: parsed.wifiNetwork || "", wifiPass: parsed.wifiPass || "" };
  } catch {
    return { wifiNetwork: "", wifiPass: "" };
  }
}

export default function GuestPortalClient({ reservationId }: { reservationId: string }) {
  const { reservations, property, addGuestRequest } = useAppState();
  const [activeTab, setActiveTab] = useState<"overview" | "folio" | "request" | "upgrade">("overview");
  const [requestedService, setRequestedService] = useState<string | null>(null);
  const [wifi] = useState(loadGuestWifi);
  const { wifiNetwork, wifiPass } = wifi;
  const [searchVal, setSearchVal] = useState("");
  const cleanId = String(reservationId || "").trim().toLowerCase();

  const matchedRes = reservations.find(
    (item) =>
      item.id === reservationId ||
      item.confirmationNumber === reservationId ||
      item.roomNumber === reservationId ||
      item.id.toLowerCase() === cleanId ||
      (item.confirmationNumber && item.confirmationNumber.toLowerCase() === cleanId) ||
      (item.roomNumber && item.roomNumber.toLowerCase() === cleanId) ||
      (searchVal && (item.roomNumber === searchVal || item.confirmationNumber.toLowerCase().includes(searchVal.toLowerCase())))
  );

  const phoneLink = property.phone ? `tel:${property.phone.replace(/\s/g, "")}` : undefined;
  const whatsappLink = property.phone ? `https://wa.me/${property.phone.replace(/\D/g, "")}` : undefined;

  if (!matchedRes) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px", fontFamily: "var(--font-sans)" }}>
        <div style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "white", borderRadius: "20px", padding: "24px 20px", marginBottom: "20px", textAlign: "center" }}>
          <Hotel size={32} style={{ margin: "0 auto 10px", color: "#60A5FA" }} />
          <h1 style={{ fontSize: "20px", fontWeight: 800 }}>{property.name}</h1>
          <p style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "4px" }}>Guest Self-Service Portal</p>
        </div>

        <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>Look Up Your Stay</h2>
          <p className="text-xs text-secondary" style={{ marginBottom: "14px" }}>
            Enter your Room Number or Booking Confirmation Number below to access your guest stay portal.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 101 or Confirmation #"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding: "20px", marginBottom: "16px", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", border: "1px solid #BFDBFE" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <Wifi size={24} className="text-primary" />
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Hotel Guest Wi-Fi</h3>
              <p className="text-xs text-secondary">Complimentary high-speed Wi-Fi</p>
            </div>
          </div>
          {wifiNetwork ? (
            <div style={{ background: "white", padding: "10px 14px", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
              <span className="text-xs text-secondary">Network:</span>
              <strong className="mono text-primary">{wifiNetwork}</strong>
            </div>
          ) : (
            <p className="text-xs text-secondary">Inquire at Front Desk for Wi-Fi credentials.</p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <a href={whatsappLink} className="card" style={{ padding: "16px", textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <MessageSquare size={24} style={{ color: "#25D366", margin: "0 auto 8px" }} />
            <div style={{ fontSize: "13px", fontWeight: 600 }}>WhatsApp Desk</div>
          </a>
          <a href={phoneLink} className="card" style={{ padding: "16px", textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <Phone size={24} className="text-primary" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Call Front Desk</div>
          </a>
        </div>
      </div>
    );
  }

  const reservation = matchedRes;

  const sendRequest = (serviceName: string) => {
    addGuestRequest({ roomNumber: reservation.roomNumber, guestName: reservation.guestName, type: serviceName.toUpperCase().replaceAll(" ", "_"), description: serviceName });
    setRequestedService(serviceName);
  };
  const folio = reservation.folio || [];
  const balance = reservation.balanceAmount;

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 40px", fontFamily: "var(--font-sans)" }}>
      <div style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "white", borderRadius: "0 0 24px 24px", padding: "24px 20px", margin: "0 -16px 20px", boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>KaizerStays guest stay</div><h1 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0" }}>{property.name}</h1><p style={{ fontSize: "12px", color: "#CBD5E1", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={12} /> {property.city}, {property.state}</p></div>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px" }}>K</div>
        </div>
      </div>

      <div className="card" style={{ padding: "14px", marginBottom: "16px", display: "flex", gap: "9px", borderColor: "rgba(255,149,0,.35)" }}><ShieldAlert size={17} className="text-warning" style={{ flexShrink: 0 }} /><p className="text-xs text-secondary">Preview workspace link. Production use requires an expiring signed token before exposing guest data.</p></div>

      <div className="card" style={{ padding: "20px", marginBottom: "16px", border: "1px solid var(--color-primary-light)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><span className="badge badge-success" style={{ marginBottom: "8px" }}><CheckCircle2 size={12} style={{ marginRight: "4px" }} /> {reservation.status}</span><h2 style={{ fontSize: "18px", fontWeight: 700 }}>Welcome, {reservation.guestName}!</h2><div className="text-xs text-secondary" style={{ marginTop: "4px" }}>Confirmation #{reservation.confirmationNumber}</div></div>
          <div style={{ textAlign: "right" }}><span className="text-xs text-secondary">Room</span><div style={{ fontSize: "24px", fontWeight: 900, color: "var(--color-primary)" }}>#{reservation.roomNumber}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border-subtle)" }}>
          <div><div className="text-xs text-tertiary">Check-In</div><div style={{ fontSize: "13px", fontWeight: 600 }}>{formatDate(reservation.checkIn, "dd MMM yyyy")}</div><div className="text-xs text-secondary">2:00 PM</div></div>
          <div><div className="text-xs text-tertiary">Check-Out</div><div style={{ fontSize: "13px", fontWeight: 600 }}>{formatDate(reservation.checkOut, "dd MMM yyyy")}</div><div className="text-xs text-secondary">11:00 AM</div></div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "16px", overflowX: "auto" }}>
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Stay Info</button>
        <button className={`tab ${activeTab === "folio" ? "active" : ""}`} onClick={() => setActiveTab("folio")}>Folio</button>
        <button className={`tab ${activeTab === "request" ? "active" : ""}`} onClick={() => setActiveTab("request")}>Services</button>
        <button className={`tab ${activeTab === "upgrade" ? "active" : ""}`} onClick={() => setActiveTab("upgrade")}>Upgrade</button>
      </div>

      {activeTab === "overview" && (
        <div>
          <div className="card" style={{ padding: "20px", marginBottom: "16px", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", border: "1px solid #BFDBFE" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}><Wifi size={24} className="text-primary" /><div><h3 style={{ fontSize: "16px", fontWeight: 700 }}>Guest Wi-Fi</h3><p className="text-xs text-secondary">Credentials managed by the hotel</p></div></div>
            {wifiNetwork ? <><div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)", margin: "8px 0" }}><span className="text-xs text-secondary">Network</span><span className="mono font-bold text-primary">{wifiNetwork}</span></div><div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "12px 16px", borderRadius: "var(--radius-md)" }}><span className="text-xs text-secondary">Password</span><span className="mono font-bold text-primary">{wifiPass || "Ask front desk"}</span></div></> : <p className="text-sm text-warning">Wi-Fi credentials have not been published.</p>}
          </div>
          <div className="card" style={{ padding: "20px", marginBottom: "16px", textAlign: "center" }}><Key size={36} className="text-tertiary" style={{ margin: "0 auto 10px" }} /><h3 style={{ fontSize: "16px", fontWeight: 700 }}>Mobile digital key</h3><p className="text-xs text-secondary" style={{ margin: "5px 0 14px" }}>Door-lock integration is not configured for this property.</p><button className="btn btn-secondary w-full" disabled>Digital key unavailable</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <a href={whatsappLink} className="card" style={{ padding: "16px", textDecoration: "none", color: "inherit", textAlign: "center" }}><MessageSquare size={24} style={{ color: "#25D366", margin: "0 auto 8px" }} /><div style={{ fontSize: "14px", fontWeight: 600 }}>WhatsApp desk</div></a>
            <a href={phoneLink} className="card" style={{ padding: "16px", textDecoration: "none", color: "inherit", textAlign: "center" }}><Phone size={24} className="text-primary" style={{ margin: "0 auto 8px" }} /><div style={{ fontSize: "14px", fontWeight: 600 }}>Call front desk</div></a>
          </div>
        </div>
      )}

      {activeTab === "folio" && (
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Room folio</h3>
          {folio.length === 0 ? <p className="text-sm text-secondary">No folio items posted yet.</p> : folio.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "13px" }}><div><div>{item.description}</div><div className="text-xs text-secondary">{formatDate(item.date, "dd MMM yyyy")}</div></div><span className={`mono font-semibold ${item.amount < 0 ? "text-success" : ""}`}>{formatCurrency(item.amount)}</span></div>)}
          <div style={{ marginTop: "16px", background: balance ? "var(--color-primary-light)" : "var(--green-50)", padding: "14px", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>{balance ? "Outstanding balance" : "Paid in full"}</span><span className="mono">{formatCurrency(balance)}</span></div>
          <button className="btn btn-secondary w-full" style={{ marginTop: "14px" }} disabled><CreditCard size={16} /> Online payment not connected</button>
        </div>
      )}

      {activeTab === "request" && (
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "7px" }}>Request a hotel service</h3><p className="text-xs text-secondary" style={{ marginBottom: "16px" }}>Requests are saved directly to the front desk workspace.</p>
          {requestedService && <div style={{ background: "var(--green-50)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--green-700)", fontSize: "13px", display: "flex", gap: "8px", marginBottom: "16px" }}><CheckCircle2 size={16} /> {requestedService} request saved.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>{[
            { name: "Extra Fresh Towels", icon: Sparkles }, { name: "Room Cleaning", icon: CheckCircle2 }, { name: "Coffee / Tea Set", icon: Coffee }, { name: "Water Bottles", icon: Sparkles }, { name: "Late Checkout Request", icon: Clock }, { name: "Luggage Pickup", icon: Hotel },
          ].map((service) => <button key={service.name} className="btn btn-secondary" style={{ flexDirection: "column", padding: "16px 12px", height: "auto", gap: "6px" }} onClick={() => sendRequest(service.name)}><service.icon size={20} className="text-primary" /><span style={{ fontSize: "12px" }}>{service.name}</span></button>)}</div>
        </div>
      )}

      {activeTab === "upgrade" && (
        <div className="card" style={{ padding: "20px" }}><div className="badge badge-info" style={{ marginBottom: "8px" }}>Subject to availability</div><h3 style={{ fontSize: "18px", fontWeight: 800 }}>Request a room upgrade</h3><p className="text-xs text-secondary" style={{ margin: "5px 0 16px" }}>The front desk will check live inventory and confirm any price difference before changing your room.</p>{requestedService === "Room Upgrade" ? <div style={{ background: "var(--green-50)", padding: "14px", borderRadius: "var(--radius-md)", color: "var(--green-800)", textAlign: "center" }}><CheckCircle2 size={22} style={{ margin: "0 auto 7px" }} />Upgrade request saved for front desk review.</div> : <button className="btn btn-primary w-full" onClick={() => sendRequest("Room Upgrade")}><Sparkles size={16} /> Ask front desk for upgrade options</button>}</div>
      )}
    </div>
  );
}

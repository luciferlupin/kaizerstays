"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { Save, Check } from "lucide-react";
import { HOTEL_ACCOMMODATION_GST_RATE } from "@/lib/gst";

const PROPERTY_POLICIES_KEY = "kaizerstays_property_policies_v2";

function loadPolicies() {
  const defaults = { checkInTime: "14:00", checkOutTime: "11:00", taxRate: HOTEL_ACCOMMODATION_GST_RATE, wifiNetwork: "ShemronGuest_WiFi", wifiPass: "" };
  if (typeof window === "undefined") return defaults;
  try {
    const policies = localStorage.getItem(PROPERTY_POLICIES_KEY);
    return policies ? { ...defaults, ...JSON.parse(policies), taxRate: HOTEL_ACCOMMODATION_GST_RATE } : defaults;
  } catch {
    return defaults;
  }
}

export default function SettingsClient() {
  const { property, updatePropertySettings, addActivity } = useAppState();
  const [initialPolicies] = useState(loadPolicies);
  const [checkInTime, setCheckInTime] = useState(initialPolicies.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(initialPolicies.checkOutTime);
  const [taxRate] = useState(initialPolicies.taxRate);
  const [wifiNetwork, setWifiNetwork] = useState(initialPolicies.wifiNetwork);
  const [wifiPass, setWifiPass] = useState(initialPolicies.wifiPass);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(PROPERTY_POLICIES_KEY, JSON.stringify({ checkInTime, checkOutTime, taxRate, wifiNetwork, wifiPass }));
    addActivity("Property Settings Updated", "settings", property.id, "Hotel profile and operating policies were updated");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-content" style={{ maxWidth: "800px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Property Settings</h1>
          <p className="page-description">
            Configure hotel profile, tax rules, check-in policies, and third-party integrations.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Saved Changes!" : "Save Settings"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Hotel Identity */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 className="card-title" style={{ marginBottom: "16px" }}>Hotel Profile & Information</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Hotel Name</label>
              <input type="text" className="form-input" value={property.name} onChange={(e) => updatePropertySettings({ name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" value={property.phone} onChange={(e) => updatePropertySettings({ phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Front Desk Email</label>
                <input type="email" className="form-input" value={property.email} onChange={(e) => updatePropertySettings({ email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address & Location</label>
              <input type="text" className="form-input" value={property.address} onChange={(e) => updatePropertySettings({ address: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GSTIN / Tax ID</label>
                <input type="text" className="form-input" value={property.gstin} onChange={(e) => updatePropertySettings({ gstin: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <input type="text" className="form-input" value="INR (₹)" disabled />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Policies */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 className="card-title" style={{ marginBottom: "16px" }}>Check-In & Policy Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Standard Check-In Time</label>
                <input type="time" className="form-input" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Standard Check-Out Time</label>
                <input type="time" className="form-input" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Hotel Accommodation GST Rate (%)</label>
              <input type="number" className="form-input" value={taxRate} readOnly />
              <span className="form-hint">5% total, split as CGST 2.5% + SGST 2.5%, included in the room rate.</span>
            </div>
          </div>
        </div>

        {/* Guest WiFi */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 className="card-title" style={{ marginBottom: "16px" }}>Guest WiFi Credentials (QR Portal)</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">WiFi SSID / Network</label>
              <input type="text" className="form-input" value={wifiNetwork} onChange={(e) => setWifiNetwork(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">WiFi Password</label>
              <input type="password" className="form-input" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <h3 className="card-title" style={{ marginBottom: "8px" }}>Integration Status</h3>
          <p className="text-sm text-secondary" style={{ marginBottom: "14px" }}>Booking.com and Agoda require approved connectivity. Email, WhatsApp and payment providers are not configured in this browser workspace.</p>
          <Link href="/dashboard/channels" className="btn btn-secondary">Review OTA mapping & connections</Link>
        </div>

      </div>
    </div>
  );
}

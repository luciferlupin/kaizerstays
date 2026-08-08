"use client";

import { useState } from "react";
import { demoProperty } from "@/lib/demo-data";
import { Building, Settings, Save, Check } from "lucide-react";

export default function SettingsClient() {
  const [name, setName] = useState(demoProperty.name);
  const [phone, setPhone] = useState(demoProperty.phone);
  const [email, setEmail] = useState(demoProperty.email);
  const [address, setAddress] = useState(demoProperty.address);
  const [gstin, setGstin] = useState(demoProperty.gstin);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [taxRate, setTaxRate] = useState(12);
  const [wifiNetwork, setWifiNetwork] = useState("ShemronGuest_WiFi");
  const [wifiPass, setWifiPass] = useState("Shemron2026");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
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
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Front Desk Email</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address & Location</label>
              <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GSTIN / Tax ID</label>
                <input type="text" className="form-input" value={gstin} onChange={(e) => setGstin(e.target.value)} />
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
              <label className="form-label">GST Tax Rate (%)</label>
              <input type="number" className="form-input" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
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
              <input type="text" className="form-input" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

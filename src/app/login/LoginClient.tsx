"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { demoProperty } from "@/lib/demo-data";
import {
  Hotel,
  Lock,
  User,
  Crown,
  ConciergeBell,
  Sparkles,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Key,
} from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const { loginUser } = useAppState();
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const userToLogin = customUser || emailOrId;
    const passToLogin = customPass || password;

    if (!userToLogin.trim()) {
      setError(true);
      return;
    }

    setLoading(true);
    const success = loginUser(userToLogin, passToLogin || "12345");
    setLoading(false);

    if (success) {
      if (userToLogin.toLowerCase().includes("house")) {
        router.push("/employee");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(true);
    }
  };

  const handleQuickRole = (roleEmail: string, roleName: string) => {
    setEmailOrId(roleEmail);
    setPassword("12345");
    setError(false);
    if (loginUser(roleEmail, "12345")) {
      router.push(roleName.toLowerCase().includes("house") ? "/employee" : "/dashboard");
    } else {
      setError(true);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "24px",
          padding: "36px 30px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0071E3 0%, #005BB5 100%)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              marginBottom: "14px",
              boxShadow: "0 4px 14px rgba(0, 113, 227, 0.35)",
            }}
          >
            <Building2 size={26} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            KaizerStays OS
          </h1>
          <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>
            <strong>{demoProperty.name}</strong> • Staff & Owner Authentication
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleLogin(e)} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
              Staff ID or Email Address *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ninaad.khera@gmail.com or EMP-101"
                value={emailOrId}
                onChange={(e) => {
                  setEmailOrId(e.target.value);
                  setError(false);
                }}
                style={{ paddingLeft: "36px", borderRadius: "10px" }}
                required
              />
              <User size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#86868B" }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
              Password / Passcode *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                className="form-input"
                placeholder="Enter password (e.g. 12345)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                style={{ paddingLeft: "36px", paddingRight: "36px", borderRadius: "10px" }}
                required
              />
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#86868B" }} />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#86868B",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "var(--red-600)",
                fontSize: "12px",
                textAlign: "center",
                background: "rgba(255, 59, 48, 0.08)",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              Please enter valid credentials to access Hotel Shemron CRM.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{
              marginTop: "4px",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              background: "#0071E3",
              color: "#fff",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 113, 227, 0.3)",
            }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Workspace"} <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Role Access Shortcuts */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "10px", textAlign: "center" }}>
            Preview role access (passcode 12345)
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleQuickRole("Ninaad.khera@gmail.com", "Property Owner")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 113, 227, 0.2)",
                background: "rgba(0, 113, 227, 0.05)",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0071E3",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Crown size={14} /> 👑 Owner &amp; GM
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole("sunil.fd@hotelshemron.com", "Front Desk")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                background: "#FAFAFA",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1D1D1F",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ConciergeBell size={14} /> 🛎️ Front Desk
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole("meena.hk@hotelshemron.com", "Housekeeping")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                background: "#FAFAFA",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1D1D1F",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={14} /> ✨ Housekeeping
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole("arun.kitchen@hotelshemron.com", "Kitchen & POS")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                background: "#FAFAFA",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1D1D1F",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Utensils size={14} /> 🍳 Kitchen &amp; POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

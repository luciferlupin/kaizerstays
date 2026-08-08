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
} from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const { loginUser } = useAppState();
  const [emailOrId, setEmailOrId] = useState("Ninaad.khera@gmail.com");
  const [password, setPassword] = useState("12345");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId.trim()) return;
    setLoading(true);

    const success = loginUser(emailOrId, password);
    setLoading(false);

    if (success) {
      if (emailOrId.toLowerCase().includes("ninaad") || emailOrId.toLowerCase().includes("owner")) {
        router.push("/dashboard/owner");
      } else if (emailOrId.toLowerCase().includes("house")) {
        router.push("/employee");
      } else {
        router.push("/dashboard");
      }
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
          maxWidth: "440px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "32px 28px",
          boxShadow: "0 24px 48px -6px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#0071E3",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 800,
              marginBottom: "12px",
            }}
          >
            S
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#1D1D1F" }}>StaySphere OS</h1>
          <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>
            {demoProperty.name} • Staff & Owner Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Staff ID or Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. EMP-101 or owner@hotelshemron.com"
                value={emailOrId}
                onChange={(e) => {
                  setEmailOrId(e.target.value);
                  setError(false);
                }}
                style={{ paddingLeft: "36px" }}
              />
              <User size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#86868B" }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Passcode / Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                style={{ paddingLeft: "36px" }}
              />
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#86868B" }} />
            </div>
          </div>

          {error && (
            <div style={{ color: "var(--red-600)", fontSize: "13px", textAlign: "center" }}>
              Invalid Staff ID or Password. Please check your credentials.
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: "8px" }}>
            Sign In to Workspace <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

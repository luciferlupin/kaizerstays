"use client";

import { useMemo, useState } from "react";
import { promoCodes, PromoCode } from "@/lib/channels-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAppState } from "@/context/AppStateContext";
import {
  Globe,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Tag,
  X,
  Share2,
  Code2,
} from "lucide-react";
import Link from "next/link";

function loadPromos(): PromoCode[] {
  const starterPromos = promoCodes.map((promo) => ({ ...promo, usedCount: 0 }));
  if (typeof window === "undefined") return starterPromos;
  try {
    const stored = localStorage.getItem("kaizerstays_promo_codes_v1");
    return stored
      ? JSON.parse(stored).map((promo: PromoCode) => ({ ...promo, validFrom: new Date(promo.validFrom), validTo: new Date(promo.validTo) }))
      : starterPromos;
  } catch {
    return starterPromos;
  }
}

export default function BookingEngineClient() {
  const { reservations, addActivity } = useAppState();
  const [promos, setPromos] = useState<PromoCode[]>(loadPromos);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);

  // New Promo state
  const [newCode, setNewCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(15);
  const [saved, setSaved] = useState(false);

  const directUrl = "/book";

  const directReservations = useMemo(
    () => reservations.filter((res) => (res.bookingSource === "WEBSITE" || res.bookingSource === "DIRECT" || res.bookingSource === "WALK_IN" || res.bookingSource === "CORPORATE") && res.status !== "CANCELLED"),
    [reservations]
  );

  const directRevenue = directReservations.reduce((total, res) => total + res.totalAmount, 0);
  const estimatedCommissionSaved = Math.round(directRevenue * 0.18);

  const persistPromos = (nextPromos: PromoCode[]) => {
    setPromos(nextPromos);
    localStorage.setItem("kaizerstays_promo_codes_v1", JSON.stringify(nextPromos));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}${directUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const embedCodeSnippet = `<iframe src="https://kaizerstays.vercel.app/book" width="100%" height="700" frameborder="0" style="border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);"></iframe>`;

  const handleCopyEmbed = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(embedCodeSnippet);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  const handleAddPromo = () => {
    if (!newCode.trim()) return;
    const newP: PromoCode = {
      id: `promo_${Date.now()}`,
      code: newCode.toUpperCase(),
      discountType,
      discountValue,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 86400000),
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    };
    persistPromos([...promos, newP]);
    addActivity("Promo Code Created", "booking_engine", newP.id, `${newP.code} published for direct bookings`);
    setSaved(true);
    setTimeout(() => {
      setShowAddPromo(false);
      setSaved(false);
      setNewCode("");
    }, 1200);
  };

  const togglePromo = (id: string) => {
    const nextPromos = promos.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    persistPromos(nextPromos);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Globe size={24} className="text-primary" />
            Direct Booking Engine & Website Widgets
          </h1>
          <p className="page-description">
            Capture 0% commission direct bookings for Hotel Shemron Neemrana via customizable booking widgets and promo codes.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/book" target="_blank" className="btn btn-secondary">
            <ExternalLink size={16} /> Open Public Booking Page
          </Link>
          <button className="btn btn-primary" onClick={() => setShowAddPromo(true)}>
            <Plus size={16} /> Create Promo Code
          </button>
        </div>
      </div>

      {/* Direct Booking Share Box */}
      <div className="card" style={{ padding: "20px", marginBottom: "24px", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", border: "1px solid #BFDBFE" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Your Commission-Free Booking Engine Link</h3>
            <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
              Embed on www.hotelshemron.com or share in WhatsApp & Instagram bio.
            </p>
            <div className="mono font-bold text-primary" style={{ fontSize: "15px", marginTop: "8px" }}>
              {directUrl}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" onClick={handleCopyLink}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied Link!" : "Copy Direct URL"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Book direct with best rates for Hotel Shemron Neemrana: https://kaizerstays.vercel.app/book")}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success"
            >
              <Share2 size={16} /> WhatsApp Share
            </a>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Direct Bookings</span>
          <div className="stat-card-value text-primary">{directReservations.length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Commission-free reservations</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Direct Revenue</span>
          <div className="stat-card-value text-success">{formatCurrency(directRevenue)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Direct guest transactions</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Est. OTA Commission Saved</span>
          <div className="stat-card-value text-primary">{formatCurrency(estimatedCommissionSaved)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>18% saved vs channel commission</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Active Promo Coupons</span>
          <div className="stat-card-value">{promos.filter((p) => p.isActive).length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Live direct discounts</span>
        </div>
      </div>

      {/* Promo Code Manager */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header" style={{ padding: "16px 20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Direct Booking Promo Coupons & Discounts</h3>
            <p className="text-xs text-secondary">Manage promo codes applicable during direct website checkout</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount</th>
                <th>Valid Until</th>
                <th>Redemptions</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold mono">
                    <span className="badge badge-primary" style={{ fontSize: "13px", padding: "4px 8px" }}>
                      <Tag size={12} style={{ marginRight: "4px" }} /> {p.code}
                    </span>
                  </td>
                  <td className="font-bold text-success">
                    {p.discountType === "PERCENTAGE" ? `${p.discountValue}% OFF` : `Flat ${formatCurrency(p.discountValue)} OFF`}
                  </td>
                  <td className="text-secondary">{formatDate(p.validTo, "dd MMM yyyy")}</td>
                  <td>{p.usedCount} used</td>
                  <td>
                    <span className={`badge ${p.isActive ? "badge-success" : "badge-default"}`}>
                      {p.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-secondary btn-sm" onClick={() => togglePromo(p.id)}>
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Website Embedding Code Snippet Box */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Code2 size={18} className="text-primary" />
              Website Widget iFrame Embed Code
            </h3>
            <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
              Copy and paste this HTML snippet into your hotel website (www.hotelshemron.com) to embed the live booking engine.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyEmbed}>
            {copiedEmbed ? <Check size={14} /> : <Copy size={14} />} {copiedEmbed ? "Copied Snippet!" : "Copy HTML Snippet"}
          </button>
        </div>

        <div style={{ background: "var(--color-bg-tertiary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)", fontFamily: "monospace", fontSize: "12px", color: "var(--color-text-secondary)", overflowX: "auto" }}>
          {embedCodeSnippet}
        </div>
      </div>

      {/* Add Promo Modal */}
      {showAddPromo && (
        <div className="modal-backdrop" onClick={() => setShowAddPromo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Promo Code</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddPromo(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {saved ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Promo Code Created!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    Code <strong>{newCode.toUpperCase()}</strong> is live on direct booking page.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Promo Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MONSOON25"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Discount Type</label>
                      <select
                        className="form-select"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FLAT")}
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat Amount (₹)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Discount Value</label>
                      <input
                        type="number"
                        className="form-input"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {!saved && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddPromo(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddPromo} disabled={!newCode.trim()}>
                  Publish Promo Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { promoCodes, bookingEngineStats, PromoCode } from "@/lib/channels-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Globe,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Percent,
  Tag,
  BarChart3,
  CheckCircle2,
  X,
} from "lucide-react";
import Link from "next/link";

export default function BookingEngineClient() {
  const [promos, setPromos] = useState<PromoCode[]>(promoCodes);
  const [copied, setCopied] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);

  // New Promo state
  const [newCode, setNewCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(15);
  const [saved, setSaved] = useState(false);

  const directUrl = "https://staysphere.app/book/hotel-shemron";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    setPromos([...promos, newP]);
    setSaved(true);
    setTimeout(() => {
      setShowAddPromo(false);
      setSaved(false);
      setNewCode("");
    }, 1200);
  };

  const togglePromo = (id: string) => {
    setPromos(promos.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
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
          <button className="btn btn-primary" onClick={handleCopyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied Link!" : "Copy Direct URL"}
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Direct Bookings This Month</span>
          <div className="stat-card-value text-primary">{bookingEngineStats.directBookings}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>23% of total bookings</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Direct Revenue Saved</span>
          <div className="stat-card-value text-success">{formatCurrency(bookingEngineStats.directRevenue)}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>Saved ₹63,750 in OTA commission</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Website Conversion Rate</span>
          <div className="stat-card-value text-warning">{bookingEngineStats.conversionRate}%</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Industry avg: 2.1%</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Active Promo Coupons</span>
          <div className="stat-card-value">{promos.filter((p) => p.isActive).length}</div>
        </div>
      </div>

      {/* Promo Code Manager */}
      <div className="card">
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
                        onChange={(e) => setDiscountType(e.target.value as any)}
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

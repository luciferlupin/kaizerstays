"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  Download,
  Send,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  X,
  Building2,
  Check,
} from "lucide-react";

export default function InvoicesClient() {
  const { reservations, addPayment } = useAppState();

  const [activeTab, setActiveTab] = useState<"ALL" | "IN_HOUSE" | "POST_CHECKOUT" | "OUTSTANDING">("ALL");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showPostCheckoutModal, setShowPostCheckoutModal] = useState(false);

  // Post checkout billing form state
  const [postResId, setPostResId] = useState(reservations[0]?.id || "res_aio_88219");
  const [chargeDescription, setChargeDescription] = useState("Late Checkout Charge");
  const [chargeAmount, setChargeAmount] = useState<number>(1500);
  const [taxPercent, setTaxPercent] = useState<number>(12);
  const [generatedBill, setGeneratedBill] = useState<any | null>(null);

  // Custom post-checkout bills created in session
  const [customPostCheckoutBills, setCustomPostCheckoutBills] = useState<any[]>([]);

  // System generated invoices list
  const systemInvoices = useMemo(() => {
    return reservations.map((res, idx) => {
      const isCheckedOut = res.status === "CHECKED_OUT";
      const invNum = `INV-2026-${(new Date(res.checkIn).getMonth() + 1).toString().padStart(2, "0")}-${(idx + 101).toString().padStart(5, "0")}`;
      const billNum = `BILL-2026-${(idx + 201).toString().padStart(5, "0")}`;
      return {
        id: `inv_${res.id}`,
        invoiceNumber: invNum,
        billNumber: billNum,
        guestName: res.guestName,
        roomNumber: res.roomNumber || "101",
        amount: res.totalAmount,
        tax: res.taxAmount,
        status: res.balanceAmount === 0 ? "PAID" : "ISSUED",
        date: new Date(res.checkIn),
        resId: res.id,
        isPostCheckout: isCheckedOut,
        reservation: res,
      };
    });
  }, [reservations]);

  const allInvoices = useMemo(() => {
    return [...customPostCheckoutBills, ...systemInvoices];
  }, [customPostCheckoutBills, systemInvoices]);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      if (activeTab === "IN_HOUSE" && inv.isPostCheckout) return false;
      if (activeTab === "POST_CHECKOUT" && !inv.isPostCheckout) return false;
      if (activeTab === "OUTSTANDING" && inv.status === "PAID") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.guestName.toLowerCase().includes(q) ||
          inv.roomNumber.toString().includes(q)
        );
      }
      return true;
    });
  }, [allInvoices, activeTab, search]);

  const handleGeneratePostCheckoutBill = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find((r) => r.id === postResId) || reservations[0];
    const subtotal = Number(chargeAmount) || 0;
    const taxAmt = Math.round((subtotal * (Number(taxPercent) || 12)) / 100);
    const total = subtotal + taxAmt;

    const newBill = {
      id: `inv_post_${Date.now()}`,
      invoiceNumber: `INV-POST-${Math.floor(10000 + Math.random() * 90000)}`,
      billNumber: `BILL-POST-${Math.floor(1000 + Math.random() * 9000)}`,
      guestName: res.guestName,
      roomNumber: res.roomNumber || "101",
      amount: total,
      tax: taxAmt,
      status: "ISSUED",
      date: new Date(),
      resId: res.id,
      isPostCheckout: true,
      description: chargeDescription,
      reservation: res,
    };

    setCustomPostCheckoutBills((prev) => [newBill, ...prev]);
    setSelectedInvoice(newBill);
    setShowPostCheckoutModal(false);
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="text-primary" size={24} />
            Tax Invoices & Billing
          </h1>
          <p className="page-description">
            Generate GST-compliant hotel tax invoices, settlement bills, and post-checkout billing for guests.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowPostCheckoutModal(true)}>
            <Plus size={16} /> Generate Post-Checkout Bill
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${activeTab === "ALL" ? "active" : ""}`} onClick={() => setActiveTab("ALL")}>
              All Invoices ({allInvoices.length})
            </button>
            <button className={`tab ${activeTab === "IN_HOUSE" ? "active" : ""}`} onClick={() => setActiveTab("IN_HOUSE")}>
              In-House Guest Folios ({allInvoices.filter((i) => !i.isPostCheckout).length})
            </button>
            <button className={`tab ${activeTab === "POST_CHECKOUT" ? "active" : ""}`} onClick={() => setActiveTab("POST_CHECKOUT")}>
              Post-Checkout Bills ({allInvoices.filter((i) => i.isPostCheckout).length})
            </button>
            <button className={`tab ${activeTab === "OUTSTANDING" ? "active" : ""}`} onClick={() => setActiveTab("OUTSTANDING")}>
              Outstanding ({allInvoices.filter((i) => i.status !== "PAID").length})
            </button>
          </div>

          <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "260px" }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input text-xs"
              placeholder="Search invoice #, guest, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredInvoices.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <FileText size={38} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Tax Invoices Found</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Tax invoices are generated automatically for reservations and post-checkout settlements.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPostCheckoutModal(true)}>
                <Plus size={14} /> Generate Post-Checkout Bill
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Bill Number</th>
                  <th>Guest Name</th>
                  <th>Room</th>
                  <th>GST Tax (12%/18%)</th>
                  <th>Total Amount</th>
                  <th>Bill Type / Status</th>
                  <th>Issued Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mono font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="mono text-xs text-secondary">{inv.billNumber || "BILL-001"}</td>
                    <td className="font-semibold">{inv.guestName}</td>
                    <td>
                      <span className="badge badge-default">#{inv.roomNumber}</span>
                    </td>
                    <td className="mono text-xs text-tertiary">{formatCurrency(inv.tax)}</td>
                    <td className="mono font-bold text-primary">{formatCurrency(inv.amount)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className={`badge ${inv.status === "PAID" ? "badge-success" : "badge-warning"}`}>
                          {inv.status}
                        </span>
                        {inv.isPostCheckout && (
                          <span className="badge badge-info text-xs">Post-Checkout</span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-secondary">{formatDate(inv.date, "dd MMM yyyy")}</td>
                    <td className="text-right">
                      <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedInvoice(inv)}
                          title="Print Tax Invoice & Bill"
                        >
                          <Printer size={14} /> Print Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal 1: Generate Post-Checkout Bill */}
      {showPostCheckoutModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "520px", padding: "24px", background: "var(--color-bg, #0d0e12)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Generate Post-Checkout Bill & Tax Invoice
              </h2>
              <button type="button" className="btn btn-secondary btn-icon-only btn-sm" onClick={() => setShowPostCheckoutModal(false)}>
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-secondary mb-4">
              Issue an additional bill or tax invoice for a checked-out guest (e.g. Late checkout, minibar, damaged items, or laundry).
            </p>

            <form onSubmit={handleGeneratePostCheckoutBill} className="flex flex-col gap-4">
              <div>
                <label className="form-label text-xs font-semibold">Select Checked-Out / Past Reservation</label>
                <select
                  className="form-control text-sm"
                  value={postResId}
                  onChange={(e) => setPostResId(e.target.value)}
                >
                  {reservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.guestName} ({r.confirmationNumber}) — Room #{r.roomNumber || "101"} [{r.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-xs font-semibold">Post-Checkout Charge Description</label>
                <input
                  type="text"
                  required
                  className="form-control text-sm"
                  placeholder="e.g. Late Checkout Charge / Room Service Bill / Damaged Linen"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs font-semibold">Charge Amount (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control text-sm font-bold"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-semibold">GST Tax Rate</label>
                  <select
                    className="form-control text-sm"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                  >
                    <option value={12}>12% GST (Tariff ≤ ₹7,500)</option>
                    <option value={18}>18% GST (Tariff {">"} ₹7,500)</option>
                    <option value={0}>0% Tax Exempt</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostCheckoutModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Issue Post-Checkout Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Printable GST Tax Invoice & Settlement Bill */}
      {selectedInvoice && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "620px", padding: "24px", background: "#ffffff", color: "#000000", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "2px solid #0f172a", paddingBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0071e3" }}>TAX INVOICE & SETTLEMENT BILL</div>
                <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "2px 0", color: "#0f172a" }}>HOTEL SHEMRON</h2>
                <div style={{ fontSize: "11px", color: "#475569" }}>
                  NH-48, Shahjahanpur, Neemrana, Rajasthan 301705 · GSTIN: 08AAAAH9821K1Z2 · SAC: 9963
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedInvoice(null)}>
                <X size={18} style={{ color: "#000" }} />
              </button>
            </div>

            {/* Bill & Guest Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Invoice Number</span>
                <div style={{ fontWeight: 800, fontSize: "14px", fontFamily: "monospace", color: "#0f172a" }}>{selectedInvoice.invoiceNumber}</div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", marginTop: "4px", display: "block" }}>Bill Number</span>
                <div style={{ fontWeight: 700, fontSize: "12px", fontFamily: "monospace", color: "#475569" }}>{selectedInvoice.billNumber || "BILL-2026-001"}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Billed To Guest</span>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{selectedInvoice.guestName}</div>
                <div style={{ fontSize: "12px", color: "#334155" }}>Room #{selectedInvoice.roomNumber}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Date: {formatDate(selectedInvoice.date, "dd MMM yyyy")}</div>
              </div>
            </div>

            {/* Folio Items Table */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#334155" }}>
                    <th style={{ padding: "8px 12px" }}>Description</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>
                      {selectedInvoice.description || "Room Accommodation Tariff & Guest Services"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                      {formatCurrency(selectedInvoice.amount - selectedInvoice.tax)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>CGST (6% / 9%)</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>
                      {formatCurrency(Math.round(selectedInvoice.tax / 2))}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>SGST (6% / 9%)</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>
                      {formatCurrency(Math.round(selectedInvoice.tax / 2))}
                    </td>
                  </tr>
                  <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
                    <td style={{ padding: "10px 12px", fontSize: "13px" }}>Total Payable Amount</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "16px", color: "#0071e3" }}>
                      {formatCurrency(selectedInvoice.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>
              <div>
                <div>Thank you for staying at Hotel Shemron Neemrana!</div>
                <div>This is a GST compliant Tax Invoice.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ borderBottom: "1px solid #000", width: "120px", marginBottom: "4px" }}></div>
                <div>Authorized Signatory</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Official Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

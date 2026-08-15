"use client";

import { useMemo, useState } from "react";
import { useAppState, type ExtendedReservation } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  HOTEL_ACCOMMODATION_CGST_RATE,
  HOTEL_ACCOMMODATION_GST_RATE,
  HOTEL_ACCOMMODATION_SGST_RATE,
  calculateInclusiveHotelGST,
} from "@/lib/gst";
import {
  FileText,
  Printer,
  Plus,
  Search,
  X,
} from "lucide-react";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  billNumber: string;
  guestName: string;
  roomNumber: string;
  amount: number;
  taxableAmount: number;
  tax: number;
  cgst: number;
  sgst: number;
  status: "PAID" | "ISSUED";
  date: Date;
  resId: string;
  isPostCheckout: boolean;
  description?: string;
  reservation: ExtendedReservation;
  gstin?: string;
  roomType?: string;
}

const formatInvoiceCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function InvoicesClient() {
  const { reservations, property } = useAppState();

  const [activeTab, setActiveTab] = useState<"ALL" | "IN_HOUSE" | "POST_CHECKOUT" | "OUTSTANDING">("ALL");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [showPostCheckoutModal, setShowPostCheckoutModal] = useState(false);

  // Post checkout billing form state
  const [postResId, setPostResId] = useState(reservations[0]?.id || "");
  const [chargeDescription, setChargeDescription] = useState("Late Checkout Charge");
  const [chargeAmount, setChargeAmount] = useState<number | string>(1500);
  // Custom post-checkout bills created in session
  const [customPostCheckoutBills, setCustomPostCheckoutBills] = useState<InvoiceRecord[]>([]);

  // System generated invoices list
  const systemInvoices = useMemo<InvoiceRecord[]>(() => {
    return reservations.map((res, idx) => {
      const isCheckedOut = res.status === "CHECKED_OUT";
      const gst = calculateInclusiveHotelGST(res.totalAmount);
      const invNum = `INV-2026-${(new Date(res.checkIn).getMonth() + 1).toString().padStart(2, "0")}-${(idx + 101).toString().padStart(5, "0")}`;
      const billNum = `BILL-2026-${(idx + 201).toString().padStart(5, "0")}`;
      return {
        id: `inv_${res.id}`,
        invoiceNumber: invNum,
        billNumber: billNum,
        guestName: res.guestName,
        roomNumber: res.roomNumber || "101",
        amount: gst.totalInclusive,
        taxableAmount: gst.taxableValue,
        tax: gst.totalTax,
        cgst: gst.cgst,
        sgst: gst.sgst,
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
    if (!res) return;
    const safeAmount = Number(chargeAmount) || 0;
    const gst = calculateInclusiveHotelGST(safeAmount);

    const newBill: InvoiceRecord = {
      id: `inv_post_${Date.now()}`,
      invoiceNumber: `INV-POST-${Math.floor(10000 + Math.random() * 90000)}`,
      billNumber: `BILL-POST-${Math.floor(1000 + Math.random() * 9000)}`,
      guestName: res.guestName,
      roomNumber: res.roomNumber || "101",
      amount: gst.totalInclusive,
      taxableAmount: gst.taxableValue,
      tax: gst.totalTax,
      cgst: gst.cgst,
      sgst: gst.sgst,
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
                  <th>GST Included ({HOTEL_ACCOMMODATION_GST_RATE}%)</th>
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
                  <label className="form-label text-xs font-semibold">Charge Amount (₹, GST inclusive)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control text-sm font-bold"
                    value={chargeAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setChargeAmount(val === "" ? "" : Number(val));
                    }}
                    placeholder="Enter amount (₹)"
                  />
                </div>

                <div>
                  <span className="form-label text-xs font-semibold">Hotel Accommodation GST</span>
                  <div className="form-control text-sm" style={{ display: "flex", alignItems: "center" }}>
                    {HOTEL_ACCOMMODATION_GST_RATE}% included · CGST {HOTEL_ACCOMMODATION_CGST_RATE}% + SGST {HOTEL_ACCOMMODATION_SGST_RATE}%
                  </div>
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

      {/* Modal 2: Printable GST Tax Invoice & Settlement Bill (Exact Hotel Shemron Format) */}
      {selectedInvoice && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="card modal-card" style={{ width: "100%", maxWidth: "780px", padding: "28px 32px", background: "#ffffff", color: "#000000", borderRadius: "8px", border: "1px solid #000000", fontFamily: "sans-serif" }}>
            {/* HOTEL SHEMRON Header */}
            <div style={{ textAlign: "center", marginBottom: "10px", borderBottom: "1px solid #000000", paddingBottom: "10px", position: "relative" }}>
              <button type="button" className="btn btn-ghost btn-sm no-print" style={{ position: "absolute", top: "0", right: "0" }} onClick={() => setSelectedInvoice(null)}>
                <X size={20} style={{ color: "#000" }} />
              </button>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#000", margin: "0 0 2px", textTransform: "none" }}>Hotel Shemron</h2>
              <div style={{ fontSize: "11px", color: "#111", lineHeight: "1.4" }}>
                Motel No 1, RIICO Industrial Area Sahjahanpur<br />
                District Alwar-301706<br />
                Alwar<br />
                Email: gauravsharma86401@yahoo.com<br />
                <strong style={{ fontSize: "12px" }}>GSTIN : 08AAPCS3946P1ZD</strong>
              </div>
            </div>

            {/* Sub-Header Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: "13px", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "8px" }}>
              <span>TAX INVOICE</span>
              <span>Bill Date : {formatDate(selectedInvoice.date, "dd/MM/yyyy")}</span>
            </div>

            {/* 3-Column Detailed Information Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.1fr", gap: "10px", fontSize: "11px", borderBottom: "1px solid #000", paddingBottom: "8px", marginBottom: "10px", lineHeight: "1.6" }}>
              <div>
                <div><strong>Company Name &amp; Address</strong> : {selectedInvoice.reservation?.companyName || "N/A"}</div>
                {selectedInvoice.reservation?.companyAddress && <div style={{ fontSize: "10px", color: "#333", paddingLeft: "8px" }}>{selectedInvoice.reservation.companyAddress}</div>}
                <div style={{ marginTop: "4px" }}><strong>Guest Name</strong> : {selectedInvoice.guestName}</div>
                <div><strong>Email</strong> : {selectedInvoice.reservation?.guestEmail || ""}</div>
                <div><strong>GSTIN No.</strong> : {selectedInvoice.reservation?.companyGstin || selectedInvoice.gstin || ""}</div>
              </div>

              <div>
                <div><strong>Bill No.</strong> : {selectedInvoice.billNumber || selectedInvoice.invoiceNumber}</div>
                <div><strong>Room No.</strong> : {selectedInvoice.roomNumber}</div>
                <div><strong>Tariff</strong> : {selectedInvoice.taxableAmount?.toFixed(2)}</div>
                <div><strong>Meal Plan</strong> : {selectedInvoice.reservation?.roomType?.includes("CP") ? "CP" : "EP"}</div>
                <div><strong>Age</strong> : 0</div>
                <div><strong>Mobile</strong> : {selectedInvoice.reservation?.guestPhone || ""}</div>
                <div><strong>Reg. No.</strong> : G2652</div>
                <div><strong>State Code</strong> : 08</div>
              </div>

              <div>
                <div><strong>Arr. Date</strong> : {formatDate(selectedInvoice.reservation?.checkIn, "dd/MM/yyyy")}</div>
                <div><strong>Arr. Time</strong> : 12:00 pm</div>
                <div><strong>Dep. Date</strong> : {formatDate(selectedInvoice.reservation?.checkOut, "dd/MM/yyyy")}</div>
                <div><strong>Dep. Time</strong> : 11:00 am</div>
                <div><strong>Pax</strong> : Adult- {selectedInvoice.reservation?.adults || 1} / {selectedInvoice.reservation?.children || 0}</div>
                <div><strong>Tot. Room No</strong> : 1</div>
                <div><strong>Nationality</strong> : INDIAN</div>
                <div><strong>Room Type</strong> : {(selectedInvoice.roomType || selectedInvoice.reservation?.roomType || "DELUXE").toUpperCase()}</div>
              </div>
            </div>

            {/* Tariff Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", textAlign: "center", marginBottom: "10px", border: "1px solid #000" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000", fontWeight: 700 }}>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>Date</th>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>ROOM RENT</th>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>E.BED</th>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>FOOD</th>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>LAUNDRY</th>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>MISC</th>
                  <th style={{ borderRight: "1px solid #000", padding: "4px" }}>TAXI</th>
                  <th style={{ padding: "4px" }}>Total</th>
                </tr>
                <tr style={{ borderBottom: "1px solid #000", fontWeight: 700, fontSize: "9px" }}>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}>HSN/SAC</th>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}>996311</th>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}></th>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}>996332</th>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}>999719</th>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}>996329</th>
                  <th style={{ borderRight: "1px solid #000", padding: "2px" }}>996414</th>
                  <th style={{ padding: "2px" }}></th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>{formatDate(selectedInvoice.reservation?.checkIn, "dd/MM/yyyy")}</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>{selectedInvoice.taxableAmount?.toFixed(2)}</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ padding: "4px" }}>{selectedInvoice.taxableAmount?.toFixed(2)}</td>
                </tr>
                <tr style={{ fontWeight: 700 }}>
                  <td style={{ borderRight: "1px solid #000", padding: "4px", textAlign: "left" }}>Total :</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>{selectedInvoice.taxableAmount?.toFixed(2)}</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ borderRight: "1px solid #000", padding: "4px" }}>0.00</td>
                  <td style={{ padding: "4px" }}>{selectedInvoice.taxableAmount?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Tax & Breakdown summary right-aligned */}
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "11px", marginBottom: "10px" }}>
              <div style={{ width: "240px", lineHeight: "1.6" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>CGST@2.5%</span>
                  <span>: {selectedInvoice.cgst?.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>SGST@2.5%</span>
                  <span>: {selectedInvoice.sgst?.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                  <span>Total</span>
                  <span>: {selectedInvoice.amount?.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Currently Settled</span>
                  <span>: {selectedInvoice.status === "PAID" ? selectedInvoice.amount?.toFixed(2) : "0.00"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, marginTop: "2px" }}>
                  <span>Net Due</span>
                  <span>: {selectedInvoice.status === "PAID" ? "0.00" : selectedInvoice.amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Receipt Information Table */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textDecoration: "underline", marginBottom: "3px" }}>Receipt Information</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid #000", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #000", background: "#f8fafc" }}>
                    <th style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>Date</th>
                    <th style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>ReceiptNo</th>
                    <th style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>Rec / Ref</th>
                    <th style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>Settlement Mode</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Receipt Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>{formatDate(selectedInvoice.date, "dd/MM/yyyy")}</td>
                    <td style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>R2444</td>
                    <td style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>Receipt</td>
                    <td style={{ padding: "3px 6px", borderRight: "1px solid #000" }}>UPI</td>
                    <td style={{ padding: "3px 6px", textAlign: "right" }}>{selectedInvoice.amount?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer and Signatures */}
            <div style={{ fontSize: "11px", marginTop: "14px" }}>
              <div style={{ fontWeight: 600, marginBottom: "26px" }}>Please make Cheque in favour of HOTEL SHEMRON</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>( Guest Signature )</div>
                <div style={{ textAlign: "right" }}>
                  <div>For HOTEL SHEMRON</div>
                  <div style={{ marginTop: "20px" }}>Authorised Signatory</div>
                </div>
              </div>
              <div style={{ textAlign: "right", marginTop: "8px", fontSize: "10px", color: "#666" }}>Page 1 of 1</div>
            </div>

            <div className="flex items-center justify-end gap-2 no-print" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "14px" }}>
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

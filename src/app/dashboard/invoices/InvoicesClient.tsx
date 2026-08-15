"use client";

import { useMemo, useState } from "react";
import { useAppState, type ExtendedReservation } from "@/context/AppStateContext";
import { formatDate } from "@/lib/utils";
import { calculateInclusiveHotelGST } from "@/lib/gst";
import { FileText, Printer, Plus, Search, X } from "lucide-react";

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
      {/* Inject Professional Print & Responsive Modal CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-area, #printable-invoice-area * {
            visibility: visible !important;
          }
          #printable-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="text-primary" size={24} />
            Tax Invoices &amp; Billing
          </h1>
          <p className="page-description">
            Official GST Tax Invoices, Guest Settlement Bills &amp; Post-Checkout Charges.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowPostCheckoutModal(true)}
          >
            <Plus size={16} /> Issue Post-Checkout Charge
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Total Invoices Issued</span>
          <div className="stat-card-value text-primary">{allInvoices.length}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            In-House &amp; Checked-Out Folios
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Settled (Paid) Invoices</span>
          <div className="stat-card-value text-success">
            {allInvoices.filter((i) => i.status === "PAID").length}
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            Zero Folio Balance
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Outstanding Balances</span>
          <div className="stat-card-value text-warning">
            {allInvoices.filter((i) => i.status === "ISSUED").length}
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            Pending Front Desk Collection
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">GST Tax Compliance</span>
          <div className="stat-card-value text-success">5% Inclusive</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            CGST 2.5% + SGST 2.5%
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div className="tabs" style={{ margin: 0 }}>
          <button
            type="button"
            className={`tab ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All Bills ({allInvoices.length})
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "IN_HOUSE" ? "active" : ""}`}
            onClick={() => setActiveTab("IN_HOUSE")}
          >
            In-House Guests
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "POST_CHECKOUT" ? "active" : ""}`}
            onClick={() => setActiveTab("POST_CHECKOUT")}
          >
            Post-Checkout Charges
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "OUTSTANDING" ? "active" : ""}`}
            onClick={() => setActiveTab("OUTSTANDING")}
          >
            Outstanding Balance
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "240px" }}>
          <div className="search-box" style={{ width: "100%", position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by invoice # or guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "32px", fontSize: "13px" }}
            />
          </div>
        </div>
      </div>

      {/* Main Invoices Data Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill / Invoice #</th>
                <th>Guest &amp; Room</th>
                <th>Stay Date</th>
                <th>Bill Type</th>
                <th>Status</th>
                <th className="text-right">Taxable Tariff</th>
                <th className="text-right">GST (5%)</th>
                <th className="text-right">Total Amount</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div className="font-bold text-primary">{inv.billNumber}</div>
                    <div className="text-xs text-tertiary mono">{inv.invoiceNumber}</div>
                  </td>
                  <td>
                    <div className="font-bold">{inv.guestName}</div>
                    <div className="text-xs text-secondary">
                      Room #{inv.roomNumber} ({inv.reservation?.roomType || "Deluxe"})
                    </div>
                  </td>
                  <td className="text-sm text-secondary">
                    {formatDate(inv.date, "dd MMM yyyy")}
                  </td>
                  <td>
                    {inv.isPostCheckout ? (
                      <span className="badge badge-warning text-xs">Post-Checkout</span>
                    ) : (
                      <span className="badge badge-info text-xs">Stay Folio</span>
                    )}
                  </td>
                  <td>
                    {inv.status === "PAID" ? (
                      <span className="badge badge-success font-bold text-xs">Paid / Settled</span>
                    ) : (
                      <span className="badge badge-warning font-bold text-xs">Issued (Unpaid)</span>
                    )}
                  </td>
                  <td className="text-right mono">{formatInvoiceCurrency(inv.taxableAmount)}</td>
                  <td className="text-right mono text-xs text-secondary">
                    {formatInvoiceCurrency(inv.tax)}
                  </td>
                  <td className="text-right mono font-bold" style={{ fontSize: "14px" }}>
                    {formatInvoiceCurrency(inv.amount)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <Printer size={13} /> View &amp; Print Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Post-Checkout Billing Form */}
      {showPostCheckoutModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div className="card modal-card" style={{ width: "100%", maxWidth: "520px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Issue Post-Checkout Bill</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPostCheckoutModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGeneratePostCheckoutBill}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Select Guest Reservation</label>
                <select
                  className="form-control"
                  value={postResId}
                  onChange={(e) => setPostResId(e.target.value)}
                >
                  {reservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.guestName} — Room #{r.roomNumber || "101"} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Post-Checkout Charge Description</label>
                <input
                  type="text"
                  className="form-control"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  placeholder="e.g. Minibar Consumption, Late Departure Fee, Damage Settlement"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label">Total Amount (₹ IN_GST Included)</label>
                <input
                  type="number"
                  className="form-control"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  min={1}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPostCheckoutModal(false)}
                >
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

      {/* Modal 2: Professional Printable GST Tax Invoice (Fully Responsive Screen & High-Resolution A4 Print) */}
      {selectedInvoice && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="card modal-card"
            style={{
              width: "100%",
              maxWidth: "840px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              color: "#000000",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid #94a3b8",
              overflow: "hidden",
            }}
          >
            {/* Modal Screen Top Bar (Fixed) */}
            <div
              className="no-print"
              style={{
                padding: "14px 24px",
                background: "#0f172a",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={20} className="text-blue-400" />
                <span style={{ fontWeight: 700, fontSize: "16px" }}>
                  Official Tax Invoice &amp; Settlement Bill Preview
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-white"
                onClick={() => setSelectedInvoice(null)}
                style={{ color: "#ffffff" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Invoice Printable Area */}
            <div
              id="printable-invoice-area"
              className="printable-invoice-content"
              style={{
                padding: "24px 32px",
                overflowY: "auto",
                flex: 1,
                fontFamily: "var(--font-sans), 'Segoe UI', Arial, sans-serif",
                background: "#ffffff",
                color: "#000000",
              }}
            >
              {/* Hotel Shemron Title Header */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "14px",
                  borderBottom: "2px solid #0f172a",
                  paddingBottom: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "26px",
                    fontWeight: 900,
                    color: "#000000",
                    margin: "0 0 4px 0",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Hotel Shemron
                </h2>
                <div style={{ fontSize: "12px", color: "#1e293b", lineHeight: "1.5", fontWeight: 500 }}>
                  Motel No 1, RIICO Industrial Area Sahjahanpur<br />
                  District Alwar-301706, Rajasthan<br />
                  <strong style={{ fontSize: "13px", color: "#000000", fontWeight: 800 }}>
                    GSTIN : 08AAPCS3946P1ZD
                  </strong>
                </div>
              </div>

              {/* Sub-Header Banner Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#1e293b",
                  color: "#ffffff",
                  padding: "6px 14px",
                  fontWeight: 800,
                  fontSize: "14px",
                  borderRadius: "4px",
                  marginBottom: "12px",
                }}
              >
                <span>TAX INVOICE / GUEST SETTLEMENT BILL</span>
                <span>Bill Date : {formatDate(selectedInvoice.date, "dd/MM/yyyy")}</span>
              </div>

              {/* 3-Column Detailed Information Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1.1fr",
                  gap: "14px",
                  fontSize: "12px",
                  borderBottom: "1.5px solid #000000",
                  paddingBottom: "12px",
                  marginBottom: "14px",
                  lineHeight: "1.7",
                }}
              >
                <div>
                  <div>
                    <strong>Company Name &amp; Address</strong> :{" "}
                    {selectedInvoice.reservation?.companyName || "N/A"}
                  </div>
                  {selectedInvoice.reservation?.companyAddress && (
                    <div style={{ fontSize: "11px", color: "#334155", paddingLeft: "8px" }}>
                      {selectedInvoice.reservation.companyAddress}
                    </div>
                  )}
                  <div style={{ marginTop: "4px" }}>
                    <strong>Guest Name</strong> : <span style={{ fontWeight: 800, fontSize: "13px" }}>{selectedInvoice.guestName}</span>
                  </div>
                  <div>
                    <strong>GSTIN No.</strong> :{" "}
                    {selectedInvoice.reservation?.companyGstin || selectedInvoice.gstin || "N/A"}
                  </div>
                </div>

                <div>
                  <div>
                    <strong>Bill No.</strong> :{" "}
                    <span className="mono" style={{ fontWeight: 800 }}>
                      {selectedInvoice.billNumber || selectedInvoice.invoiceNumber}
                    </span>
                  </div>
                  <div>
                    <strong>Room No.</strong> :{" "}
                    <span style={{ fontWeight: 800 }}>Room #{selectedInvoice.roomNumber}</span>
                  </div>
                  <div>
                    <strong>Tariff</strong> : ₹{selectedInvoice.taxableAmount?.toFixed(2)}
                  </div>
                  <div>
                    <strong>Meal Plan</strong> :{" "}
                    {selectedInvoice.reservation?.roomType?.includes("CP") ? "CP (Breakfast Included)" : "EP (Room Only)"}
                  </div>
                  <div>
                    <strong>Mobile</strong> : {selectedInvoice.reservation?.guestPhone || "N/A"}
                  </div>
                  <div>
                    <strong>Reg. No.</strong> : G2652
                  </div>
                  <div>
                    <strong>State Code</strong> : 08 (Rajasthan)
                  </div>
                </div>

                <div>
                  <div>
                    <strong>Arr. Date</strong> : {formatDate(selectedInvoice.reservation?.checkIn, "dd/MM/yyyy")}
                  </div>
                  <div>
                    <strong>Arr. Time</strong> : 12:00 PM
                  </div>
                  <div>
                    <strong>Dep. Date</strong> : {formatDate(selectedInvoice.reservation?.checkOut, "dd/MM/yyyy")}
                  </div>
                  <div>
                    <strong>Dep. Time</strong> : 11:00 AM
                  </div>
                  <div>
                    <strong>Pax</strong> : Adult- {selectedInvoice.reservation?.adults || 1} / Child-{" "}
                    {selectedInvoice.reservation?.children || 0}
                  </div>
                  <div>
                    <strong>Tot. Room No</strong> : 1
                  </div>
                  <div>
                    <strong>Nationality</strong> : INDIAN
                  </div>
                  <div>
                    <strong>Room Type</strong> :{" "}
                    {(selectedInvoice.roomType || selectedInvoice.reservation?.roomType || "DELUXE").toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Tariff Itemization Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                  textAlign: "center",
                  marginBottom: "14px",
                  border: "1px solid #000000",
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #000000", fontWeight: 800 }}>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>Date</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>ROOM RENT</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>E.BED</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>FOOD</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>LAUNDRY</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>MISC</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>TAXI</th>
                    <th style={{ padding: "6px 8px" }}>Total</th>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #000000", fontWeight: 700, fontSize: "10px", background: "#f8fafc" }}>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}>HSN/SAC</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}>996311</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}></th>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}>996332</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}>999719</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}>996329</th>
                    <th style={{ borderRight: "1px solid #000000", padding: "4px" }}>996414</th>
                    <th style={{ padding: "4px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #000000" }}>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>
                      {formatDate(selectedInvoice.reservation?.checkIn, "dd/MM/yyyy")}
                    </td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>
                      {selectedInvoice.taxableAmount?.toFixed(2)}
                    </td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ padding: "6px 8px" }}>{selectedInvoice.taxableAmount?.toFixed(2)}</td>
                  </tr>
                  <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px", textAlign: "left" }}>
                      Total :
                    </td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>
                      {selectedInvoice.taxableAmount?.toFixed(2)}
                    </td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ borderRight: "1px solid #000000", padding: "6px 8px" }}>0.00</td>
                    <td style={{ padding: "6px 8px" }}>{selectedInvoice.taxableAmount?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tax & Breakdown Summary */}
              <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "12px", marginBottom: "14px" }}>
                <div style={{ width: "260px", lineHeight: "1.7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>CGST@2.5%</span>
                    <span className="mono">: ₹{selectedInvoice.cgst?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>SGST@2.5%</span>
                    <span className="mono">: ₹{selectedInvoice.sgst?.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 900,
                      fontSize: "14px",
                      borderTop: "1px dashed #000",
                      paddingTop: "4px",
                    }}
                  >
                    <span>Total Inclusive</span>
                    <span className="mono">: ₹{selectedInvoice.amount?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Currently Settled</span>
                    <span className="mono">
                      : ₹{selectedInvoice.status === "PAID" ? selectedInvoice.amount?.toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 900,
                      fontSize: "14px",
                      marginTop: "2px",
                      color: selectedInvoice.status === "PAID" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    <span>Net Due</span>
                    <span className="mono">
                      : ₹{selectedInvoice.status === "PAID" ? "0.00" : selectedInvoice.amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Information Table */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  Receipt &amp; Payment Settlement Information
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                    border: "1px solid #000000",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #000000", background: "#f1f5f9", fontWeight: 800 }}>
                      <th style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>Date</th>
                      <th style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>Receipt No</th>
                      <th style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>Type</th>
                      <th style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>Settlement Mode</th>
                      <th style={{ padding: "5px 8px", textAlign: "right" }}>Receipt Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>
                        {formatDate(selectedInvoice.date, "dd/MM/yyyy")}
                      </td>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>R2444</td>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>Payment Receipt</td>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #000000" }}>UPI / Front Desk</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }} className="mono font-bold">
                        ₹{selectedInvoice.amount?.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer and Signatures */}
              <div style={{ fontSize: "12px", marginTop: "20px" }}>
                <div style={{ fontWeight: 700, marginBottom: "36px" }}>
                  Please make Cheque / Bank Transfer in favour of: <strong>HOTEL SHEMRON</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ borderTop: "1px solid #000000", width: "160px", marginBottom: "4px" }}></div>
                    <strong>Guest Signature</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>For HOTEL SHEMRON</div>
                    <div style={{ marginTop: "32px" }}>
                      <div style={{ borderTop: "1px solid #000000", width: "180px", marginLeft: "auto", marginBottom: "4px" }}></div>
                      <strong>Authorised Signatory</strong>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", marginTop: "12px", fontSize: "10px", color: "#64748b" }}>
                  Page 1 of 1 • System Generated GST Tax Invoice
                </div>
              </div>
            </div>

            {/* Sticky Action Footer (ALWAYS VISIBLE & UNBLOCKED ON SCREEN) */}
            <div
              className="no-print"
              style={{
                padding: "16px 24px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedInvoice(null)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 700 }}
              >
                <Printer size={16} /> Print Official Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Download, Send, Printer, Plus } from "lucide-react";

export default function InvoicesClient() {
  const { reservations } = useAppState();

  const invoices = reservations.map((res, idx) => ({
    id: `inv_${res.id}`,
    invoiceNumber: `INV-${new Date(res.checkIn).getFullYear()}${(new Date(res.checkIn).getMonth() + 1).toString().padStart(2, "0")}-${(idx + 1).toString().padStart(5, "0")}`,
    guestName: res.guestName,
    roomNumber: res.roomNumber || "Unassigned",
    amount: res.totalAmount,
    tax: res.taxAmount,
    status: res.balanceAmount === 0 ? "PAID" : "ISSUED",
    date: new Date(res.checkIn),
    resId: res.id,
  }));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tax Invoices & Receipts</h1>
          <p className="page-description">
            Generate and manage GST compliant hotel tax invoices for guests and corporate clients.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {invoices.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <FileText size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Invoices Generated Yet</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Tax invoices are generated automatically when reservations and guest folios are created.
              </p>
              <Link href="/dashboard/reservations/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> Create Reservation
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>GST Tax</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Issued Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mono font-bold">{inv.invoiceNumber}</td>
                    <td className="font-semibold">{inv.guestName}</td>
                    <td><span className="badge badge-primary">#{inv.roomNumber}</span></td>
                    <td className="mono">{formatCurrency(inv.tax)}</td>
                    <td className="mono font-bold text-primary">{formatCurrency(inv.amount)}</td>
                    <td>
                      <span className={`badge ${inv.status === "PAID" ? "badge-success" : "badge-warning"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-xs text-secondary">{formatDate(inv.date, "dd MMM yyyy")}</td>
                    <td className="text-right">
                      <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                        <Link href={`/dashboard/reservations/${inv.resId}`} className="btn btn-ghost btn-sm btn-icon" title="View Folio & Print">
                          <Printer size={14} />
                        </Link>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Download PDF">
                          <Download size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Send WhatsApp/Email">
                          <Send size={14} />
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
    </div>
  );
}

"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Download, Send, Printer } from "lucide-react";

export default function InvoicesClient() {
  const invoices = [
    { id: "inv_001", invoiceNumber: "INV-202608-00018", guestName: "Mohammed Ali", roomNumber: "210", amount: 11760, tax: 1260, status: "PAID", date: new Date() },
    { id: "inv_002", invoiceNumber: "INV-202608-00017", guestName: "Sneha Reddy", roomNumber: "501", amount: 50400, tax: 5400, status: "ISSUED", date: new Date(Date.now() - 24 * 3600000) },
    { id: "inv_003", invoiceNumber: "INV-202608-00016", guestName: "Deepika Joshi", roomNumber: "306", amount: 12320, tax: 1320, status: "PAID", date: new Date(Date.now() - 48 * 3600000) },
  ];

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
        </div>
      </div>
    </div>
  );
}

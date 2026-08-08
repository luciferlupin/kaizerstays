"use client";

import { useState } from "react";
import { demoExpenses } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Plus, Search } from "lucide-react";

export default function ExpensesClient() {
  const [expenses, setExpenses] = useState(demoExpenses);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hotel Expense Tracking</h1>
          <p className="page-description">
            Track vendor payouts, utility bills, salary disbursements, and operational expenses.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => alert("Log Expense modal")}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total Outflow</span>
          <div className="stat-card-value text-danger">{formatCurrency(totalExpense)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor / Payee</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment Method</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date, "dd MMM yyyy")}</td>
                  <td className="font-semibold">{e.vendor}</td>
                  <td><span className="badge badge-default">{e.category}</span></td>
                  <td className="text-secondary">{e.description}</td>
                  <td><span className="badge badge-default">{e.method}</span></td>
                  <td className="text-right mono font-bold text-danger">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

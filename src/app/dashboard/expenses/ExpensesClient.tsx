"use client";

import { useState } from "react";
import { demoExpenses } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Plus, Search, X, Check } from "lucide-react";

export default function ExpensesClient() {
  const [expenses, setExpenses] = useState(demoExpenses);
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("SUPPLIES");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState("UPI");

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = () => {
    if (!vendor.trim() || amount <= 0) return;
    const newExpense = {
      id: `exp_${Date.now()}`,
      date: new Date(),
      vendor,
      category,
      description,
      amount,
      method,
    };
    setExpenses([newExpense, ...expenses]);
    setSaved(true);
    setTimeout(() => {
      setShowModal(false);
      setSaved(false);
      setVendor("");
      setDescription("");
      setAmount(0);
    }, 1500);
  };

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
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total Outflow</span>
          <div className="stat-card-value text-danger">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Entries This Month</span>
          <div className="stat-card-value">{expenses.length}</div>
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

      {/* Log Expense Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Log New Expense</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {saved ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Expense Logged!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>{formatCurrency(amount)} paid to {vendor}</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Vendor / Payee Name *</label>
                    <input type="text" className="form-input" placeholder="e.g. Delhi Electricity Board" value={vendor} onChange={(e) => setVendor(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="UTILITIES">Utilities</option>
                        <option value="SALARY">Salary</option>
                        <option value="FOOD">Food & Beverages</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="SUPPLIES">Housekeeping Supplies</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="SOFTWARE">Software</option>
                        <option value="TRANSPORT">Transport</option>
                        <option value="RENT">Rent</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (₹) *</label>
                      <input type="number" className="form-input" placeholder="0" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" rows={2} placeholder="What was the expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            {!saved && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddExpense} disabled={!vendor.trim() || amount <= 0}>
                  Log Expense
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

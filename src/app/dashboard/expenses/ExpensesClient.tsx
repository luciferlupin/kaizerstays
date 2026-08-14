"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Plus, Search, X, Check, Download, Filter } from "lucide-react";

export default function ExpensesClient() {
  const { expenses, addExpense, addActivity } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Form state
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("UTILITIES");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState("UPI");

  // Filtered expense list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.vendor.toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, categoryFilter, search]);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Top spending category calculation
  const topCategory = useMemo(() => {
    if (expenses.length === 0) return "N/A";
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }
    let maxCat = "N/A";
    let maxVal = 0;
    for (const [cat, val] of Object.entries(totals)) {
      if (val > maxVal) {
        maxVal = val;
        maxCat = cat;
      }
    }
    return maxCat;
  }, [expenses]);

  const avgExpense = expenses.length > 0 ? Math.round(totalExpense / expenses.length) : 0;

  const handleAddExpense = () => {
    if (!vendor.trim() || amount <= 0) return;
    const newExpense = {
      id: `exp_${Date.now()}`,
      date: new Date(),
      vendor: vendor.trim(),
      category,
      description: description.trim(),
      amount,
      method,
    };
    addExpense(newExpense);
    addActivity("Expense Logged", "expenses", newExpense.id, `${formatCurrency(amount)} paid to ${vendor}`);
    setSaved(true);
    setTimeout(() => {
      setShowModal(false);
      setSaved(false);
      setVendor("");
      setDescription("");
      setAmount(0);
    }, 1200);
  };

  const exportExpensesCSV = () => {
    const csvContent = `KaizerStays OS — Hotel Shemron Operational Expenses Report
Export Date: ${new Date().toISOString()}
Total Outflow: INR ${totalExpense}
Total Vouchers: ${expenses.length}

=== EXPENSE VOUCHERS LIST ===
Date,Vendor/Payee,Category,Description,Payment Method,Amount (INR)
${filteredExpenses
  .map(
    (e) =>
      `"${formatDate(e.date, "yyyy-MM-dd")}","${e.vendor.replace(/"/g, '""')}","${e.category}","${(
        e.description || ""
      ).replace(/"/g, '""')}","${e.method}",${e.amount}`
  )
  .join("\n")}
`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KaizerStays_Operational_Expenses_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hotel Expense Tracking</h1>
          <p className="page-description">
            Track vendor payouts, utility bills, salary disbursements, and operational expenses for Hotel Shemron Neemrana.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={exportExpensesCSV} disabled={expenses.length === 0}>
            <Download size={16} /> Export Expenses CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Total Outflow</span>
          <div className="stat-card-value text-danger">{formatCurrency(totalExpense)}</div>
          <span className="text-xs text-secondary">Cumulative operating expenses</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Total Vouchers Logged</span>
          <div className="stat-card-value">{expenses.length}</div>
          <span className="text-xs text-secondary">Expense records tracked</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Top Outflow Category</span>
          <div className="stat-card-value text-primary font-bold" style={{ fontSize: "20px" }}>
            {topCategory}
          </div>
          <span className="text-xs text-secondary">Highest expenditure stream</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Average Payout Entry</span>
          <div className="stat-card-value">{formatCurrency(avgExpense)}</div>
          <span className="text-xs text-secondary">Mean voucher cost</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Filter size={16} className="text-secondary" />
            <span className="text-xs font-semibold text-secondary">Category:</span>
            <select
              className="form-select text-xs"
              style={{ width: "200px" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="UTILITIES">Utilities</option>
              <option value="SUPPLIES">Housekeeping Supplies</option>
              <option value="MAINTENANCE">Maintenance & DG Fuel</option>
              <option value="FOOD">Food & Beverages</option>
              <option value="SALARY">Staff Salaries</option>
              <option value="MARKETING">Marketing & OTA Ads</option>
              <option value="OTHER">Other Expenses</option>
            </select>
          </div>

          <div style={{ width: "100%", maxWidth: "280px", position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
            <input
              type="text"
              className="form-input text-xs"
              style={{ paddingLeft: "34px" }}
              placeholder="Search vendor, payee, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredExpenses.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Receipt size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Expense Records Found</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Click &quot;Log Expense&quot; above to record operational payouts, vendor bills, or utility costs.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Log First Expense
              </button>
            </div>
          ) : (
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
                {filteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td className="text-xs text-secondary">{formatDate(e.date, "dd MMM yyyy")}</td>
                    <td className="font-semibold">{e.vendor}</td>
                    <td>
                      <span className="badge badge-default">{e.category}</span>
                    </td>
                    <td className="text-secondary text-xs">{e.description || "—"}</td>
                    <td>
                      <span className="badge badge-primary">{e.method}</span>
                    </td>
                    <td className="text-right mono font-bold text-danger">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    {formatCurrency(amount)} paid to {vendor}
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Vendor / Payee Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. JVVNL Electricity Board / Diversey India"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                    />
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
                      <input
                        type="number"
                        className="form-input"
                        placeholder="0"
                        value={amount || ""}
                        onChange={(e) => setAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="What was the expense for?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
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
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
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

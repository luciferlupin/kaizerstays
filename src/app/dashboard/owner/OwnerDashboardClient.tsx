"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Crown,
  UserPlus,
  Users,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Key,
  Check,
  X,
  Plus,
  Lock,
  Building,
  UserCheck,
  ChevronRight,
} from "lucide-react";

export default function OwnerDashboardClient() {
  const { property, staff, addStaffMember, reservations, payments, expenses } = useAppState();
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberCreated, setMemberCreated] = useState(false);

  // Form State
  const [staffId, setStaffId] = useState(`EMP-${Math.floor(100 + Math.random() * 900)}`);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Front Desk Receptionist");
  const [password, setPassword] = useState("Shemron@2026");

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0) + 1845000;
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0) + 712000;
  const grossProfit = totalRevenue - totalExpenseAmount;

  const handleCreateMember = () => {
    if (!fullName.trim() || !email.trim()) return;
    addStaffMember({
      staffId,
      name: fullName,
      email,
      role,
      phone,
      password,
    });
    setMemberCreated(true);
    setTimeout(() => {
      setShowAddModal(false);
      setMemberCreated(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setStaffId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    }, 1500);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Crown size={24} className="text-warning" />
            Property Owner & Management Console
          </h1>
          <p className="page-description">
            High-level executive financial metrics, profitability, and employee pass management for {property.name}.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> Add Employee Pass & ID
          </button>
        </div>
      </div>

      {/* Owner Financial Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total Revenue MTD</span>
          <div className="stat-card-value text-primary">{formatCurrency(totalRevenue)}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>+15.2% vs last month</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Gross Operating Profit (GOP)</span>
          <div className="stat-card-value text-success">{formatCurrency(grossProfit)}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>61.8% Profit Margin</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Operating Expenses</span>
          <div className="stat-card-value text-danger">{formatCurrency(totalExpenseAmount)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "4px" }}>Payroll, Utilities, Supplies</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Active Staff Members</span>
          <div className="stat-card-value">{staff.length}</div>
          <span className="text-xs text-success" style={{ marginTop: "4px" }}>100% Verified Access</span>
        </div>
      </div>

      {/* Main Employee & Pass Management Section */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header" style={{ padding: "16px 20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Employee Roster & Login Pass Management</h3>
            <p className="text-xs text-secondary">
              Owner controls to issue login credentials, assign roles, and manage access passes for Hotel Shemron.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <UserPlus size={14} /> Create Staff Pass
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Employee Name</th>
                <th>Role & Department</th>
                <th>Email / Login ID</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="mono font-bold text-primary">{s.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                  </td>
                  <td>
                    <div>{s.role}</div>
                    <div className="text-xs text-tertiary">{s.department}</div>
                  </td>
                  <td className="text-sm font-semibold">{s.email}</td>
                  <td className="text-xs text-secondary">{(s as any).phone || "+91 98100 12345"}</td>
                  <td>
                    <span className="badge badge-success">ACTIVE</span>
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => alert(`Reset password link generated for ${s.firstName} ${s.lastName} (${s.id})!`)}
                    >
                      <Key size={12} /> Reset Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Pass Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Issue Employee Access Pass</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {memberCreated ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Staff Pass & Credentials Created!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    Employee <strong>{fullName}</strong> can now log in with Staff ID <strong>{staffId}</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Generated Staff ID *</label>
                    <input
                      type="text"
                      className="form-input mono font-bold"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employee Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Vikram Singh"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="vikram@hotelshemron.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+91 98100 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Role</label>
                    <select
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Front Desk Receptionist">Front Desk Receptionist</option>
                      <option value="Housekeeping Staff">Housekeeping Staff</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Head Chef / Kitchen Supervisor">Head Chef / Kitchen Supervisor</option>
                      <option value="Finance & Accountant">Finance & Accountant</option>
                      <option value="Maintenance Engineer">Maintenance Engineer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Password / Passcode *</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {!memberCreated && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateMember} disabled={!fullName.trim() || !email.trim()}>
                  Issue Access Pass
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

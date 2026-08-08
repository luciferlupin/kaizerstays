"use client";

import { useState } from "react";
import { demoStaff } from "@/lib/demo-data";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { UserCog, Plus, Shield, X, Check, Trash2 } from "lucide-react";

export default function StaffClient() {
  const [staffList, setStaffList] = useState(demoStaff);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditRole, setShowEditRole] = useState<typeof demoStaff[0] | null>(null);
  const [invited, setInvited] = useState(false);

  // Invite form state
  const [invFirstName, setInvFirstName] = useState("");
  const [invLastName, setInvLastName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("Receptionist");
  const [invDept, setInvDept] = useState("FRONT_DESK");

  const handleInvite = () => {
    if (!invFirstName.trim() || !invEmail.trim()) return;
    const newStaff = {
      id: `staff_${Date.now()}`,
      firstName: invFirstName,
      lastName: invLastName,
      email: invEmail,
      role: invRole,
      department: invDept,
      isActive: true,
    };
    setStaffList([...staffList, newStaff]);
    setInvited(true);
    setTimeout(() => {
      setShowInvite(false);
      setInvited(false);
      setInvFirstName(""); setInvLastName(""); setInvEmail("");
    }, 1500);
  };

  const handleDeactivate = (id: string) => {
    setStaffList(staffList.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleUpdateRole = (newRole: string) => {
    if (showEditRole) {
      setStaffList(staffList.map((s) => s.id === showEditRole.id ? { ...s, role: newRole } : s));
      setShowEditRole(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff & Role-Based Access Control (RBAC)</h1>
          <p className="page-description">
            Manage hotel team members, department roles, and granular staff permissions.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            <Plus size={16} /> Invite Staff Member
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="avatar avatar-sm" style={{ background: getAvatarColor(s.firstName), color: "white" }}>
                        {getInitials(s.firstName, s.lastName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-tertiary">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-default">{s.department}</span></td>
                  <td>
                    <span className="badge badge-primary">
                      <Shield size={10} style={{ marginRight: "4px" }} />
                      {s.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.isActive ? "badge-success" : "badge-danger"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowEditRole(s)}>Edit Role</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(s.id)}>
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Modal */}
      {showInvite && (
        <div className="modal-backdrop" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Invite New Staff Member</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowInvite(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {invited ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Staff Member Invited!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>Invitation email sent to {invEmail}</p>
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input type="text" className="form-input" value={invFirstName} onChange={(e) => setInvFirstName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-input" value={invLastName} onChange={(e) => setInvLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={invRole} onChange={(e) => setInvRole(e.target.value)}>
                        <option value="General Manager">General Manager</option>
                        <option value="Front Desk Manager">Front Desk Manager</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Housekeeping Manager">Housekeeping Manager</option>
                        <option value="Housekeeping Staff">Housekeeping Staff</option>
                        <option value="Restaurant Manager">Restaurant Manager</option>
                        <option value="Accountant">Accountant</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="form-select" value={invDept} onChange={(e) => setInvDept(e.target.value)}>
                        <option value="MANAGEMENT">Management</option>
                        <option value="FRONT_DESK">Front Desk</option>
                        <option value="HOUSEKEEPING">Housekeeping</option>
                        <option value="RESTAURANT">Restaurant</option>
                        <option value="FINANCE">Finance</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!invited && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleInvite} disabled={!invFirstName.trim() || !invEmail.trim()}>
                  Send Invitation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRole && (
        <div className="modal-backdrop" onClick={() => setShowEditRole(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Role: {showEditRole.firstName} {showEditRole.lastName}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowEditRole(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {["General Manager", "Front Desk Manager", "Receptionist", "Housekeeping Manager", "Housekeeping Staff", "Restaurant Manager", "Accountant"].map((role) => (
                <button
                  key={role}
                  className={`btn ${showEditRole.role === role ? "btn-primary" : "btn-secondary"} w-full`}
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => handleUpdateRole(role)}
                >
                  <Shield size={14} /> {role}
                  {showEditRole.role === role && <Check size={14} style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { demoStaff } from "@/lib/demo-data";
import { UserCog, Plus, Shield, Mail, Phone } from "lucide-react";

export default function StaffClient() {
  const [staffList, setStaffList] = useState(demoStaff);

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
          <button className="btn btn-primary" onClick={() => alert("Invite staff modal triggered")}>
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
                    <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-tertiary">{s.email}</div>
                  </td>
                  <td><span className="badge badge-default">{s.department}</span></td>
                  <td>
                    <span className="badge badge-primary">
                      <Shield size={10} style={{ marginRight: "4px" }} />
                      {s.role}
                    </span>
                  </td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td className="text-right">
                    <button className="btn btn-secondary btn-sm">Edit Role</button>
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

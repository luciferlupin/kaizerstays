"use client";

import { useState } from "react";
import { demoGuestRequests } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import { MessageSquare, CheckCircle2, Clock, Play } from "lucide-react";

export default function RequestsClient() {
  const [requests, setRequests] = useState(demoGuestRequests);

  const handleUpdateStatus = (id: string, status: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Guest Service Requests</h1>
          <p className="page-description">
            Real-time guest requests from Room QR Portal (Towels, Room Service, AC Maintenance, Laundry).
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {requests.map((req) => (
          <div key={req.id} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>Room #{req.roomNumber}</div>
              <span className={`badge ${req.status === "REQUESTED" ? "badge-warning" : req.status === "COMPLETED" ? "badge-success" : "badge-primary"}`}>
                {req.status}
              </span>
            </div>

            <div style={{ margin: "12px 0" }}>
              <div style={{ fontWeight: 600 }}>{req.guestName}</div>
              <div className="text-sm text-secondary" style={{ marginTop: "4px" }}>
                {req.type}: <strong>{req.description}</strong> (Qty: {req.quantity})
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              {req.status === "REQUESTED" && (
                <button className="btn btn-primary w-full" onClick={() => handleUpdateStatus(req.id, "ON_THE_WAY")}>
                  Accept & Mark On The Way
                </button>
              )}

              {req.status === "ON_THE_WAY" && (
                <button className="btn btn-success w-full" onClick={() => handleUpdateStatus(req.id, "COMPLETED")}>
                  Mark Completed
                </button>
              )}

              {req.status === "COMPLETED" && (
                <div className="badge badge-success w-full" style={{ padding: "8px", justifyContent: "center" }}>
                  <CheckCircle2 size={14} style={{ marginRight: "4px" }} /> Task Delivered & Completed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

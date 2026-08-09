"use client";

import { useState, useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";
import { formatDate } from "@/lib/utils";
import { Activity, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ActivityClient() {
  const { activity } = useAppState();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Audit Trail</h1>
          <p className="page-description">
            Append-only security and operational audit trail for all hotel actions.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="activity-feed">
            {activity.map((act, idx) => (
              <div key={`${act.id}_${idx}`} className="activity-item">
                <div className="activity-icon" style={{ background: "var(--blue-50)", color: "var(--blue-600)" }}>
                  <ShieldCheck size={16} />
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{act.action}</strong> — {act.detail}
                  </div>
                  <div className="activity-time" suppressHydrationWarning>
                    By <strong>{act.user}</strong> • {mounted && act.createdAt ? formatDate(act.createdAt, "dd MMM yyyy, hh:mm a") : "Recently"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

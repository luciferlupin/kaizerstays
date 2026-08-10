"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Sparkles, CheckCircle2, Clock, UserCheck, AlertTriangle, Play, Check } from "lucide-react";

export default function HousekeepingClient() {
  const { housekeepingTasks, updateHousekeepingTaskStatus } = useAppState();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");

  const handleStartCleaning = (taskId: string) => {
    updateHousekeepingTaskStatus(taskId, "IN_PROGRESS");
  };

  const handleMarkComplete = (taskId: string) => {
    updateHousekeepingTaskStatus(taskId, "COMPLETED");
  };

  const dirtyCount = housekeepingTasks.filter((t) => t.status === "PENDING").length;
  const inProgressCount = housekeepingTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = housekeepingTasks.filter((t) => t.status === "COMPLETED").length;

  const filteredTasks = housekeepingTasks.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false;
    return true;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Housekeeping Management</h1>
          <p className="page-description">
            Mobile-optimized operational interface for cleaning staff and floor supervisors.
          </p>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Rooms To Clean</span>
          <div className="stat-card-value text-warning">{dirtyCount}</div>
          <span className="text-xs text-secondary">Pending cleaning</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Currently Cleaning</span>
          <div className="stat-card-value text-primary">{inProgressCount}</div>
          <span className="text-xs text-secondary">Staff working</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Cleaned Today</span>
          <div className="stat-card-value text-success">{completedCount}</div>
          <span className="text-xs text-secondary">Ready for guests</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        <button className={`tab ${filter === "ALL" ? "active" : ""}`} onClick={() => setFilter("ALL")}>
          All Tasks ({housekeepingTasks.length})
        </button>
        <button className={`tab ${filter === "PENDING" ? "active" : ""}`} onClick={() => setFilter("PENDING")}>
          Pending ({dirtyCount})
        </button>
        <button className={`tab ${filter === "IN_PROGRESS" ? "active" : ""}`} onClick={() => setFilter("IN_PROGRESS")}>
          In Progress ({inProgressCount})
        </button>
        <button className={`tab ${filter === "COMPLETED" ? "active" : ""}`} onClick={() => setFilter("COMPLETED")}>
          Completed ({completedCount})
        </button>
      </div>

      {/* Tasks List Grid */}
      {filteredTasks.length === 0 ? (
        <div className="card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <Sparkles size={36} className="text-success" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>All Rooms Clean & Inspected</h3>
          <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
            No pending housekeeping or checkout cleaning tasks at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filteredTasks.map((task) => (
            <div key={task.id} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800 }}>Room #{task.roomNumber}</div>
                  <div className="text-xs text-tertiary">{task.roomType} • Floor {task.floor}</div>
                </div>
                <span className={`badge ${task.priority === "HIGH" ? "badge-danger" : "badge-default"}`}>
                  {task.priority}
                </span>
              </div>

              <div style={{ margin: "12px 0" }}>
                <span className="badge badge-primary">{task.type.replace("_", " ")}</span>
                {task.assignedTo && (
                  <div className="text-xs text-secondary" style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <UserCheck size={12} /> Assigned to {task.assignedTo}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)" }}>
                <span className={`badge ${task.status === "COMPLETED" ? "badge-success" : task.status === "IN_PROGRESS" ? "badge-primary" : "badge-warning"}`}>
                  {task.status}
                </span>

                {task.status === "PENDING" && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStartCleaning(task.id)}>
                    <Play size={12} /> Start Cleaning
                  </button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <button className="btn btn-success btn-sm" onClick={() => handleMarkComplete(task.id)}>
                    <Check size={12} /> Mark Clean
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

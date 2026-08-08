"use client";

import { useState } from "react";
import { demoHousekeepingTasks, demoRooms } from "@/lib/demo-data";
import { Sparkles, CheckCircle2, Clock, UserCheck, AlertTriangle, Play, Check } from "lucide-react";

export default function HousekeepingClient() {
  const [tasks, setTasks] = useState(demoHousekeepingTasks);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");

  const handleStartCleaning = (taskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t
      )
    );
  };

  const handleMarkComplete = (taskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: "COMPLETED" } : t
      )
    );
  };

  const dirtyCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const filteredTasks = tasks.filter((t) => {
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
          <span className="stat-card-label">Completed Today</span>
          <div className="stat-card-value text-success">{completedCount}</div>
          <span className="text-xs text-success">Inspected & ready</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        <button className={`tab ${filter === "ALL" ? "active" : ""}`} onClick={() => setFilter("ALL")}>
          All Tasks ({tasks.length})
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

      {/* Mobile-Friendly Task Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {filteredTasks.map((task) => (
          <div key={task.id} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800 }}>Room #{task.roomNumber}</div>
                <div className="text-xs text-secondary">{task.roomType} • Floor {task.floor}</div>
              </div>
              <span className={`badge ${task.priority === "HIGH" ? "badge-danger" : "badge-default"}`}>
                {task.priority} Priority
              </span>
            </div>

            <div style={{ margin: "12px 0", fontSize: "13px" }}>
              <div style={{ fontWeight: 600 }}>{task.type.replace("_", " ")}</div>
              <div className="text-xs text-tertiary">Assigned to: {task.assignedTo || "Unassigned"}</div>
            </div>

            <div style={{ marginTop: "16px" }}>
              {task.status === "PENDING" && (
                <button
                  className="btn btn-primary w-full btn-lg"
                  onClick={() => handleStartCleaning(task.id)}
                >
                  <Play size={18} /> START CLEANING
                </button>
              )}

              {task.status === "IN_PROGRESS" && (
                <button
                  className="btn btn-success w-full btn-lg"
                  onClick={() => handleMarkComplete(task.id)}
                >
                  <Check size={18} /> MARK COMPLETE
                </button>
              )}

              {task.status === "COMPLETED" && (
                <div
                  style={{
                    padding: "10px",
                    background: "var(--green-50)",
                    color: "var(--green-700)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  <CheckCircle2 size={16} style={{ display: "inline", marginRight: "4px" }} />
                  Cleaned & Inspected — Room Available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

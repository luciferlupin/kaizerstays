"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { formatDate } from "@/lib/utils";
import {
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  ConciergeBell,
  ChefHat,
  ShieldCheck,
  LogOut,
  Check,
  Play,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function EmployeeClient() {
  const router = useRouter();
  const { currentUser, housekeepingTasks, updateHousekeepingTaskStatus, logoutUser } = useAppState();
  const [mounted, setMounted] = useState(false);
  const [clockedIn, setClockedIn] = useState(true);
  const [clockTime, setClockTime] = useState<Date | null>(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !currentUser) {
      router.replace("/login");
    }
  }, [mounted, currentUser, router]);

  if (!mounted || !currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spin-animation" style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#0071E3", borderRadius: "50%", margin: "0 auto 16px auto" }} />
          <p style={{ fontSize: "14px", color: "#94A3B8" }}>Verifying employee credentials...</p>
        </div>
      </div>
    );
  }

  const user = currentUser;

  const handleToggleClock = () => {
    setClockedIn(!clockedIn);
    if (!clockedIn) {
      setClockTime(new Date());
    }
  };

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-sans)" }}>
      {/* Employee Top Profile Card */}
      <div
        className="card"
        style={{
          padding: "20px",
          marginBottom: "16px",
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8" }}>
              Staff Access Pass • {user.staffId}
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0" }}>{user.name}</h2>
            <p style={{ fontSize: "13px", color: "#CBD5E1" }}>{user.role}</p>
          </div>
          <span className="badge badge-success" style={{ fontSize: "12px", padding: "6px 12px" }}>
            {clockedIn ? "ON SHIFT" : "OFF DUTY"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#CBD5E1" }}>
            <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
            Shift: Morning (07:00 - 15:00)
          </div>

          <button
            className={`btn btn-sm ${clockedIn ? "btn-danger" : "btn-success"}`}
            onClick={handleToggleClock}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </button>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <Link href="/dashboard/housekeeping" className="card" style={{ padding: "16px", textDecoration: "none", color: "inherit" }}>
          <Sparkles size={20} className="text-primary" style={{ marginBottom: "6px" }} />
          <div style={{ fontSize: "14px", fontWeight: 700 }}>Housekeeping</div>
          <div className="text-xs text-secondary">{housekeepingTasks.filter((t) => t.status === "PENDING").length} Tasks Pending</div>
        </Link>

        <Link href="/dashboard/front-desk" className="card" style={{ padding: "16px", textDecoration: "none", color: "inherit" }}>
          <ConciergeBell size={20} className="text-success" style={{ marginBottom: "6px" }} />
          <div style={{ fontSize: "14px", fontWeight: 700 }}>Front Desk</div>
          <div className="text-xs text-secondary">Check-ins & Guests</div>
        </Link>
      </div>

      {/* Assigned Daily Work Tasks */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Assigned Shift Work Queue</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {housekeepingTasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: "14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-subtle)",
                background: task.status === "COMPLETED" ? "var(--green-50)" : "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>Room #{task.roomNumber} ({task.roomType})</div>
                <div className="text-xs text-secondary">{task.type.replace("_", " ")} • Priority: {task.priority}</div>
              </div>

              {task.status === "PENDING" && (
                <button className="btn btn-primary btn-sm" onClick={() => updateHousekeepingTaskStatus(task.id, "IN_PROGRESS")}>
                  Start
                </button>
              )}

              {task.status === "IN_PROGRESS" && (
                <button className="btn btn-success btn-sm" onClick={() => updateHousekeepingTaskStatus(task.id, "COMPLETED")}>
                  <Check size={14} /> Done
                </button>
              )}

              {task.status === "COMPLETED" && (
                <span className="badge badge-success">Completed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout Link */}
      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <Link href="/login" onClick={logoutUser} className="text-xs text-secondary" style={{ textDecoration: "underline" }}>
          Log Out of Staff Account
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { AppStateProvider, useAppState } from "@/context/AppStateContext";
import {
  LayoutDashboard,
  ConciergeBell,
  Calendar,
  Sparkles,
  Menu,
  Lock,
  Eye,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { getPagePermission } from "@/lib/role-permissions";

function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppState();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !currentUser) {
      router.replace("/login");
    }
  }, [mounted, currentUser, router]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (!mounted || !currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          color: "#fff",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="spin-animation"
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(255,255,255,0.15)",
              borderTopColor: "#0071E3",
              borderRadius: "50%",
              margin: "0 auto 16px auto",
            }}
          />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>KaizerStays OS</h3>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
            Verifying staff authentication session...
          </p>
        </div>
      </div>
    );
  }

  const permission = getPagePermission(pathname, currentUser.role);

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="main-content">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="main-page">
          {permission.level === "LOCKED" ? (
            <div className="card" style={{ maxWidth: "560px", margin: "60px auto", padding: "40px 28px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Access Restricted</h2>
              <p className="text-sm text-secondary" style={{ marginTop: "8px", lineHeight: "1.6" }}>
                Logged in as <strong>{currentUser.name}</strong> ({currentUser.role}).
                <br />
                {permission.reason || "You do not have permission to access or edit this management module."}
              </p>
              <div style={{ marginTop: "24px" }}>
                <Link href={permission.primaryWorkspace} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Go to My Primary Work Workspace <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {permission.level === "VIEW_ONLY" && (
                <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "10px 16px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Eye size={16} className="text-primary" />
                  <span className="text-xs font-semibold text-primary" style={{ flex: 1 }}>
                    <strong>View-Only Reference Mode ({currentUser.role}):</strong> You have read-only access to this operational page. Creation & Editing features are locked for your role.
                  </span>
                  <Link href={permission.primaryWorkspace} className="btn btn-secondary btn-sm" style={{ padding: "4px 10px", fontSize: "11px" }}>
                    My Work Page
                  </Link>
                </div>
              )}
              {children}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <Link
          href="/dashboard"
          className={`mobile-bottom-nav-item ${isActive("/dashboard") ? "active" : ""}`}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>

        <Link
          href="/dashboard/front-desk"
          className={`mobile-bottom-nav-item ${isActive("/dashboard/front-desk") ? "active" : ""}`}
        >
          <ConciergeBell size={20} />
          <span>Front Desk</span>
        </Link>

        <Link
          href="/dashboard/calendar"
          className={`mobile-bottom-nav-item ${isActive("/dashboard/calendar") ? "active" : ""}`}
        >
          <Calendar size={20} />
          <span>Calendar</span>
        </Link>

        <Link
          href="/dashboard/housekeeping"
          className={`mobile-bottom-nav-item ${isActive("/dashboard/housekeeping") ? "active" : ""}`}
        >
          <Sparkles size={20} />
          <span>Housekeeping</span>
        </Link>

        <button
          className="mobile-bottom-nav-item"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <DashboardAuthGuard>{children}</DashboardAuthGuard>
    </AppStateProvider>
  );
}

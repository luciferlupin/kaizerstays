"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  LayoutDashboard,
  ConciergeBell,
  Calendar,
  Sparkles,
  Menu,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

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
        <main className="main-page">{children}</main>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Users,
  DoorOpen,
  Sparkles,
  CreditCard,
  Receipt,
  FileText,
  BarChart3,
  ClipboardList,
  UserCog,
  Activity,
  Settings,
  ChevronDown,
  Hotel,
  MessageSquare,
  BellDot,
  X,
  Moon,
  Utensils,
  TrendingUp,
  Radio,
  Globe,
  Crown,
} from "lucide-react";
import { classNames } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  ConciergeBell: BellDot,
  CalendarCheck,
  Calendar,
  Users,
  DoorOpen,
  Sparkles,
  CreditCard,
  Receipt,
  FileText,
  BarChart3,
  ClipboardList,
  UserCog,
  Activity,
  Settings,
  MessageSquare,
  Moon,
  Utensils,
  TrendingUp,
  Radio,
  Globe,
  Crown,
};

interface NavItemDef {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    title: "OPERATIONS",
    items: [
      { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Front Desk", href: "/dashboard/front-desk", icon: "ConciergeBell", badge: 4 },
      { label: "Reservations", href: "/dashboard/reservations", icon: "CalendarCheck" },
      { label: "Calendar", href: "/dashboard/calendar", icon: "Calendar" },
      { label: "Guests", href: "/dashboard/guests", icon: "Users" },
      { label: "Rooms", href: "/dashboard/rooms", icon: "DoorOpen" },
      { label: "Housekeeping", href: "/dashboard/housekeeping", icon: "Sparkles", badge: 5 },
      { label: "Guest Requests", href: "/dashboard/requests", icon: "MessageSquare", badge: 2 },
      { label: "Night Audit", href: "/dashboard/night-audit", icon: "Moon" },
      { label: "Restaurant POS", href: "/dashboard/pos", icon: "Utensils" },
    ],
  },
  {
    title: "REVENUE & CHANNELS",
    items: [
      { label: "Payments", href: "/dashboard/payments", icon: "CreditCard" },
      { label: "Expenses", href: "/dashboard/expenses", icon: "Receipt" },
      { label: "Invoices", href: "/dashboard/invoices", icon: "FileText" },
      { label: "Revenue Manager", href: "/dashboard/revenue", icon: "TrendingUp" },
      { label: "Channel Manager", href: "/dashboard/channels", icon: "Radio" },
      { label: "Booking Engine", href: "/dashboard/booking-engine", icon: "Globe" },
      { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3" },
      { label: "Reports", href: "/dashboard/reports", icon: "ClipboardList" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Owner Console", href: "/dashboard/owner", icon: "Crown" },
      { label: "Staff", href: "/dashboard/staff", icon: "UserCog" },
      { label: "Activity Log", href: "/dashboard/activity", icon: "Activity" },
      { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className={classNames("sidebar", isOpen && "open")}>
      {/* Logo & Mobile Close */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">S</div>
        <span>StaySphere</span>

        {/* Mobile close button */}
        {onClose && (
          <button
            className="btn btn-ghost btn-icon btn-sm mobile-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Property Switcher */}
      <div className="sidebar-property">
        <button className="sidebar-property-name">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Hotel size={14} />
            Hotel Shemron
          </span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="sidebar-section">
            <div className="sidebar-section-title">{group.title}</div>
            {group.items.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames("sidebar-link", active && "active")}
                  onClick={() => onClose && onClose()}
                >
                  <IconComponent className="sidebar-link-icon" size={18} />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="sidebar-link-badge">{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className="avatar avatar-sm"
            style={{ background: "#2563EB", color: "white" }}
          >
            SM
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Sunil Manager</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
              General Manager
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

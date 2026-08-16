"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Boxes,
  LogOut,
  CalendarRange,
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
  Boxes,
  CalendarRange,
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
      { label: "Guest Inbox", href: "/dashboard/messages", icon: "MessageSquare" },
      { label: "Stock & Inventory", href: "/dashboard/inventory", icon: "Boxes" },
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
      { label: "Rates & Availability", href: "/dashboard/rates", icon: "CalendarRange" },
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

import { useAppState } from "@/context/AppStateContext";
import { getPagePermission } from "@/lib/role-permissions";

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logoutUser, guestRequests, housekeepingTasks } = useAppState();

  const user = currentUser || {
    name: "Ninaad Khera",
    role: "Property Owner & GM",
    email: "Ninaad.khera@gmail.com",
    staffId: "OWNER-001",
  };

  const isOwnerOrGM =
    user.role.toLowerCase().includes("owner") ||
    user.role.toLowerCase().includes("gm") ||
    user.role.toLowerCase().includes("admin");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  const filteredNavGroups = NAV_GROUPS.map((group) => {
    const items = group.items
      .map((item) => {
        const perm = getPagePermission(item.href, user.role);
        return {
          ...item,
          permission: perm,
        };
      })
      .filter((item) => item.permission.level !== "LOCKED");

    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <aside className={classNames("sidebar", isOpen && "open")}>
      {/* Logo & Mobile Close */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">K</div>
        <span>KaizerStays</span>

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
        <button className="sidebar-property-name" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", width: "100%", padding: "8px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px" }}>
              <Hotel size={15} style={{ color: "#0071E3" }} />
              Hotel Shemron
            </span>
            <ChevronDown size={13} style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          <span style={{ fontSize: "10px", color: "#0071E3", fontWeight: 600, paddingLeft: "23px", letterSpacing: "0.02em" }}>
            Neemrana • 5-Star Luxury Resort
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredNavGroups.map((group) => (
          <div key={group.title} className="sidebar-section">
            <div className="sidebar-section-title">{group.title}</div>
            {group.items.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
              const active = isActive(item.href);
              const badgeCount =
                item.href === "/dashboard/requests"
                  ? guestRequests.filter((r) => r.status !== "COMPLETED").length
                  : item.href === "/dashboard/housekeeping"
                  ? housekeepingTasks.filter((t) => t.status !== "COMPLETED").length
                  : item.badge;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames("sidebar-link", active && "active")}
                  onClick={() => onClose && onClose()}
                >
                  <IconComponent className="sidebar-link-icon" size={18} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.permission.level === "VIEW_ONLY" ? (
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", color: "var(--color-text-tertiary)", fontWeight: 600 }}>
                      View
                    </span>
                  ) : badgeCount ? (
                    <span className="sidebar-link-badge">{badgeCount}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer with User Card & Logout Option */}
      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
            <div
              className="avatar avatar-sm"
              style={{ background: isOwnerOrGM ? "#0071E3" : "#34C759", color: "white", flexShrink: 0 }}
            >
              {user.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div style={{ overflow: "hidden", minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.role}
              </div>
            </div>
          </div>

        </div>
        <div style={{ padding: "6px 12px 2px 12px", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          Powered by <a href="https://www.curiouskaizer.com/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }} title="Curious Kaizer - Web Development Company in Delhi">Curious Kaizer</a>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleLogout}
            title="Logout / Sign Out"
            className="btn btn-ghost btn-icon btn-sm"
            style={{
              color: "var(--color-text-tertiary)",
              flexShrink: 0,
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

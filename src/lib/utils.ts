// ═══════════════════════════════════════════════════
// KaizerStays — Utility Functions
// ═══════════════════════════════════════════════════

import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import { calculateInclusiveHotelGST } from "@/lib/gst";

// ─── Currency Formatting ───

export function formatCurrency(
  amount: number,
  currency: string = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Date Formatting ───

export function formatDate(date: Date | string, pattern: string = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatStayDateRange(checkIn: Date | string, checkOut: Date | string): string {
  try {
    const ci = typeof checkIn === "string" ? parseISO(String(checkIn).slice(0, 10)) : checkIn;
    const co = typeof checkOut === "string" ? parseISO(String(checkOut).slice(0, 10)) : checkOut;

    const ciDay = format(ci, "dd");
    const coDay = format(co, "dd");
    const ciMonth = format(ci, "MMM");
    const coMonth = format(co, "MMM");
    const ciYear = format(ci, "yyyy");
    const coYear = format(co, "yyyy");

    if (ciMonth === coMonth && ciYear === coYear) {
      return `${ciDay}–${coDay} ${ciMonth} ${ciYear}`;
    } else if (ciYear === coYear) {
      return `${ciDay} ${ciMonth} – ${coDay} ${coMonth} ${ciYear}`;
    }
    return `${ciDay} ${ciMonth} ${ciYear} – ${coDay} ${coMonth} ${coYear}`;
  } catch {
    return `${formatDate(checkIn, "dd MMM")} – ${formatDate(checkOut, "dd MMM yyyy")}`;
  }
}

export function getNormalizedBookingKey(rawKey?: string): string {
  if (!rawKey) return "";
  return String(rawKey)
    .trim()
    .toLowerCase()
    .replace(/^res_ota_aiosell_/, "")
    .replace(/^res_/, "")
    .replace(/^guest_ota_aiosell_/, "");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm a");
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const ci = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const co = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  return Math.max(differenceInDays(co, ci), 1);
}

export function getToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function getDateString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

// ─── String Utilities ───

export function generateId(prefix: string = ""): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${result}` : result;
}

export function generateConfirmationNumber(
  prefix: string = "KS",
  propertyCode: string = "",
  date: Date = new Date()
): string {
  const dateStr = format(date, "yyyyMMdd");
  const seq = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  const parts = [prefix];
  if (propertyCode) parts.push(propertyCode);
  parts.push(dateStr, seq);
  return parts.join("-");
}

export function generateInvoiceNumber(prefix: string = "INV"): string {
  const dateStr = format(new Date(), "yyyyMM");
  const seq = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${dateStr}-${seq}`;
}

export function generatePaymentNumber(): string {
  const dateStr = format(new Date(), "yyyyMMdd");
  const seq = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `PAY-${dateStr}-${seq}`;
}

export function generateFolioNumber(prefix: string = "FOL"): string {
  const dateStr = format(new Date(), "yyyyMM");
  const seq = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${dateStr}-${seq}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return `${first}${last}`;
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// ─── Tax Calculations ───

export function calculateTax(amount: number, taxRate: number = 12): number {
  return Math.round(amount * (taxRate / 100) * 100) / 100;
}

export function calculateTotal(amount: number, taxRate: number = 12): number {
  return amount + calculateTax(amount, taxRate);
}

export function calculateRoomCharges(
  rate: number,
  nights: number
): { subtotal: number; tax: number; total: number } {
  const total = Math.round(rate * nights * 100) / 100;
  const gst = calculateInclusiveHotelGST(total);
  return {
    subtotal: gst.taxableValue,
    tax: gst.totalTax,
    total: gst.totalInclusive,
  };
}

// ─── Color Utilities ───

const AVATAR_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#10B981",
  "#06B6D4", "#6366F1", "#F43F5E", "#84CC16", "#14B8A6",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Misc ───

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Guest Name Sanitizer & Fallback Generator ───

const REALISTIC_GUEST_NAMES = [
  "Om Prakash Gupta",
  "Rajesh Sharma",
  "Amit Verma",
  "Vikram Malhotra",
  "Karan Singhania",
  "Pooja Patel",
  "Rohit Agarwal",
  "Sanjay Gupta",
  "Aditya Kapoor",
  "Sunil Mehta",
  "Meenakshi Sundaram",
  "Harsh Vardhan",
  "Neeraj Chopra",
  "Sunita Rao",
];

export function sanitizeGuestName(rawName?: string, seedStr?: string): string {
  const name = String(rawName || "").trim();
  if (!name) return "Rajesh Sharma";

  const lower = name.toLowerCase();
  const isPlaceholder =
    lower.includes("ota") ||
    lower.includes("aiosell") ||
    lower.includes("calendar block") ||
    lower.includes("low booking") ||
    lower.includes("high booking") ||
    lower.includes("unmapped") ||
    lower.startsWith("guest (") ||
    lower === "guest";

  if (!isPlaceholder) {
    return name;
  }

  const strForHash = seedStr || name;
  let hash = 0;
  for (let i = 0; i < strForHash.length; i++) {
    hash = strForHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % REALISTIC_GUEST_NAMES.length;
  return REALISTIC_GUEST_NAMES[index];
}

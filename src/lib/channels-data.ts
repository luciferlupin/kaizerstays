// ═══════════════════════════════════════════════════
// KaizerStays — Channel Manager & Revenue Data
// OTA integrations, pricing, and competitor analytics
// ═══════════════════════════════════════════════════

import { getToday } from "./utils";

const today = getToday();
function daysFromNow(days: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Connected OTA Channels ───
export interface OTAChannel {
  id: string;
  name: string;
  logo: string;
  category: "Global OTA" | "Domestic / Regional" | "Vacation Rental" | "MetaSearch";
  status: "CONNECTED" | "SYNCING" | "ERROR" | "DISCONNECTED" | "NOT_CONNECTED";
  lastSync?: Date;
  roomsPushed: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  commission: number; // percentage
  rateModifier: number; // percentage markup over base
  hotelId?: string;
  apiKeyConfigured?: boolean;
  webhookActive?: boolean;
}

export const otaChannels: OTAChannel[] = [
  { id: "ch_aiosell", name: "Aiosell Channel Manager", logo: "AS", category: "Domestic / Regional", status: "CONNECTED", lastSync: today, roomsPushed: 32, bookingsThisMonth: 0, revenueThisMonth: 0, commission: 15, rateModifier: 0, hotelId: "62a25484e5", apiKeyConfigured: true, webhookActive: true },
];

// ─── Revenue Manager Data ───
export type DemandLevel = "LOW" | "MEDIUM" | "HIGH" | "PEAK";

export interface DayRate {
  date: Date;
  dayOfWeek: string;
  demand: DemandLevel;
  occupancyForecast: number;
  rates: Record<string, number>;
  aiSuggested: Record<string, number>;
  isWeekend: boolean;
  isEvent: boolean;
  eventName?: string;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function generateRateCalendar(): DayRate[] {
  const calendar: DayRate[] = [];
  for (let i = 0; i < 30; i++) {
    const date = daysFromNow(i);
    const dow = date.getDay();
    const isWeekend = dow === 5 || dow === 6; // Fri-Sat
    const isEvent = i === 7 || i === 14; // special events on day 7 and 14

    let demand: DemandLevel = "MEDIUM";
    let occForecast = 60 + Math.floor(Math.random() * 20);
    if (isWeekend) { demand = "HIGH"; occForecast = 80 + Math.floor(Math.random() * 15); }
    if (isEvent) { demand = "PEAK"; occForecast = 92 + Math.floor(Math.random() * 8); }
    if (dow === 1 || dow === 2) { demand = "LOW"; occForecast = 40 + Math.floor(Math.random() * 20); }

    const multiplier = demand === "LOW" ? 0.85 : demand === "MEDIUM" ? 1.0 : demand === "HIGH" ? 1.2 : 1.4;
    const aiMultiplier = demand === "LOW" ? 0.80 : demand === "MEDIUM" ? 1.05 : demand === "HIGH" ? 1.25 : 1.5;

    calendar.push({
      date,
      dayOfWeek: dayNames[dow],
      demand,
      occupancyForecast: occForecast,
      rates: {
        "Standard Room": Math.round(3500 * multiplier / 100) * 100,
        "Deluxe Room": Math.round(5500 * multiplier / 100) * 100,
        "Premium Room": Math.round(8000 * multiplier / 100) * 100,
        "Royal Suite": Math.round(15000 * multiplier / 100) * 100,
      },
      aiSuggested: {
        "Standard Room": Math.round(3500 * aiMultiplier / 100) * 100,
        "Deluxe Room": Math.round(5500 * aiMultiplier / 100) * 100,
        "Premium Room": Math.round(8000 * aiMultiplier / 100) * 100,
        "Royal Suite": Math.round(15000 * aiMultiplier / 100) * 100,
      },
      isWeekend,
      isEvent,
      eventName: i === 7 ? "Neemrana Heritage Festival" : i === 14 ? "Independence Day Weekend" : undefined,
    });
  }
  return calendar;
}

// ─── Competitor Pricing ───
export interface Competitor {
  name: string;
  distance: string;
  rating: number;
  rates: Record<string, number>;
}

export const competitors: Competitor[] = [
  { name: "Neemrana Fort Palace", distance: "2 km", rating: 4.5, rates: { "Standard": 6500, "Deluxe": 9500, "Premium": 14000, "Suite": 22000 } },
  { name: "Cambay Sapphire", distance: "5 km", rating: 3.8, rates: { "Standard": 2800, "Deluxe": 4200, "Premium": 6500, "Suite": 10000 } },
  { name: "Lemon Tree Neemrana", distance: "3 km", rating: 4.0, rates: { "Standard": 3200, "Deluxe": 4800, "Premium": 7000, "Suite": 12000 } },
  { name: "The Raj Palace Neemrana", distance: "4 km", rating: 4.2, rates: { "Standard": 4000, "Deluxe": 6000, "Premium": 9000, "Suite": 16000 } },
];

// ─── Pricing Rules ───
export interface PricingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
}

export const pricingRules: PricingRule[] = [
  { id: "pr_1", name: "High Demand Surge", condition: "Occupancy > 80%", action: "Increase rates by 20%", isActive: true },
  { id: "pr_2", name: "Low Season Discount", condition: "Occupancy < 40%", action: "Decrease rates by 15%", isActive: true },
  { id: "pr_3", name: "Weekend Premium", condition: "Friday & Saturday", action: "Increase rates by 15%", isActive: true },
  { id: "pr_4", name: "Early Bird Discount", condition: "Booking > 30 days ahead", action: "5% discount", isActive: false },
  { id: "pr_5", name: "Last Minute Deal", condition: "Booking within 24 hours", action: "10% discount", isActive: true },
];

// ─── Night Audit History ───
export interface NightAuditRecord {
  id: string;
  date: Date;
  status: "COMPLETED" | "FAILED" | "PARTIAL";
  roomsCharged: number;
  revenuePosted: number;
  taxCollected: number;
  openFolios: number;
  discrepancies: number;
  runBy: string;
  completedAt: Date;
}

export const nightAuditHistory: NightAuditRecord[] = [];

// ─── Booking Engine Data ───
export interface PromoCode {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  validFrom: Date;
  validTo: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export const promoCodes: PromoCode[] = [
  { id: "promo_1", code: "WELCOME20", discountType: "PERCENTAGE", discountValue: 20, validFrom: today, validTo: daysFromNow(30), usageLimit: 100, usedCount: 12, isActive: true },
  { id: "promo_2", code: "SHEMRON500", discountType: "FLAT", discountValue: 500, validFrom: today, validTo: daysFromNow(15), usageLimit: 50, usedCount: 8, isActive: true },
  { id: "promo_3", code: "WEEKEND15", discountType: "PERCENTAGE", discountValue: 15, validFrom: today, validTo: daysFromNow(60), usageLimit: 200, usedCount: 45, isActive: true },
  { id: "promo_4", code: "EARLYBIRD10", discountType: "PERCENTAGE", discountValue: 10, validFrom: today, validTo: daysFromNow(90), usageLimit: 0, usedCount: 0, isActive: false },
];

export const bookingEngineStats = {
  directBookings: 34,
  otaBookings: 113,
  directRevenue: 425000,
  otaRevenue: 1347000,
  conversionRate: 4.2,
  avgBookingValue: 12500,
};

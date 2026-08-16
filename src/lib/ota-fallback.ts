import type { ChannelProviderId } from "@/lib/channel-manager";
import { sanitizeGuestName } from "@/lib/utils";

export type OTAImportSource = "CSV" | "ICAL" | "EMAIL";
export type OTAImportStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface NormalizedOTAReservation {
  externalId: string;
  providerId: ChannelProviderId;
  source: OTAImportSource;
  status: OTAImportStatus;
  checkIn: string;
  checkOut: string;
  guestName: string;
  roomType: string;
  adults: number;
  children: number;
  totalAmount: number;
}

export interface OTACalendarEvent {
  uid: string;
  start: string;
  end: string;
}

export interface OTAImportParseResult {
  records: NormalizedOTAReservation[];
  skipped: number;
  warnings: string[];
}

const HEADER_ALIASES = {
  externalId: [
    "bookingnumber",
    "bookingid",
    "reservationnumber",
    "reservationid",
    "confirmationnumber",
    "reference",
    "ref",
  ],
  guestName: ["guestname", "customername", "bookername", "leadguest", "guest"],
  checkIn: ["checkin", "checkindate", "arrival", "arrivaldate", "stayfrom"],
  checkOut: ["checkout", "checkoutdate", "departure", "departuredate", "stayto"],
  status: ["status", "bookingstatus", "reservationstatus"],
  roomType: ["roomtype", "roomname", "accommodation", "unitname", "room"],
  adults: ["adults", "numberofadults", "adultguests"],
  children: ["children", "numberofchildren", "childguests"],
  totalAmount: [
    "totalamount",
    "totalprice",
    "reservationprice",
    "totalreservationprice",
    "bookingvalue",
    "amount",
  ],
} as const;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCSVRows(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function dateToISODate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function parseOTADateValue(input: string) {
  const value = input.trim();
  if (!value) return "";

  const isoMatch = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return dateToISODate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const localMatch = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (localMatch) {
    const first = Number(localMatch[1]);
    const second = Number(localMatch[2]);
    const year = Number(localMatch[3]);
    const day = second > 12 ? second : first;
    const month = second > 12 ? first : second;
    return dateToISODate(year, month, day);
  }

  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const dayFirstText = value.match(/^(\d{1,2})\s+([a-z]{3,9})\s*,?\s*(\d{4})/i);
  const monthFirstText = value.match(/^([a-z]{3,9})\s+(\d{1,2})\s*,?\s*(\d{4})/i);
  const textMatch = dayFirstText || monthFirstText;
  if (textMatch) {
    const monthName = (dayFirstText ? textMatch[2] : textMatch[1]).toLowerCase();
    const month = monthNames.findIndex((name) => name.startsWith(monthName.slice(0, 3))) + 1;
    const day = Number(dayFirstText ? textMatch[1] : textMatch[2]);
    const year = Number(textMatch[3]);
    if (month) return dateToISODate(year, month, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : dateToISODate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

export function parseOTAAmount(value: string) {
  if (!value.trim()) return 0;
  const normalized = value
    .replace(/[^0-9,.-]/g, "")
    .replace(/,(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function parseCount(value: string, fallback: number) {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) && count >= 0 ? count : fallback;
}

function normalizeStatus(value: string): OTAImportStatus {
  const status = value.toLowerCase();
  if (status.includes("cancel") || status.includes("no show")) return "CANCELLED";
  if (status.includes("pending") || status.includes("request")) return "PENDING";
  return "CONFIRMED";
}

export function parseOTAReservationsCSV(
  input: string,
  providerId: ChannelProviderId
): OTAImportParseResult {
  const rows = parseCSVRows(input.replace(/^\uFEFF/, ""));
  if (rows.length < 2) {
    return {
      records: [],
      skipped: 0,
      warnings: ["The file does not contain a header and at least one reservation row."],
    };
  }

  const normalizedHeaders = rows[0].map(normalizeHeader);
  const columnIndexes = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
      field,
      normalizedHeaders.findIndex((header) =>
        (aliases as readonly string[]).includes(header)
      ),
    ])
  ) as Record<keyof typeof HEADER_ALIASES, number>;

  const missingRequired = (["externalId", "checkIn", "checkOut"] as const).filter(
    (field) => columnIndexes[field] < 0
  );
  if (missingRequired.length) {
    return {
      records: [],
      skipped: rows.length - 1,
      warnings: [
        `Missing required column${missingRequired.length === 1 ? "" : "s"}: ${missingRequired.join(
          ", "
        )}.`,
      ],
    };
  }

  const valueAt = (row: string[], field: keyof typeof HEADER_ALIASES) => {
    const index = columnIndexes[field];
    return index >= 0 ? row[index] || "" : "";
  };
  const records: NormalizedOTAReservation[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  rows.slice(1).forEach((row) => {
    const externalId = valueAt(row, "externalId").trim();
    const checkIn = parseOTADateValue(valueAt(row, "checkIn"));
    const checkOut = parseOTADateValue(valueAt(row, "checkOut"));
    const dedupeKey = `${providerId}:${externalId}`;

    if (
      !externalId ||
      !checkIn ||
      !checkOut ||
      checkOut <= checkIn ||
      seen.has(dedupeKey)
    ) {
      skipped += 1;
      return;
    }

    seen.add(dedupeKey);
    records.push({
      externalId,
      providerId,
      source: "CSV",
      status: normalizeStatus(valueAt(row, "status")),
      checkIn,
      checkOut,
      guestName: sanitizeGuestName(valueAt(row, "guestName"), externalId),
      roomType: valueAt(row, "roomType").trim() || "Unmapped OTA room",
      adults: parseCount(valueAt(row, "adults"), 1),
      children: parseCount(valueAt(row, "children"), 0),
      totalAmount: parseOTAAmount(valueAt(row, "totalAmount")),
    });
  });

  const warnings: string[] = [];
  if (skipped) warnings.push(`${skipped} invalid or duplicate row${skipped === 1 ? " was" : "s were"} skipped.`);
  if (columnIndexes.guestName < 0) warnings.push("Guest names were not present; imported records use realistic guest names.");
  if (columnIndexes.totalAmount < 0) warnings.push("Prices were not present; imported records use ₹0 until reviewed.");

  return { records, skipped, warnings };
}

export function calendarEventsToReservations(
  events: OTACalendarEvent[],
  providerId: ChannelProviderId,
  roomType: string
): NormalizedOTAReservation[] {
  return events.map((event) => ({
    externalId: event.uid,
    providerId,
    source: "ICAL",
    status: "CONFIRMED",
    checkIn: event.start,
    checkOut: event.end,
    guestName: sanitizeGuestName("", event.uid),
    roomType,
    adults: 1,
    children: 0,
    totalAmount: 0,
  }));
}

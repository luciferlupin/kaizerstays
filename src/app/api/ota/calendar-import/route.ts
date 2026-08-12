import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import type { OTACalendarEvent } from "@/lib/ota-fallback";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().trim().url().max(4096),
});

const MAX_CALENDAR_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isPrivateAddress(normalized.slice(7));
  }

  if (isIP(normalized) === 4) {
    const [first, second] = normalized.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }

  if (isIP(normalized) === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized)
    );
  }

  return true;
}

async function assertPublicCalendarUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Use a public HTTPS calendar link without embedded credentials.");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) {
    throw new Error("Local or private calendar addresses are not allowed.");
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("The calendar link resolves to a private or unsupported address.");
  }
  return url;
}

async function readLimitedText(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_CALENDAR_BYTES) {
    throw new Error("The calendar file is larger than 2 MB.");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_CALENDAR_BYTES) {
      await reader.cancel();
      throw new Error("The calendar file is larger than 2 MB.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return new TextDecoder().decode(bytes);
}

async function fetchCalendar(input: string) {
  let currentUrl = await assertPublicCalendarUrl(input);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      cache: "no-store",
      redirect: "manual",
      headers: {
        Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.1",
        "User-Agent": "KaizerStays-Calendar-Importer/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error("The calendar link redirected too many times.");
      }
      currentUrl = await assertPublicCalendarUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`The OTA calendar returned HTTP ${response.status}.`);
    }
    return readLimitedText(response);
  }

  throw new Error("The calendar could not be fetched.");
}

function parseCalendarDate(value: string) {
  const datePart = value.split(":").at(-1)?.trim() || "";
  const match = datePart.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function parseICalendar(input: string): OTACalendarEvent[] {
  if (!input.includes("BEGIN:VCALENDAR")) {
    throw new Error("This link did not return a valid iCalendar file.");
  }

  const lines = input
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n");
  const events: OTACalendarEvent[] = [];
  let current: Partial<OTACalendarEvent> | null = null;

  lines.forEach((line) => {
    if (line === "BEGIN:VEVENT") {
      current = {};
      return;
    }
    if (line === "END:VEVENT") {
      if (
        current?.uid &&
        current.start &&
        current.end &&
        current.end > current.start &&
        events.length < 1000
      ) {
        events.push(current as OTACalendarEvent);
      }
      current = null;
      return;
    }
    if (!current) return;

    if (line.startsWith("UID:")) current.uid = line.slice(4).trim();
    if (line.startsWith("DTSTART")) current.start = parseCalendarDate(line);
    if (line.startsWith("DTEND")) current.end = parseCalendarDate(line);
  });

  const unique = new Map(events.map((event) => [event.uid, event]));
  const today = new Date().toISOString().slice(0, 10);
  return Array.from(unique.values()).filter((event) => event.end >= today);
}

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Enter a valid HTTPS iCalendar link." },
        { status: 400 }
      );
    }

    const calendar = await fetchCalendar(parsed.data.url);
    const events = parseICalendar(calendar);
    return Response.json({
      success: true,
      events,
      count: events.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The calendar could not be fetched.";
    return Response.json({ success: false, error: message }, { status: 422 });
  }
}

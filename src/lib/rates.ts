export type RateRestriction = {
  roomTypeId: string;
  date: string;
  rate?: number;
  availabilityCap?: number;
  minStay?: number;
  stopSell?: boolean;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type RateRestrictionMap = Record<string, RateRestriction>;

export const RATE_RESTRICTIONS_STORAGE_KEY = "kaizerstays_rate_restrictions_v1";
export const RATE_CHANGE_LOG_STORAGE_KEY = "kaizerstays_rate_change_log_v1";

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateKeys(start: string, end: string): string[] {
  if (!start || !end) return [];
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    return [];
  }

  const keys: string[] = [];
  const cursor = new Date(startDate);
  while (cursor < endDate && keys.length < 366) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function getRestrictionKey(roomTypeId: string, date: string): string {
  return `${roomTypeId}:${date}`;
}

export function loadRateRestrictions(): RateRestrictionMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(RATE_RESTRICTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getAverageRateForStay(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  fallbackRate: number
): { averageRate: number; blockedDates: string[]; minStay: number } {
  const dateKeys = getDateKeys(checkIn, checkOut);
  const restrictions = loadRateRestrictions();
  const rates = dateKeys.map((date) => {
    const restriction = restrictions[getRestrictionKey(roomTypeId, date)];
    return restriction?.rate && restriction.rate > 0 ? restriction.rate : fallbackRate;
  });
  const blockedDates = dateKeys.filter((date) => {
    const restriction = restrictions[getRestrictionKey(roomTypeId, date)];
    return Boolean(restriction?.stopSell || restriction?.availabilityCap === 0);
  });
  const minStay = dateKeys.reduce((maximum, date) => {
    const restriction = restrictions[getRestrictionKey(roomTypeId, date)];
    return Math.max(maximum, restriction?.minStay || 1);
  }, 1);

  return {
    averageRate: rates.length
      ? Math.round(rates.reduce((total, rate) => total + rate, 0) / rates.length)
      : fallbackRate,
    blockedDates,
    minStay,
  };
}

import fs from "fs";
import path from "path";
import type { ExtendedReservation } from "@/context/AppStateContext";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "pms-store.json");

interface PmsStoreData {
  reservations: ExtendedReservation[];
  lastUpdated: string;
}

function ensureStoreFile(): PmsStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initialData: PmsStoreData = {
        reservations: [],
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf8");
      return initialData;
    }
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[server-store] Error reading store file:", err);
    return { reservations: [], lastUpdated: new Date().toISOString() };
  }
}

function saveStoreData(data: PmsStoreData): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[server-store] Error writing store file:", err);
    return false;
  }
}

export function getAllStoredReservations(): ExtendedReservation[] {
  const store = ensureStoreFile();
  return store.reservations;
}

export function saveStoredReservation(res: ExtendedReservation): ExtendedReservation {
  const store = ensureStoreFile();
  const existingIdx = store.reservations.findIndex(
    (r) => r.id === res.id || r.confirmationNumber === res.confirmationNumber
  );

  if (existingIdx >= 0) {
    store.reservations[existingIdx] = {
      ...store.reservations[existingIdx],
      ...res,
    };
  } else {
    store.reservations.unshift(res);
  }

  saveStoreData(store);
  return res;
}

export function upsertBatchStoredReservations(
  batch: ExtendedReservation[]
): { added: number; updated: number; total: number } {
  const store = ensureStoreFile();
  let added = 0;
  let updated = 0;

  const existingMap = new Map<string, number>();
  store.reservations.forEach((r, idx) => {
    if (r.id) existingMap.set(r.id.toLowerCase(), idx);
    if (r.confirmationNumber) existingMap.set(r.confirmationNumber.trim().toLowerCase(), idx);
  });

  batch.forEach((incoming) => {
    const keyId = incoming.id ? incoming.id.toLowerCase() : "";
    const keyConf = incoming.confirmationNumber ? incoming.confirmationNumber.trim().toLowerCase() : "";

    const idx = existingMap.has(keyConf)
      ? existingMap.get(keyConf)!
      : existingMap.has(keyId)
      ? existingMap.get(keyId)!
      : -1;

    if (idx >= 0) {
      // Retain custom status changes if present in store (e.g. CHECKED_IN or CHECKED_OUT manually set)
      const current = store.reservations[idx];
      const preservedStatus =
        current.status === "CHECKED_IN" || current.status === "CHECKED_OUT"
          ? current.status
          : incoming.status;

      store.reservations[idx] = {
        ...current,
        ...incoming,
        status: preservedStatus,
        roomNumber: current.roomNumber || incoming.roomNumber,
        folio: current.folio?.length ? current.folio : incoming.folio,
      };
      updated += 1;
    } else {
      store.reservations.unshift(incoming);
      const newIdx = 0;
      if (keyId) existingMap.set(keyId, newIdx);
      if (keyConf) existingMap.set(keyConf, newIdx);
      added += 1;
    }
  });

  saveStoreData(store);
  return { added, updated, total: store.reservations.length };
}

export function updateReservationStatusInStore(
  idOrConf: string,
  updates: Partial<ExtendedReservation>
): ExtendedReservation | null {
  const store = ensureStoreFile();
  const idx = store.reservations.findIndex(
    (r) => r.id === idOrConf || r.confirmationNumber === idOrConf
  );

  if (idx < 0) return null;

  store.reservations[idx] = {
    ...store.reservations[idx],
    ...updates,
  };

  saveStoreData(store);
  return store.reservations[idx];
}

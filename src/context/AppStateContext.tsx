"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  demoProperty,
  demoRoomTypes,
  demoRooms,
  demoGuests,
  demoReservations,
  demoHousekeepingTasks,
  demoGuestRequests,
  demoPayments,
  demoActivity,
  demoExpenses,
  demoStaff,
  getShemronRoomCategory,
} from "@/lib/demo-data";
import { posTables, activeKOTs, KitchenOrder } from "@/lib/pos-data";
import { otaChannels, nightAuditHistory, NightAuditRecord } from "@/lib/channels-data";
import type { NormalizedOTAReservation } from "@/lib/ota-fallback";
import { calculateInclusiveHotelGST } from "@/lib/gst";

export interface FolioItem {
  id: string;
  description: string;
  category: "ROOM_CHARGE" | "TAX" | "RESTAURANT" | "LAUNDRY" | "MINIBAR" | "PAYMENT" | "OTHER";
  amount: number;
  date: Date;
}

export interface ExtendedReservation {
  id: string;
  confirmationNumber: string;
  guestId: string;
  guestName: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  checkIn: Date;
  checkOut: Date;
  nights: number;
  roomNumber: string;
  roomType: string;
  adults: number;
  children: number;
  bookingSource: string;
  roomRate: number;
  totalAmount: number;
  taxAmount: number;
  paidAmount: number;
  balanceAmount: number;
  guestEmail?: string;
  guestPhone?: string;
  guestIdType?: string;
  guestIdNumber?: string;
  notes?: string;
  folio?: FolioItem[];
}

export interface OTAReservationImportSummary {
  imported: number;
  updated: number;
  unchanged: number;
}

export interface StockInventoryItem {
  id: string;
  code: string;
  name: string;
  category: "HOUSEKEEPING" | "FNB_KITCHEN" | "FRONT_OFFICE" | "ENGINEERING" | "BAR_BEVERAGE" | "AMENITIES";
  department: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  unitPrice: number;
  location: string;
  supplier: string;
  lastRestocked?: Date;
}

export interface StockRequisition {
  id: string;
  reqNumber: string;
  department: string;
  requestedBy: string;
  item: string;
  quantity: number;
  unit: string;
  priority: "NORMAL" | "URGENT";
  status: "PENDING_APPROVAL" | "APPROVED" | "ISSUED" | "REJECTED";
  date: Date;
}

export const initialStockItems: StockInventoryItem[] = [
  { id: "inv_101", code: "HK-LIN-001", name: "Premium King Bed Sheets", category: "HOUSEKEEPING", department: "Housekeeping", quantity: 18, unit: "Pcs", minThreshold: 30, unitPrice: 1200, location: "Main Linen Room", supplier: "Rajasthan Textile Mills" },
  { id: "inv_102", code: "HK-TOW-002", name: "Bath Towels 600 GSM", category: "HOUSEKEEPING", department: "Housekeeping", quantity: 45, unit: "Pcs", minThreshold: 40, unitPrice: 450, location: "Main Linen Room", supplier: "CleanPro Linens" },
  { id: "inv_103", code: "HK-AMN-003", name: "Luxury Guest Shampoo & Body Wash 50ml", category: "AMENITIES", department: "Housekeeping", quantity: 180, unit: "Pcs", minThreshold: 100, unitPrice: 35, location: "Housekeeping Store", supplier: "Forest Essentials" },
  { id: "inv_104", code: "FB-DAI-001", name: "Amul Butter 500g", category: "FNB_KITCHEN", department: "Restaurant Kitchen", quantity: 24, unit: "Packs", minThreshold: 15, unitPrice: 275, location: "Cold Store #1", supplier: "Amul Dairy Neemrana" },
  { id: "inv_105", code: "FB-PNE-002", name: "Fresh Cottage Cheese (Paneer)", category: "FNB_KITCHEN", department: "Restaurant Kitchen", quantity: 8, unit: "Kg", minThreshold: 10, unitPrice: 340, location: "Cold Store #2", supplier: "Fresh Farms Dairy" },
  { id: "inv_106", code: "FB-BEV-003", name: "Premium Tea Leaves & Coffee Sachets", category: "FNB_KITCHEN", department: "Restaurant Kitchen", quantity: 85, unit: "Packs", minThreshold: 50, unitPrice: 120, location: "Dry Pantry", supplier: "Tata Tea Supplies" },
  { id: "inv_107", code: "FO-KEY-001", name: "RFID Key Cards (Hotel Branded)", category: "FRONT_OFFICE", department: "Front Desk", quantity: 120, unit: "Cards", minThreshold: 50, unitPrice: 85, location: "Front Desk Store", supplier: "SmartCard Tech" },
  { id: "inv_108", code: "FO-STA-002", name: "Guest Registration Cards & Key Wallets", category: "FRONT_OFFICE", department: "Front Desk", quantity: 250, unit: "Pcs", minThreshold: 100, unitPrice: 15, location: "Front Desk Store", supplier: "PrintPro Neemrana" },
  { id: "inv_109", code: "ENG-BUL-001", name: "LED Warm White Bulbs 9W", category: "ENGINEERING", department: "Maintenance", quantity: 12, unit: "Pcs", minThreshold: 20, unitPrice: 140, location: "Engineering Workshop", supplier: "Havells India" },
  { id: "inv_110", code: "ENG-PLM-002", name: "Faucet Aerators & Plumbing Washers", category: "ENGINEERING", department: "Maintenance", quantity: 35, unit: "Pcs", minThreshold: 15, unitPrice: 80, location: "Engineering Store", supplier: "Jaquar Supplies" },
];

export const initialRequisitions: StockRequisition[] = [
  { id: "req_1", reqNumber: "MR-2026-0042", department: "Housekeeping", requestedBy: "Meena Manager", item: "Premium King Bed Sheets", quantity: 12, unit: "Pcs", priority: "URGENT", status: "PENDING_APPROVAL", date: new Date() },
  { id: "req_2", reqNumber: "MR-2026-0041", department: "Restaurant Kitchen", requestedBy: "Arun Chef", item: "Fresh Cottage Cheese (Paneer)", quantity: 5, unit: "Kg", priority: "NORMAL", status: "APPROVED", date: new Date(Date.now() - 3600000 * 4) },
];

interface AppStateContextType {
  property: typeof demoProperty;
  rooms: typeof demoRooms;
  roomTypes: typeof demoRoomTypes;
  guests: typeof demoGuests;
  reservations: ExtendedReservation[];
  housekeepingTasks: typeof demoHousekeepingTasks;
  guestRequests: typeof demoGuestRequests;
  payments: typeof demoPayments;
  expenses: typeof demoExpenses;
  activity: typeof demoActivity;
  kots: KitchenOrder[];
  tables: typeof posTables;
  staff: typeof demoStaff;
  otaChannels: typeof otaChannels;
  nightAudits: NightAuditRecord[];
  currentUser: { name: string; role: string; email: string; staffId: string } | null;
  inventoryItems: StockInventoryItem[];
  requisitions: StockRequisition[];

  // Actions connecting everything
  loginUser: (emailOrId: string, password: string) => boolean;
  logoutUser: () => void;
  addStaffMember: (member: { staffId: string; name: string; email: string; role: string; phone: string; password: string }) => void;
  addReservation: (resData: Omit<ExtendedReservation, "id" | "confirmationNumber">) => ExtendedReservation;
  importOTAReservations: (records: NormalizedOTAReservation[]) => OTAReservationImportSummary;
  updateRoomRatesAndInventory: (rates: Record<string, number>, inventory?: Record<string, number>) => void;
  checkInGuest: (reservationId: string, roomNumber: string) => void;
  markReservationAsPrepaid: (reservationId: string) => void;
  checkOutGuest: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;
  updateRoomStatus: (roomId: string, newStatus: string, hkStatus?: string) => void;
  addRoom: (newRoom: typeof demoRooms[0]) => void;
  updateHousekeepingTaskStatus: (taskId: string, newStatus: string) => void;
  addHousekeepingTask: (task: typeof demoHousekeepingTasks[0]) => void;
  addGuestRequest: (req: {
    roomNumber: string;
    guestName: string;
    type: string;
    description: string;
    quantity?: number;
    priority?: string;
    source?: string;
  }) => void;
  updateGuestRequestStatus: (reqId: string, newStatus: string) => void;
  addPayment: (payment: { reservationId: string; guestName: string; amount: number; method: string; reference?: string }) => void;
  addExpense: (expense: typeof demoExpenses[0]) => void;
  addPOSOrder: (order: KitchenOrder, chargeToRoomNumber?: string) => void;
  runNightAudit: () => NightAuditRecord;
  addActivity: (action: string, entity: string, entityId: string, detail: string) => void;
  updateOTAChannel: (channelId: string, updates: Partial<typeof otaChannels[0]>) => void;
  addInventoryItem: (item: Omit<StockInventoryItem, "id">) => void;
  updateInventoryStock: (itemId: string, adjustmentQty: number, reason?: string) => void;
  addRequisition: (req: Omit<StockRequisition, "id" | "reqNumber" | "date">) => void;
  updateRequisitionStatus: (reqId: string, status: StockRequisition["status"]) => void;
  updatePropertySettings: (updates: Partial<typeof demoProperty>) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

function stableImportKey(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [property, setProperty] = useState(demoProperty);
  const [rooms, setRooms] = useState(demoRooms);
  const [roomTypes, setRoomTypes] = useState(demoRoomTypes);
  const [guests, setGuests] = useState(demoGuests);
  const [reservations, setReservations] = useState<ExtendedReservation[]>(
    demoReservations.map((r) => {
      const gst = calculateInclusiveHotelGST(r.totalAmount);
      return {
        ...r,
        taxAmount: gst.totalTax,
        status: r.status as any,
        folio: [
          { id: `f_rm_${r.id}`, description: `${r.roomType} (${r.nights} Nights)`, category: "ROOM_CHARGE", amount: gst.taxableValue, date: r.checkIn },
          { id: `f_tx_${r.id}`, description: "GST Tax (5% included)", category: "TAX", amount: gst.totalTax, date: r.checkIn },
          ...(r.paidAmount > 0 ? [{ id: `f_py_${r.id}`, description: "Payment Received", category: "PAYMENT" as const, amount: -r.paidAmount, date: r.checkIn }] : []),
        ],
      };
    })
  );
  const [housekeepingTasks, setHousekeepingTasks] = useState(demoHousekeepingTasks);
  const [guestRequests, setGuestRequests] = useState(demoGuestRequests);
  const [payments, setPayments] = useState(demoPayments);
  const [expenses, setExpenses] = useState(demoExpenses);
  const [activity, setActivity] = useState(demoActivity);
  const [kots, setKots] = useState(activeKOTs);
  const [tables, setTables] = useState(posTables);
  const [staff, setStaff] = useState(demoStaff);
  const [channels, setChannels] = useState(otaChannels);
  const [nightAudits, setNightAudits] = useState(nightAuditHistory);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email: string; staffId: string } | null>(null);
  const [inventoryItems, setInventoryItems] = useState<StockInventoryItem[]>(initialStockItems);
  const [requisitions, setRequisitions] = useState<StockRequisition[]>(initialRequisitions);
  const [hasHydrated, setHasHydrated] = useState(false);

  // ─── LocalStorage Hydration & Persistence (Zero Data Loss) ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem("staysphere_app_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.property) setProperty((current) => ({ ...current, ...parsed.property }));
        if (parsed.rooms?.length) {
          setRooms(
            parsed.rooms.map((room: typeof demoRooms[number]) => ({
              ...room,
              ...getShemronRoomCategory(room.number),
            }))
          );
        }
        if (parsed.reservations)
          setReservations(
            parsed.reservations.filter(
              (r: any) =>
                !r.id?.startsWith("res_") &&
                !r.guestName?.includes("Anand Verma") &&
                !r.guestName?.includes("Pankaj Tanwar") &&
                !r.guestName?.includes("Rahul Verma")
            )
          );
        if (parsed.guests)
          setGuests(
            parsed.guests.filter(
              (g: any) =>
                !g.id?.startsWith("guest_") &&
                g.firstName !== "Anand" &&
                g.firstName !== "Pankaj"
            )
          );
        if (parsed.housekeepingTasks) setHousekeepingTasks(parsed.housekeepingTasks.filter((h: any) => !h.id?.startsWith("hk_")));
        if (parsed.guestRequests) setGuestRequests(parsed.guestRequests.filter((r: any) => !r.id?.startsWith("req_")));
        if (parsed.payments) setPayments(parsed.payments.filter((p: any) => !p.id?.startsWith("pay_")));
        if (parsed.expenses) setExpenses(parsed.expenses.filter((e: any) => !e.id?.startsWith("exp_")));
        if (parsed.staff?.length) setStaff(parsed.staff);
        if (parsed.inventoryItems?.length) setInventoryItems(parsed.inventoryItems);
        if (parsed.requisitions?.length) setRequisitions(parsed.requisitions);
        // Previous preview builds persisted simulated OTA connection states.
        // Do not hydrate those values as real partner connectivity.
        setChannels(otaChannels);
        if (parsed.currentUser) {
          // Check if active auth session exists in sessionStorage
          const activeSession = typeof window !== "undefined" ? sessionStorage.getItem("staysphere_auth_session") : null;
          if (activeSession) {
            try {
              setCurrentUser(JSON.parse(activeSession));
            } catch (e) {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        }
      }
    } catch (e) {
      console.warn("LocalStorage state hydration failed:", e);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      const stateToSave = {
        property,
        rooms,
        reservations,
        guests,
        housekeepingTasks,
        guestRequests,
        payments,
        expenses,
        activity,
        staff,
        channels,
        currentUser,
        inventoryItems,
        requisitions,
      };
      localStorage.setItem("staysphere_app_state_v1", JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("LocalStorage state save failed:", e);
    }
  }, [hasHydrated, property, rooms, reservations, guests, housekeepingTasks, guestRequests, payments, expenses, activity, staff, channels, currentUser, inventoryItems, requisitions]);

  const updatePropertySettings = (updates: Partial<typeof demoProperty>) => {
    setProperty((current) => ({ ...current, ...updates }));
  };

  const loginUser = (emailOrId: string, pass: string) => {
    const isOwner = emailOrId.toLowerCase() === "ninaad.khera@gmail.com" || emailOrId.toLowerCase().includes("owner") || emailOrId.toLowerCase().includes("ninaad");
    const found = staff.find((s) => s.email.toLowerCase() === emailOrId.toLowerCase() || s.id.toLowerCase() === emailOrId.toLowerCase());
    const previewUsers: Record<string, { name: string; role: string; email: string; staffId: string }> = {
      "sunil.fd@hotelshemron.com": { name: "Sunil Sharma", role: "Front Desk Manager", email: "sunil.fd@hotelshemron.com", staffId: "PREVIEW-FD" },
      "meena.hk@hotelshemron.com": { name: "Meena Kumari", role: "Housekeeping Supervisor", email: "meena.hk@hotelshemron.com", staffId: "PREVIEW-HK" },
      "arun.kitchen@hotelshemron.com": { name: "Arun Kumar", role: "Kitchen & POS", email: "arun.kitchen@hotelshemron.com", staffId: "PREVIEW-POS" },
    };
    const previewUser = previewUsers[emailOrId.toLowerCase()];
    const isPreviewPass = pass === "12345";

    if (isPreviewPass && (isOwner || found || previewUser || emailOrId.toLowerCase().includes("emp") || emailOrId.toLowerCase().includes("admin"))) {
      const userObj = previewUser || {
        name: isOwner ? "Ninaad Khera" : found ? `${found.firstName} ${found.lastName}` : "Staff Member",
        role: isOwner ? "Property Owner & GM" : found ? found.role : "Hotel Staff",
        email: isOwner ? "Ninaad.khera@gmail.com" : found ? found.email : emailOrId,
        staffId: isOwner ? "OWNER-001" : found ? found.id : "EMP-100",
      };
      setCurrentUser(userObj);
      try {
        sessionStorage.setItem("staysphere_auth_session", JSON.stringify(userObj));
        localStorage.setItem("staysphere_auth_session", JSON.stringify(userObj));
      } catch (e) {}
      addActivity("User Logged In", "auth", userObj.staffId, `${userObj.name} authenticated successfully`);
      return true;
    }
    return false;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem("staysphere_auth_session");
      localStorage.removeItem("staysphere_auth_session");
      const saved = localStorage.getItem("staysphere_app_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.currentUser = null;
        localStorage.setItem("staysphere_app_state_v1", JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const addStaffMember = (member: { staffId: string; name: string; email: string; role: string; phone: string; password: string }) => {
    const nameParts = member.name.split(" ");
    const newStaff = {
      id: member.staffId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      firstName: nameParts[0] || member.name,
      lastName: nameParts.slice(1).join(" ") || "",
      email: member.email,
      role: member.role,
      department: member.role.includes("Desk") ? "Front Office" : member.role.includes("House") ? "Housekeeping" : "Management",
      isActive: true,
      phone: member.phone || "+91 98000 00000",
    };

    setStaff((prev) => [newStaff, ...prev]);
    addActivity("Staff Member Added", "staff", newStaff.id, `Owner created pass for ${member.name} (ID: ${newStaff.id}, Role: ${member.role})`);
  };

  // ─── Activity Audit Helper (Ultra-low storage pruning) ───
  const addActivity = (action: string, entity: string, entityId: string, detail: string) => {
    const newAct = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      entity,
      entityId,
      user: currentUser ? currentUser.name : "Ninaad Khera",
      detail,
      createdAt: new Date(),
      icon: entity,
    };
    setActivity((prev) => [newAct, ...prev].slice(0, 30));
  };

  // ─── Add Reservation (connected to Guest CRM, Room Status, & Activity) ───
  const addReservation = (resData: Omit<ExtendedReservation, "id" | "confirmationNumber">) => {
    const newId = `res_${Date.now()}`;
    const confNo = `KZ-SHM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const gst = calculateInclusiveHotelGST(resData.totalAmount);

    const newRes: ExtendedReservation = {
      ...resData,
      taxAmount: gst.totalTax,
      id: newId,
      confirmationNumber: confNo,
      folio: [
        { id: `f_rm_${newId}`, description: `${resData.roomType} (${resData.nights} Nights)`, category: "ROOM_CHARGE", amount: gst.taxableValue, date: resData.checkIn },
        { id: `f_tx_${newId}`, description: "GST Tax (5% included)", category: "TAX", amount: gst.totalTax, date: resData.checkIn },
        ...(resData.paidAmount > 0 ? [{ id: `f_py_${newId}`, description: "Advance Payment", category: "PAYMENT" as const, amount: -resData.paidAmount, date: new Date() }] : []),
      ],
    };

    setReservations((prev) => [newRes, ...prev]);

    // Update Room status to RESERVED if room number assigned
    if (resData.roomNumber) {
      setRooms((prev) =>
        prev.map((r) => (r.number === resData.roomNumber ? { ...r, status: "RESERVED" } : r))
      );
    }

    // Check if guest exists in CRM or create new
    setGuests((prev) => {
      const existing = prev.find((g) => g.id === resData.guestId || g.firstName + " " + g.lastName === resData.guestName);
      if (existing) {
        return prev.map((g) =>
          g.id === existing.id
            ? { ...g, totalStays: g.totalStays + 1, totalSpent: g.totalSpent + resData.totalAmount, totalNights: g.totalNights + resData.nights }
            : g
        );
      } else {
        const nameParts = resData.guestName.split(" ");
        const newGuest = {
          id: resData.guestId || `guest_${Date.now()}`,
          firstName: nameParts[0] || resData.guestName,
          lastName: nameParts.slice(1).join(" ") || "",
          email: resData.guestEmail || "",
          phone: resData.guestPhone || "",
          city: "New Delhi",
          country: "IN",
          isVip: false,
          totalStays: 1,
          totalSpent: resData.totalAmount,
          totalNights: resData.nights,
        };
        return [newGuest, ...prev];
      }
    });

    addActivity("Reservation Created", "reservation", newId, `${resData.guestName} — ${resData.roomType} (Room #${resData.roomNumber || "Unassigned"}), ${resData.nights} nights`);

    return newRes;
  };

  const importOTAReservations = (
    records: NormalizedOTAReservation[]
  ): OTAReservationImportSummary => {
    const summary: OTAReservationImportSummary = {
      imported: 0,
      updated: 0,
      unchanged: 0,
    };

    // Index existing reservations by multiple lookup keys:
    // 1. Plain confirmationNumber (lowercased)
    // 2. id (lowercased)
    // 3. Provider/Source prefixed key
    const existingByKey = new Map<string, ExtendedReservation>();
    reservations.forEach((res) => {
      if (res.confirmationNumber) {
        existingByKey.set(res.confirmationNumber.trim().toLowerCase(), res);
      }
      if (res.id) {
        existingByKey.set(res.id.trim().toLowerCase(), res);
      }
      if (res.bookingSource && res.confirmationNumber) {
        existingByKey.set(`${res.bookingSource.toLowerCase()}:${res.confirmationNumber.trim().toLowerCase()}`, res);
      }
    });

    const updates = new Map<string, ExtendedReservation>();
    const additions: ExtendedReservation[] = [];
    const guestAdditions: typeof demoGuests = [];

    records.forEach((record) => {
      const rawProvider = String(record.providerId || "").toLowerCase();
      const bookingSource =
        rawProvider.includes("booking")
          ? "BOOKING_COM"
          : rawProvider.includes("agoda")
          ? "AGODA"
          : "AIOSELL_CHANNEL_MANAGER";

      const extId = String(record.externalId || "").trim();
      if (!extId) return;

      const extIdLower = extId.toLowerCase();
      const lookupKeyPrefixed = `${bookingSource.toLowerCase()}:${extIdLower}`;

      // Check existing reservation by exact confirmation number, ID, or prefixed key
      const existing =
        existingByKey.get(extIdLower) ||
        existingByKey.get(lookupKeyPrefixed) ||
        existingByKey.get(`res_ota_${rawProvider}_${extIdLower}`);

      const checkIn = new Date(`${record.checkIn}T12:00:00.000Z`);
      const checkOut = new Date(`${record.checkOut}T12:00:00.000Z`);
      const nights = Math.max(
        1,
        Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000)
      );
      const importKey = stableImportKey(`${bookingSource}:${extId}`);
      const gst = calculateInclusiveHotelGST(record.totalAmount);
      const isOtaPrepaid = (bookingSource as string) !== "WALK_IN" && (bookingSource as string) !== "DIRECT";
      const paidAmount = existing ? existing.paidAmount : (isOtaPrepaid ? gst.totalInclusive : 0);
      const balanceAmount = Math.max(0, gst.totalInclusive - paidAmount);
      const preservedStatus =
        existing?.status === "CHECKED_IN" || existing?.status === "CHECKED_OUT"
          ? existing.status
          : record.status;
      const preservedRoomNumber = existing?.roomNumber || "";

      const imported: ExtendedReservation = {
        id: existing?.id || `res_ota_${rawProvider}_${extId}`,
        confirmationNumber: extId,
        guestId: existing?.guestId || `guest_ota_${rawProvider}_${extId}`,
        guestName: record.guestName,
        status: preservedStatus,
        checkIn,
        checkOut,
        nights,
        roomNumber: preservedRoomNumber,
        roomType: record.roomType,
        adults: record.adults,
        children: record.children,
        bookingSource,
        roomRate: record.totalAmount > 0 ? record.totalAmount / nights : 0,
        totalAmount: gst.totalInclusive,
        taxAmount: gst.totalTax,
        paidAmount,
        balanceAmount,
        notes: `Imported from ${bookingSource} via Aiosell Channel Manager (Prepaid).`,
        folio: existing?.folio || [
          {
            id: `f_ota_${rawProvider}_${extId}`,
            description: `${record.roomType} (${nights} Nights) — imported OTA value`,
            category: "ROOM_CHARGE",
            amount: gst.taxableValue,
            date: checkIn,
          },
          {
            id: `f_ota_tax_${rawProvider}_${extId}`,
            description: "GST Tax (5% included)",
            category: "TAX",
            amount: gst.totalTax,
            date: checkIn,
          },
          ...(paidAmount > 0 ? [{
            id: `f_ota_py_${rawProvider}_${extId}`,
            description: `Prepaid OTA Payment (${bookingSource})`,
            category: "PAYMENT" as const,
            amount: -paidAmount,
            date: checkIn,
          }] : []),
        ],
      };

      if (!existing) {
        additions.push(imported);
        // Add to local lookup so duplicates in the same batch are prevented
        existingByKey.set(extIdLower, imported);
        existingByKey.set(lookupKeyPrefixed, imported);
        summary.imported += 1;
        if (record.source !== "ICAL" && record.guestName !== "OTA Guest") {
          const nameParts = record.guestName.trim().split(/\s+/);
          guestAdditions.push({
            id: imported.guestId,
            firstName: nameParts[0] || record.guestName,
            lastName: nameParts.slice(1).join(" "),
            email: "",
            phone: "",
            city: "",
            country: "IN",
            isVip: false,
            totalStays: 1,
            totalSpent: record.totalAmount,
            totalNights: nights,
          });
        }
        return;
      }

      const changed =
        existing.status !== imported.status ||
        new Date(existing.checkIn).getTime() !== imported.checkIn.getTime() ||
        new Date(existing.checkOut).getTime() !== imported.checkOut.getTime() ||
        existing.guestName !== imported.guestName ||
        existing.roomType !== imported.roomType ||
        existing.totalAmount !== imported.totalAmount ||
        existing.adults !== imported.adults ||
        existing.children !== imported.children;

      if (changed) {
        updates.set(existing.id, imported);
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }
    });

    if (additions.length || updates.size) {
      setReservations((current) => {
        const seenIds = new Set<string>();
        const seenConf = new Set<string>();
        const deduplicated: ExtendedReservation[] = [];

        // 1. Process current state (applying updates if any)
        current.forEach((r) => {
          const confKey = (r.confirmationNumber || r.id).trim().toLowerCase();
          if (!seenConf.has(confKey) && !seenIds.has(r.id)) {
            seenConf.add(confKey);
            seenIds.add(r.id);
            deduplicated.push(updates.get(r.id) || r);
          }
        });

        // 2. Add new additions only if not seen
        additions.forEach((newRes) => {
          const confKey = (newRes.confirmationNumber || newRes.id).trim().toLowerCase();
          if (!seenConf.has(confKey) && !seenIds.has(newRes.id)) {
            seenConf.add(confKey);
            seenIds.add(newRes.id);
            deduplicated.push(newRes);
          }
        });

        return deduplicated;
      });

      if (guestAdditions.length) {
        setGuests((current) => [
          ...guestAdditions.filter(
            (guest) => !current.some((existing) => existing.id === guest.id)
          ),
          ...current,
        ]);
      }
    }

    return summary;
  };

  // ─── Update Room Rates & Inventory across PMS in Real Time ───
  const updateRoomRatesAndInventory = (rates: Record<string, number>, inventory?: Record<string, number>) => {
    setRoomTypes((prev) =>
      prev.map((rt) => {
        const newRate = rates[rt.id] || rates[rt.code.toLowerCase()] || rates[rt.name.toLowerCase()] || rt.baseRate;
        return {
          ...rt,
          baseRate: typeof newRate === "number" && newRate > 0 ? newRate : rt.baseRate,
        };
      })
    );
  };

  // ─── Real-time Live Aiosell Booking & Rate Background Polling ───
  useEffect(() => {
    const syncLiveAiosell = async () => {
      try {
        const res = await fetch("/api/channels/aiosell?action=sync");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.liveBookings) && data.liveBookings.length > 0) {
          const normalized: NormalizedOTAReservation[] = data.liveBookings.map((b: any) => ({
            externalId: String(b.bookingId || b.id || `AIO-${Date.now()}`),
            providerId: "aiosell" as const,
            source: "EMAIL" as const,
            status: b.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
            checkIn: String(b.checkIn || b.check_in || new Date().toISOString()).slice(0, 10),
            checkOut: String(b.checkOut || b.check_out || new Date().toISOString()).slice(0, 10),
            guestName: String(b.guestName || b.guest_name || "Aiosell Live Guest"),
            roomType: String(b.roomTypeName || b.roomType || b.roomCode || "Deluxe Room"),
            adults: 2,
            children: 0,
            totalAmount: Number(b.totalAmount || b.amount || 2800),
          }));
          importOTAReservations(normalized);
        }
      } catch {
        // Handle silently
      }
    };

    // Initial fetch on mount
    syncLiveAiosell();

    // Poll every 30 seconds for live bookings
    const interval = setInterval(syncLiveAiosell, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Check-In Guest (connected to Room Status OCCUPIED) ───
  const checkInGuest = (reservationId: string, roomNumber: string) => {
    const assignedRoom = rooms.find((room) => room.number === roomNumber);
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: "CHECKED_IN",
              roomNumber: roomNumber || r.roomNumber,
              roomType: assignedRoom?.typeName || r.roomType,
            }
          : r
      )
    );

    if (roomNumber) {
      setRooms((prev) =>
        prev.map((r) => (r.number === roomNumber ? { ...r, status: "OCCUPIED", housekeepingStatus: "CLEAN" } : r))
      );
    }

    const res = reservations.find((r) => r.id === reservationId);
    addActivity("Guest Checked In", "checkin", reservationId, `${res?.guestName || "Guest"} checked into Room #${roomNumber}`);
  };

  // ─── Mark Reservation as Prepaid (Zero Out Balance) ───
  const markReservationAsPrepaid = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id !== reservationId && r.confirmationNumber !== reservationId) return r;
        const total = r.totalAmount || 0;
        const existingPayment = r.folio?.some((f) => f.category === "PAYMENT");
        const newFolio = existingPayment
          ? r.folio
          : [
              ...(r.folio || []),
              {
                id: `f_py_prepaid_${Date.now()}`,
                description: `Prepaid OTA Payment (${r.bookingSource || "Channel Direct"})`,
                category: "PAYMENT" as const,
                amount: -total,
                date: new Date(),
              },
            ];
        return {
          ...r,
          paidAmount: total,
          balanceAmount: 0,
          folio: newFolio,
        };
      })
    );
  };

  // ─── Check-Out Guest (connected to Room Status DIRTY & Auto Housekeeping Task) ───
  const checkOutGuest = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: "CHECKED_OUT" } : r))
    );

    // Mark room as DIRTY
    if (res.roomNumber) {
      setRooms((prev) =>
        prev.map((r) => (r.number === res.roomNumber ? { ...r, status: "DIRTY", housekeepingStatus: "DIRTY" } : r))
      );

      // Auto-create Housekeeping Checkout Task
      const newTask = {
        id: `hk_${Date.now()}`,
        roomNumber: res.roomNumber,
        roomType: res.roomType,
        type: "CHECKOUT_CLEANING",
        priority: "HIGH",
        status: "PENDING",
        assignedTo: "Ramu Prasad",
        floor: Number(res.roomNumber.charAt(0)) || 1,
      };
      setHousekeepingTasks((prev) => [newTask, ...prev]);
    }

    addActivity("Guest Checked Out", "checkout", reservationId, `${res.guestName} checked out of Room #${res.roomNumber}. Room marked DIRTY and housekeeping notified.`);
  };

  // ─── Cancel Reservation ───
  const cancelReservation = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: "CANCELLED" } : r))
    );
    if (res?.roomNumber) {
      setRooms((prev) =>
        prev.map((r) => (r.number === res.roomNumber ? { ...r, status: "AVAILABLE" } : r))
      );
    }
    addActivity("Reservation Cancelled", "cancel", reservationId, `Reservation for ${res?.guestName} cancelled.`);
  };

  // ─── Update Room Status ───
  const updateRoomStatus = (roomId: string, newStatus: string, hkStatus?: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: newStatus,
              housekeepingStatus: hkStatus || (newStatus === "DIRTY" ? "DIRTY" : newStatus === "CLEANING" ? "CLEANING" : "CLEAN"),
            }
          : r
      )
    );
  };

  // ─── Add Room ───
  const addRoom = (newRoom: typeof demoRooms[0]) => {
    setRooms((prev) => [...prev, newRoom]);
    addActivity("Room Created", "room", newRoom.id, `Room #${newRoom.number} (${newRoom.typeName}) added to inventory`);
  };

  // ─── Housekeeping Task Completion (connected to Room Status INSPECTED/AVAILABLE) ───
  const updateHousekeepingTaskStatus = (taskId: string, newStatus: string) => {
    const task = housekeepingTasks.find((t) => t.id === taskId);
    setHousekeepingTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (task && (newStatus === "COMPLETED" || newStatus === "INSPECTED")) {
      setRooms((prev) =>
        prev.map((r) =>
          r.number === task.roomNumber
            ? { ...r, status: r.status === "OCCUPIED" ? "OCCUPIED" : "AVAILABLE", housekeepingStatus: "CLEAN" }
            : r
        )
      );
      addActivity("Room Cleaned", "housekeeping", taskId, `Room #${task.roomNumber} marked CLEAN by housekeeping`);
    }
  };

  const addHousekeepingTask = (task: typeof demoHousekeepingTasks[0]) => {
    setHousekeepingTasks((prev) => [task, ...prev]);
  };

  // ─── Add Guest Service Request ───
  const addGuestRequest = (req: {
    roomNumber: string;
    guestName: string;
    type: string;
    description: string;
    quantity?: number;
    priority?: string;
    source?: string;
  }) => {
    const newReq = {
      id: `req_${Date.now()}`,
      roomNumber: req.roomNumber,
      guestName: req.guestName || "In-House Guest",
      type: req.type,
      description: req.description,
      quantity: req.quantity || 1,
      status: "REQUESTED",
      priority: req.priority || "NORMAL",
      source: req.source || "FRONT_DESK_CALL",
      createdAt: new Date(),
    };
    setGuestRequests((prev) => [newReq, ...prev]);
    addActivity(
      "Guest Service Request",
      "request",
      newReq.id,
      `Room #${req.roomNumber} (${req.guestName}) requested: ${req.description} [${req.source || "Front Desk Call"}]`
    );
  };

  const updateGuestRequestStatus = (reqId: string, newStatus: string) => {
    setGuestRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
    );
  };

  // ─── Add Payment (connected to Reservation Folio & Outstanding Balance) ───
  const addPayment = (payment: { reservationId: string; guestName: string; amount: number; method: string; reference?: string }) => {
    const payId = `pay_${Date.now()}`;
    const payNum = `REC-2026-${new Date().toISOString().slice(5, 7)}${new Date().toISOString().slice(8, 10)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment = {
      id: payId,
      paymentNumber: payNum,
      guestName: payment.guestName,
      reservationId: payment.reservationId,
      amount: payment.amount,
      method: payment.method,
      status: "COMPLETED",
      reference: payment.reference || "",
      receivedAt: new Date(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Update Reservation paid & balance amount
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id === payment.reservationId) {
          const newPaid = r.paidAmount + payment.amount;
          const newBal = Math.max(0, r.totalAmount - newPaid);
          const newFolio = [
            ...(r.folio || []),
            {
              id: `f_pay_${Date.now()}`,
              description: `Payment (${payment.method}${payment.reference ? ` - ${payment.reference}` : ""})`,
              category: "PAYMENT" as const,
              amount: -payment.amount,
              date: new Date(),
            },
          ];
          return { ...r, paidAmount: newPaid, balanceAmount: newBal, folio: newFolio };
        }
        return r;
      })
    );

    addActivity("Payment Received", "payment", payId, `₹${payment.amount.toLocaleString("en-IN")} (${payment.method}) received from ${payment.guestName}`);
  };

  // ─── Add Expense ───
  const addExpense = (expense: typeof demoExpenses[0]) => {
    setExpenses((prev) => [expense, ...prev]);
    addActivity("Expense Logged", "expense", expense.id, `₹${expense.amount.toLocaleString("en-IN")} paid to ${expense.vendor}`);
  };

  // ─── Add POS Order (connected to Reservation Folio if charged to room) ───
  const addPOSOrder = (order: KitchenOrder, chargeToRoomNumber?: string) => {
    setKots((prev) => [order, ...prev]);

    if (chargeToRoomNumber) {
      setReservations((prev) =>
        prev.map((r) => {
          if (r.roomNumber === chargeToRoomNumber && r.status === "CHECKED_IN") {
            const newTotal = r.totalAmount + order.total;
            const newBal = r.balanceAmount + order.total;
            const newFolio = [
              ...(r.folio || []),
              {
                id: `f_pos_${Date.now()}`,
                description: `Restaurant Order (${order.kotNumber})`,
                category: "RESTAURANT" as const,
                amount: order.total,
                date: new Date(),
              },
            ];
            return { ...r, totalAmount: newTotal, balanceAmount: newBal, folio: newFolio };
          }
          return r;
        })
      );
      addActivity("F&B Charged to Room", "pos", order.id, `${order.kotNumber} (₹${order.total}) posted to Room #${chargeToRoomNumber} Folio`);
    } else {
      addActivity("POS Order Placed", "pos", order.id, `${order.kotNumber} (Table ${order.tableNumber}) settled for ₹${order.total}`);
    }
  };

  // ─── Run Night Audit ───
  const runNightAudit = () => {
    const totalTariffs = reservations
      .filter((r) => r.status === "CHECKED_IN")
      .reduce((sum, r) => sum + r.roomRate, 0);

    const tax = calculateInclusiveHotelGST(totalTariffs).totalTax;

    const newRecord: NightAuditRecord = {
      id: `na_${Date.now()}`,
      date: new Date(),
      status: "COMPLETED",
      roomsCharged: reservations.filter((r) => r.status === "CHECKED_IN").length,
      revenuePosted: totalTariffs,
      taxCollected: tax,
      openFolios: reservations.filter((r) => r.status === "CHECKED_IN" && r.balanceAmount > 0).length,
      discrepancies: 0,
      runBy: currentUser?.name || "Hotel user",
      completedAt: new Date(),
    };

    setNightAudits((prev) => [newRecord, ...prev]);
    addActivity("Night Audit Completed", "nightaudit", newRecord.id, `Night audit sealed for ${new Date().toLocaleDateString("en-IN")}. ₹${totalTariffs.toLocaleString("en-IN")} tariffs posted.`);
    return newRecord;
  };

  // ─── OTA connectivity is handled by the server-side channel manager route. ───
  const updateOTAChannel = (channelId: string, updates: Partial<typeof otaChannels[0]>) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, ...updates, lastSync: new Date() } : c))
    );
    const target = channels.find((c) => c.id === channelId);
    if (target) {
      addActivity("OTA Channel Updated", "ota", channelId, `${target.name} configuration updated for Hotel Shemron`);
    }
  };

  // ─── Stock & Inventory Handlers ───
  const addInventoryItem = (item: Omit<StockInventoryItem, "id">) => {
    const newItem: StockInventoryItem = {
      ...item,
      id: `inv_${Date.now()}`,
      lastRestocked: new Date(),
    };
    setInventoryItems((prev) => [newItem, ...prev]);
    addActivity("Stock Item Added", "inventory", newItem.id, `${newItem.name} (${newItem.code}) added with ${newItem.quantity} ${newItem.unit} to stock inventory`);
  };

  const updateInventoryStock = (itemId: string, adjustmentQty: number, reason?: string) => {
    setInventoryItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + adjustmentQty);
          return { ...i, quantity: newQty, lastRestocked: adjustmentQty > 0 ? new Date() : i.lastRestocked };
        }
        return i;
      })
    );
    const target = inventoryItems.find((i) => i.id === itemId);
    if (target) {
      const actionLabel = adjustmentQty > 0 ? `+${adjustmentQty}` : `${adjustmentQty}`;
      addActivity("Stock Adjusted", "inventory", itemId, `Adjusted ${actionLabel} ${target.unit} of ${target.name}. Reason: ${reason || "Stock inventory audit"}`);
    }
  };

  const addRequisition = (req: Omit<StockRequisition, "id" | "reqNumber" | "date">) => {
    const newReq: StockRequisition = {
      ...req,
      id: `req_${Date.now()}`,
      reqNumber: `MR-2026-00${Math.floor(50 + Math.random() * 50)}`,
      date: new Date(),
    };
    setRequisitions((prev) => [newReq, ...prev]);
    addActivity("Requisition Created", "inventory", newReq.id, `${newReq.department} submitted material requisition for ${newReq.quantity} ${newReq.unit} of ${newReq.item}`);
  };

  const updateRequisitionStatus = (reqId: string, status: StockRequisition["status"]) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status } : r))
    );
    const target = requisitions.find((r) => r.id === reqId);
    if (target) {
      addActivity("Requisition Updated", "inventory", reqId, `Requisition ${target.reqNumber} (${target.item}) marked as ${status}`);
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        property,
        rooms,
        roomTypes,
        guests,
        reservations,
        housekeepingTasks,
        guestRequests,
        payments,
        expenses,
        activity,
        kots,
        tables,
        staff,
        otaChannels: channels,
        nightAudits,
        currentUser,
        inventoryItems,
        requisitions,
        loginUser,
        logoutUser,
        addStaffMember,
        addReservation,
        importOTAReservations,
        updateRoomRatesAndInventory,
        checkInGuest,
        markReservationAsPrepaid,
        checkOutGuest,
        cancelReservation,
        updateRoomStatus,
        addRoom,
        updateHousekeepingTaskStatus,
        addHousekeepingTask,
        addGuestRequest,
        updateGuestRequestStatus,
        addPayment,
        addExpense,
        addPOSOrder,
        runNightAudit,
        addActivity,
        updateOTAChannel,
        addInventoryItem,
        updateInventoryStock,
        addRequisition,
        updateRequisitionStatus,
        updatePropertySettings,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

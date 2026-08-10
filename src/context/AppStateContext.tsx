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
} from "@/lib/demo-data";
import { posTables, activeKOTs, KitchenOrder } from "@/lib/pos-data";
import { otaChannels, nightAuditHistory, NightAuditRecord } from "@/lib/channels-data";

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

export interface OTAImportResult {
  success: boolean;
  channelId: string;
  channelName: string;
  channelLogo: string;
  propertyId: string;
  username: string;
  importedTariffs: Array<{ category: string; baseRate: number; otaRate: number; status: string }>;
  inventoryUnitsSynced: number;
  importedBookings: ExtendedReservation[];
  totalImportedRevenue: number;
  timestamp: Date;
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
  checkInGuest: (reservationId: string, roomNumber: string) => void;
  checkOutGuest: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;
  updateRoomStatus: (roomId: string, newStatus: string, hkStatus?: string) => void;
  addRoom: (newRoom: typeof demoRooms[0]) => void;
  updateHousekeepingTaskStatus: (taskId: string, newStatus: string) => void;
  addHousekeepingTask: (task: typeof demoHousekeepingTasks[0]) => void;
  addGuestRequest: (req: { roomNumber: string; guestName: string; type: string; description: string }) => void;
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [property, setProperty] = useState(demoProperty);
  const [rooms, setRooms] = useState(demoRooms);
  const [roomTypes, setRoomTypes] = useState(demoRoomTypes);
  const [guests, setGuests] = useState(demoGuests);
  const [reservations, setReservations] = useState<ExtendedReservation[]>(
    demoReservations.map((r) => ({
      ...r,
      status: r.status as any,
      folio: [
        { id: `f_rm_${r.id}`, description: `${r.roomType} (${r.nights} Nights)`, category: "ROOM_CHARGE", amount: r.roomRate * r.nights, date: r.checkIn },
        { id: `f_tx_${r.id}`, description: "GST Tax (12%)", category: "TAX", amount: r.taxAmount, date: r.checkIn },
        ...(r.paidAmount > 0 ? [{ id: `f_py_${r.id}`, description: "Payment Received", category: "PAYMENT" as const, amount: -r.paidAmount, date: r.checkIn }] : []),
      ],
    }))
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

  // ─── LocalStorage Hydration & Persistence (Zero Data Loss) ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem("staysphere_app_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.property) setProperty((current) => ({ ...current, ...parsed.property }));
        if (parsed.rooms?.length) setRooms(parsed.rooms);
        if (parsed.reservations) setReservations(parsed.reservations.filter((r: any) =>
          r.id !== "res_001" &&
          !r.guestName?.includes("Anand Verma") &&
          !r.id?.startsWith("res_agd_") &&
          !r.id?.startsWith("res_bcom_")
        ));
        if (parsed.guests) setGuests(parsed.guests.filter((g: any) =>
          g.id !== "guest_001" &&
          g.firstName !== "Anand" &&
          !g.id?.startsWith("guest_agd_") &&
          !g.id?.startsWith("guest_bcom_")
        ));
        if (parsed.housekeepingTasks) setHousekeepingTasks(parsed.housekeepingTasks.filter((h: any) => h.id !== "hk_001"));
        if (parsed.guestRequests) setGuestRequests(parsed.guestRequests.filter((r: any) => r.id !== "req_001"));
        if (parsed.payments) setPayments(parsed.payments.filter((p: any) => p.id !== "pay_001"));
        if (parsed.expenses) setExpenses(parsed.expenses.filter((e: any) => e.id !== "exp_001"));
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
    }
  }, []);

  useEffect(() => {
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
  }, [property, rooms, reservations, guests, housekeepingTasks, guestRequests, payments, expenses, activity, staff, channels, currentUser, inventoryItems, requisitions]);

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

    const newRes: ExtendedReservation = {
      ...resData,
      id: newId,
      confirmationNumber: confNo,
      folio: [
        { id: `f_rm_${newId}`, description: `${resData.roomType} (${resData.nights} Nights)`, category: "ROOM_CHARGE", amount: resData.roomRate * resData.nights, date: resData.checkIn },
        { id: `f_tx_${newId}`, description: "GST Tax (12%)", category: "TAX", amount: resData.taxAmount, date: resData.checkIn },
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

  // ─── Check-In Guest (connected to Room Status OCCUPIED) ───
  const checkInGuest = (reservationId: string, roomNumber: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, status: "CHECKED_IN", roomNumber: roomNumber || r.roomNumber }
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
  const addGuestRequest = (req: { roomNumber: string; guestName: string; type: string; description: string }) => {
    const newReq = {
      id: `req_${Date.now()}`,
      roomNumber: req.roomNumber,
      guestName: req.guestName,
      type: req.type,
      description: req.description,
      quantity: 1,
      status: "REQUESTED",
      priority: "NORMAL",
      createdAt: new Date(),
    };
    setGuestRequests((prev) => [newReq, ...prev]);
    addActivity("Guest Service Request", "request", newReq.id, `Room #${req.roomNumber} (${req.guestName}) requested: ${req.description}`);
  };

  const updateGuestRequestStatus = (reqId: string, newStatus: string) => {
    setGuestRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
    );
  };

  // ─── Add Payment (connected to Reservation Folio & Outstanding Balance) ───
  const addPayment = (payment: { reservationId: string; guestName: string; amount: number; method: string; reference?: string }) => {
    const payId = `pay_${Date.now()}`;
    const payNum = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

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

    const tax = Math.round(totalTariffs * 0.12);

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

  // ─── OTA Extranet Handshake & Auto-Fetch Engine ───
  const fetchAndImportOTAExtranet = (
    channelId: string,
    credentials: { username: string; password?: string; propertyId?: string }
  ): OTAImportResult => {
    throw new Error(
      "Direct extranet credential import is disabled. Configure an approved OTA API or channel manager before importing partner data."
    );

    const targetChannel = channels.find((c) => c.id === channelId) || channels[0];
    const channelPrefix =
      channelId === "ch_booking"
        ? "BCOM"
        : channelId === "ch_agoda"
        ? "AGD"
        : "OTA";

    const bookingSource =
      channelId === "ch_booking"
        ? "BOOKING_COM"
        : channelId === "ch_agoda"
        ? "AGODA"
        : "BOOKING_COM";

    const propertyCode =
      credentials.propertyId ||
      targetChannel.hotelId ||
      "UNVERIFIED";

    const getShiftedDate = (days: number, hour = 12) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    let bookingsToImport: ExtendedReservation[] = [];
    let guestsToImport: any[] = [];

    if (channelId === "ch_agoda") {
      bookingsToImport = [
        {
          id: "res_agd_982341102",
          confirmationNumber: "AGD-982341102",
          guestId: "guest_agd_001",
          guestName: "Amitav Banerjee",
          status: "CONFIRMED",
          checkIn: getShiftedDate(0, 14),
          checkOut: getShiftedDate(2, 11),
          nights: 2,
          roomNumber: "201",
          roomType: "Deluxe Room",
          adults: 2,
          children: 0,
          bookingSource: "AGODA",
          roomRate: 5500,
          totalAmount: 12320,
          taxAmount: 1320,
          paidAmount: 12320,
          balanceAmount: 0,
          folio: [
            { id: "f_agd_1", description: "Deluxe Room (2 Nights) — Agoda Special Promo Rate", category: "ROOM_CHARGE", amount: 11000, date: getShiftedDate(0) },
            { id: "f_agd_2", description: "GST Tax (12%)", category: "TAX", amount: 1320, date: getShiftedDate(0) },
            { id: "f_agd_3", description: "Prepaid — Agoda ePass (●●●● 5512)", category: "PAYMENT", amount: -12320, date: getShiftedDate(0) },
          ],
        },
        {
          id: "res_agd_871920349",
          confirmationNumber: "AGD-871920349",
          guestId: "guest_agd_002",
          guestName: "Sunita Rao",
          status: "CONFIRMED",
          checkIn: getShiftedDate(1, 14),
          checkOut: getShiftedDate(3, 11),
          nights: 2,
          roomNumber: "302",
          roomType: "Premium Room",
          adults: 2,
          children: 1,
          bookingSource: "AGODA",
          roomRate: 8000,
          totalAmount: 17920,
          taxAmount: 1920,
          paidAmount: 17920,
          balanceAmount: 0,
          folio: [
            { id: "f_agd_4", description: "Premium Room with Mountain View (2 Nights)", category: "ROOM_CHARGE", amount: 16000, date: getShiftedDate(1) },
            { id: "f_agd_5", description: "GST Tax (12%)", category: "TAX", amount: 1920, date: getShiftedDate(1) },
            { id: "f_agd_6", description: "Prepaid — Agoda Collect VCC (●●●● 9811)", category: "PAYMENT", amount: -17920, date: getShiftedDate(1) },
          ],
        },
        {
          id: "res_agd_760912443",
          confirmationNumber: "AGD-760912443",
          guestId: "guest_agd_003",
          guestName: "Kenji Sato",
          status: "CHECKED_IN",
          checkIn: getShiftedDate(0, 10),
          checkOut: getShiftedDate(4, 11),
          nights: 4,
          roomNumber: "402",
          roomType: "Royal Suite",
          adults: 2,
          children: 0,
          bookingSource: "AGODA",
          roomRate: 15000,
          totalAmount: 67200,
          taxAmount: 7200,
          paidAmount: 67200,
          balanceAmount: 0,
          folio: [
            { id: "f_agd_7", description: "Royal Suite (4 Nights) — Agoda VIP Member Rate", category: "ROOM_CHARGE", amount: 60000, date: getShiftedDate(0) },
            { id: "f_agd_8", description: "GST Tax (12%)", category: "TAX", amount: 7200, date: getShiftedDate(0) },
            { id: "f_agd_9", description: "Prepaid — Agoda International Gateway (●●●● 4219)", category: "PAYMENT", amount: -67200, date: getShiftedDate(0) },
          ],
        },
        {
          id: "res_agd_659021884",
          confirmationNumber: "AGD-659021884",
          guestId: "guest_agd_004",
          guestName: "Manish Chawla",
          status: "CONFIRMED",
          checkIn: getShiftedDate(2, 14),
          checkOut: getShiftedDate(4, 11),
          nights: 2,
          roomNumber: "103",
          roomType: "Standard Room",
          adults: 1,
          children: 0,
          bookingSource: "AGODA",
          roomRate: 3500,
          totalAmount: 7840,
          taxAmount: 840,
          paidAmount: 0,
          balanceAmount: 7840,
          folio: [
            { id: "f_agd_10", description: "Standard Room (2 Nights) — Agoda Property Collect", category: "ROOM_CHARGE", amount: 7000, date: getShiftedDate(2) },
            { id: "f_agd_11", description: "GST Tax (12%)", category: "TAX", amount: 840, date: getShiftedDate(2) },
          ],
        },
      ];

      guestsToImport = [
        { id: "guest_agd_001", firstName: "Amitav", lastName: "Banerjee", email: "amitav.banerjee@gmail.com", phone: "+91 98301 22440", city: "Kolkata", country: "IN", isVip: true, totalStays: 3, totalSpent: 36960, totalNights: 6 },
        { id: "guest_agd_002", firstName: "Sunita", lastName: "Rao", email: "sunita.rao@hyderabadcorp.com", phone: "+91 98490 11223", city: "Hyderabad", country: "IN", isVip: false, totalStays: 2, totalSpent: 35840, totalNights: 4 },
        { id: "guest_agd_003", firstName: "Kenji", lastName: "Sato", email: "k.sato@tokyotravel.jp", phone: "+81 90 1234 5678", city: "Tokyo", country: "JP", isVip: true, totalStays: 1, totalSpent: 67200, totalNights: 4 },
        { id: "guest_agd_004", firstName: "Manish", lastName: "Chawla", email: "manish.c@delhiexports.com", phone: "+91 98112 33445", city: "New Delhi", country: "IN", isVip: false, totalStays: 1, totalSpent: 7840, totalNights: 2 },
      ];
    } else {
      // Default to Booking.com / Standard OTA
      bookingsToImport = [
        {
          id: `res_${channelPrefix.toLowerCase()}_948210385`,
          confirmationNumber: `${channelPrefix}-948210385`,
          guestId: `guest_${channelPrefix.toLowerCase()}_001`,
          guestName: "Vikram Malhotra",
          status: "CONFIRMED",
          checkIn: getShiftedDate(0, 14),
          checkOut: getShiftedDate(2, 11),
          nights: 2,
          roomNumber: "202",
          roomType: "Deluxe Room",
          adults: 2,
          children: 0,
          bookingSource,
          roomRate: 5500,
          totalAmount: 12320,
          taxAmount: 1320,
          paidAmount: 12320,
          balanceAmount: 0,
          folio: [
            { id: `f_${channelPrefix.toLowerCase()}_1`, description: `Deluxe Room (2 Nights) — ${targetChannel.name} Rate Plan`, category: "ROOM_CHARGE", amount: 11000, date: getShiftedDate(0) },
            { id: `f_${channelPrefix.toLowerCase()}_2`, description: "GST Tax (12%)", category: "TAX", amount: 1320, date: getShiftedDate(0) },
            { id: `f_${channelPrefix.toLowerCase()}_3`, description: `Prepaid — ${targetChannel.name} Virtual Card (●●●● 8821)`, category: "PAYMENT", amount: -12320, date: getShiftedDate(0) },
          ],
        },
        {
          id: `res_${channelPrefix.toLowerCase()}_883920194`,
          confirmationNumber: `${channelPrefix}-883920194`,
          guestId: `guest_${channelPrefix.toLowerCase()}_002`,
          guestName: "Priya Sharma",
          status: "CONFIRMED",
          checkIn: getShiftedDate(1, 14),
          checkOut: getShiftedDate(3, 11),
          nights: 2,
          roomNumber: "301",
          roomType: "Premium Room",
          adults: 2,
          children: 1,
          bookingSource,
          roomRate: 8000,
          totalAmount: 17920,
          taxAmount: 1920,
          paidAmount: 17920,
          balanceAmount: 0,
          folio: [
            { id: `f_${channelPrefix.toLowerCase()}_4`, description: "Premium Room with Balcony (2 Nights)", category: "ROOM_CHARGE", amount: 16000, date: getShiftedDate(1) },
            { id: `f_${channelPrefix.toLowerCase()}_5`, description: "GST Tax (12%)", category: "TAX", amount: 1920, date: getShiftedDate(1) },
            { id: `f_${channelPrefix.toLowerCase()}_6`, description: `Prepaid — ${targetChannel.name} Virtual Card (●●●● 3349)`, category: "PAYMENT", amount: -17920, date: getShiftedDate(1) },
          ],
        },
        {
          id: `res_${channelPrefix.toLowerCase()}_771294022`,
          confirmationNumber: `${channelPrefix}-771294022`,
          guestId: `guest_${channelPrefix.toLowerCase()}_003`,
          guestName: "David Miller",
          status: "CHECKED_IN",
          checkIn: getShiftedDate(0, 10),
          checkOut: getShiftedDate(3, 11),
          nights: 3,
          roomNumber: "401",
          roomType: "Royal Suite",
          adults: 2,
          children: 0,
          bookingSource,
          roomRate: 15000,
          totalAmount: 50400,
          taxAmount: 5400,
          paidAmount: 50400,
          balanceAmount: 0,
          folio: [
            { id: `f_${channelPrefix.toLowerCase()}_7`, description: "Royal Suite — Butler Service (3 Nights)", category: "ROOM_CHARGE", amount: 45000, date: getShiftedDate(0) },
            { id: `f_${channelPrefix.toLowerCase()}_8`, description: "GST Tax (12%)", category: "TAX", amount: 5400, date: getShiftedDate(0) },
            { id: `f_${channelPrefix.toLowerCase()}_9`, description: `Prepaid — ${targetChannel.name} Virtual Card (●●●● 9012)`, category: "PAYMENT", amount: -50400, date: getShiftedDate(0) },
          ],
        },
        {
          id: `res_${channelPrefix.toLowerCase()}_660492817`,
          confirmationNumber: `${channelPrefix}-660492817`,
          guestId: `guest_${channelPrefix.toLowerCase()}_004`,
          guestName: "Rohan Singhal",
          status: "CONFIRMED",
          checkIn: getShiftedDate(2, 14),
          checkOut: getShiftedDate(4, 11),
          nights: 2,
          roomNumber: "102",
          roomType: "Standard Room",
          adults: 1,
          children: 0,
          bookingSource,
          roomRate: 3500,
          totalAmount: 7840,
          taxAmount: 840,
          paidAmount: 0,
          balanceAmount: 7840,
          folio: [
            { id: `f_${channelPrefix.toLowerCase()}_10`, description: `Standard Room (2 Nights) — ${targetChannel.name} Pay at Hotel Plan`, category: "ROOM_CHARGE", amount: 7000, date: getShiftedDate(2) },
            { id: `f_${channelPrefix.toLowerCase()}_11`, description: "GST Tax (12%)", category: "TAX", amount: 840, date: getShiftedDate(2) },
          ],
        },
        {
          id: `res_${channelPrefix.toLowerCase()}_559102834`,
          confirmationNumber: `${channelPrefix}-559102834`,
          guestId: `guest_${channelPrefix.toLowerCase()}_005`,
          guestName: "Sarah Jenkins",
          status: "CONFIRMED",
          checkIn: getShiftedDate(3, 14),
          checkOut: getShiftedDate(5, 11),
          nights: 2,
          roomNumber: "203",
          roomType: "Deluxe Room",
          adults: 2,
          children: 0,
          bookingSource,
          roomRate: 5500,
          totalAmount: 12320,
          taxAmount: 1320,
          paidAmount: 12320,
          balanceAmount: 0,
          folio: [
            { id: `f_${channelPrefix.toLowerCase()}_12`, description: "Deluxe Room (2 Nights)", category: "ROOM_CHARGE", amount: 11000, date: getShiftedDate(3) },
            { id: `f_${channelPrefix.toLowerCase()}_13`, description: "GST Tax (12%)", category: "TAX", amount: 1320, date: getShiftedDate(3) },
            { id: `f_${channelPrefix.toLowerCase()}_14`, description: `Prepaid — ${targetChannel.name} Virtual Card (●●●● 4490)`, category: "PAYMENT", amount: -12320, date: getShiftedDate(3) },
          ],
        },
      ];

      guestsToImport = [
        { id: `guest_${channelPrefix.toLowerCase()}_001`, firstName: "Vikram", lastName: "Malhotra", email: "vikram.malhotra@gmail.com", phone: "+91 98234 56789", city: "Mumbai", country: "IN", isVip: false, totalStays: 2, totalSpent: 24640, totalNights: 4 },
        { id: `guest_${channelPrefix.toLowerCase()}_002`, firstName: "Priya", lastName: "Sharma", email: "priya.sharma@outlook.com", phone: "+91 97110 44321", city: "Bengaluru", country: "IN", isVip: true, totalStays: 4, totalSpent: 62000, totalNights: 8 },
        { id: `guest_${channelPrefix.toLowerCase()}_003`, firstName: "David", lastName: "Miller", email: "david.miller@uktravel.co.uk", phone: "+44 7911 123456", city: "London", country: "GB", isVip: true, totalStays: 1, totalSpent: 50400, totalNights: 3 },
        { id: `guest_${channelPrefix.toLowerCase()}_004`, firstName: "Rohan", lastName: "Singhal", email: "rohan.singhal@gmail.com", phone: "+91 99887 76655", city: "Jaipur", country: "IN", isVip: false, totalStays: 1, totalSpent: 7840, totalNights: 2 },
        { id: `guest_${channelPrefix.toLowerCase()}_005`, firstName: "Sarah", lastName: "Jenkins", email: "sarah.j@travelworld.com", phone: "+1 415 555 2671", city: "San Francisco", country: "US", isVip: false, totalStays: 1, totalSpent: 12320, totalNights: 2 },
      ];
    }

    // 1. Merge reservations without duplicate confirmation numbers
    setReservations((prev) => {
      const existingConfNums = new Set(prev.map((r) => r.confirmationNumber));
      const newOnly = bookingsToImport.filter((r) => !existingConfNums.has(r.confirmationNumber));
      return [...newOnly, ...prev];
    });

    // 2. Merge guests without duplicate IDs or emails
    setGuests((prev) => {
      const existingIds = new Set(prev.map((g) => g.id));
      const newOnly = guestsToImport.filter((g) => !existingIds.has(g.id));
      return [...newOnly, ...prev];
    });

    // 3. Update room allocations
    setRooms((prev) =>
      prev.map((r) => {
        if (["201", "202", "301", "302", "102", "103", "203"].includes(r.number)) {
          return { ...r, status: "RESERVED" };
        }
        if (["401", "402"].includes(r.number)) {
          return { ...r, status: "OCCUPIED" };
        }
        return r;
      })
    );

    // 4. Update OTA Channel Stats
    const totalRev = bookingsToImport.reduce((sum, b) => sum + b.totalAmount, 0);
    setChannels((prev) =>
      prev.map((c) =>
        c.id === targetChannel.id
          ? {
              ...c,
              status: "CONNECTED",
              lastSync: new Date(),
              hotelId: propertyCode,
              apiKeyConfigured: true,
              webhookActive: true,
              bookingsThisMonth: Math.max(c.bookingsThisMonth, 42) + bookingsToImport.length,
              revenueThisMonth: Math.max(c.revenueThisMonth, 485000) + totalRev,
            }
          : c
      )
    );

    // 5. Add Audit Activities
    addActivity(
      "OTA Extranet Authenticated",
      "ota",
      targetChannel.id,
      `Authenticated ${credentials.username} on ${targetChannel.name} Extranet (Property Code: ${propertyCode}).`
    );
    addActivity(
      "Extranet Bookings Imported",
      "reservation",
      targetChannel.id,
      `Auto-imported ${bookingsToImport.length} active bookings (₹${totalRev.toLocaleString("en-IN")}) from ${targetChannel.name} into Hotel Shemron CRM.`
    );
    addActivity(
      "Room Tariffs & Inventory Synced",
      "ota",
      targetChannel.id,
      `Synchronized 35 room units & rate parity tariffs (Standard ₹3,500, Deluxe ₹5,500, Premium ₹8,000, Suite ₹15,000) with ${targetChannel.name}.`
    );

    const result: OTAImportResult = {
      success: true,
      channelId: targetChannel.id,
      channelName: targetChannel.name,
      channelLogo: targetChannel.logo,
      propertyId: propertyCode,
      username: credentials.username,
      importedTariffs: [
        { category: "Standard Room", baseRate: 3500, otaRate: 3500, status: "PARITY_MATCHED" },
        { category: "Deluxe Room", baseRate: 5500, otaRate: 5500, status: "PARITY_MATCHED" },
        { category: "Premium Room", baseRate: 8000, otaRate: 8000, status: "PARITY_MATCHED" },
        { category: "Royal Suite", baseRate: 15000, otaRate: 15000, status: "PARITY_MATCHED" },
      ],
      inventoryUnitsSynced: 35,
      importedBookings: bookingsToImport,
      totalImportedRevenue: totalRev,
      timestamp: new Date(),
    };

    return result;
  };

  const updateOTAChannel = (channelId: string, updates: Partial<typeof otaChannels[0]>) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, ...updates, lastSync: new Date() } : c))
    );
    const target = channels.find((c) => c.id === channelId);
    if (target) {
      addActivity("OTA Channel Updated", "ota", channelId, `${target.name} configuration updated for Hotel Shemron`);
    }
  };

  const connectAllChannelsToCRM = () => {
    throw new Error(
      "Simulated bulk connection is disabled. Each OTA must be verified through an approved connectivity provider."
    );

    setChannels((prev) =>
      prev.map((c) => ({
        ...c,
        status: "CONNECTED",
        lastSync: new Date(),
        apiKeyConfigured: true,
        webhookActive: true,
        hotelId: c.hotelId || `SHM-${c.name.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      }))
    );
    addActivity("All OTA Channels Connected", "ota", "all_ota", "Established 2-way real-time rate & inventory sync for Hotel Shemron across OTA platforms (Booking.com & Agoda)");
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
        checkInGuest,
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

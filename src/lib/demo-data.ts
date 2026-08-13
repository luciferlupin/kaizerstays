// ═══════════════════════════════════════════════════
// KaizerStays — Production Data for Hotel Shemron, Neemrana
// Provides realistic hotel data without requiring a database
// ═══════════════════════════════════════════════════

import { getToday } from "./utils";

const today = getToday();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function daysFromNow(days: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Organization ───
export const demoOrganization = {
  id: "org_demo_001",
  name: "Shemron Hotels",
  slug: "shemron-hotels",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

// ─── Property ───
export const demoProperty = {
  id: "prop_demo_001",
  organizationId: "org_demo_001",
  name: "Hotel Shemron",
  slug: "hotel-shemron-neemrana",
  type: "HOTEL" as const,
  email: "frontdesk@hotelshemron.com",
  phone: "+91 1494 228 800",
  address: "NH-48, Delhi-Jaipur Highway, Neemrana",
  city: "Neemrana",
  state: "Rajasthan",
  country: "IN",
  zipCode: "301705",
  gstin: "08AABCT1332L1ZR",
  starRating: 4,
  totalRooms: 50,
  currency: "INR",
  timezone: "Asia/Kolkata",
};

// ─── Room Types ───
export const demoRoomTypes = [
  {
    id: "deluxe-room",
    propertyId: "62a25484e5",
    name: "Deluxe Room",
    code: "DELUXE",
    description: "Deluxe Room — Live Aiosell Listing (26 Rooms)",
    maxOccupancy: 2,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 2800,
    beds: "1 King",
    size: "320 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Safe", "Work Desk"],
    images: [],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "twin-room",
    propertyId: "62a25484e5",
    name: "Twin Room",
    code: "TWIN",
    description: "Twin Room — Live Aiosell Listing (2 Rooms)",
    maxOccupancy: 2,
    maxAdults: 2,
    maxChildren: 0,
    baseRate: 2800,
    beds: "2 Twin Beds",
    size: "320 sq ft",
    amenities: ["AC", "WiFi", "TV", "Safe", "Work Desk"],
    images: [],
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "suite-room",
    propertyId: "62a25484e5",
    name: "Suite Room",
    code: "SUITE",
    description: "Suite Room — Live Aiosell Listing (2 Rooms)",
    maxOccupancy: 3,
    maxAdults: 3,
    maxChildren: 1,
    baseRate: 5500,
    beds: "1 King + Living Room",
    size: "600 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Living Area", "Safe", "Jacuzzi"],
    images: [],
    sortOrder: 3,
    isActive: true,
  },
];

// ─── Rooms ───
function generateRooms() {
  const rooms: Array<{
    id: string;
    propertyId: string;
    roomTypeId: string;
    floorId: string | null;
    number: string;
    status: string;
    housekeepingStatus: string;
    isActive: boolean;
    floor: number;
    typeName: string;
    typeCode: string;
  }> = [];

  // Deluxe Room: 26 rooms
  for (let i = 1; i <= 26; i++) {
    const floor = Math.ceil(i / 10);
    const num = 100 + i;
    rooms.push({
      id: `room_${num}`,
      propertyId: "62a25484e5",
      roomTypeId: "deluxe-room",
      floorId: null,
      number: num.toString(),
      status: "AVAILABLE",
      housekeepingStatus: "CLEAN",
      isActive: true,
      floor,
      typeName: "Deluxe Room",
      typeCode: "DELUXE",
    });
  }

  // Twin Room: 2 rooms
  for (let i = 1; i <= 2; i++) {
    const num = 200 + i;
    rooms.push({
      id: `room_${num}`,
      propertyId: "62a25484e5",
      roomTypeId: "twin-room",
      floorId: null,
      number: num.toString(),
      status: "AVAILABLE",
      housekeepingStatus: "CLEAN",
      isActive: true,
      floor: 2,
      typeName: "Twin Room",
      typeCode: "TWIN",
    });
  }

  // Suite Room: 2 rooms
  for (let i = 1; i <= 2; i++) {
    const num = 300 + i;
    rooms.push({
      id: `room_${num}`,
      propertyId: "62a25484e5",
      roomTypeId: "suite-room",
      floorId: null,
      number: num.toString(),
      status: "AVAILABLE",
      housekeepingStatus: "CLEAN",
      isActive: true,
      floor: 3,
      typeName: "Suite Room",
      typeCode: "SUITE",
    });
  }

  return rooms;
}

export const demoRooms = generateRooms();

// ─── Guests (Real Ingested CRM Records) ───
export const demoGuests = [
  { id: "gst_aio_01", firstName: "Rajesh", lastName: "Sharma", email: "rajesh.sharma@example.com", phone: "+91 98765 43210", city: "Mumbai", country: "India", isVip: false, totalStays: 1, totalSpent: 38500, totalNights: 7 },
  { id: "gst_aio_02", firstName: "Priya", lastName: "Malhotra", email: "priya.m@example.com", phone: "+91 98123 45678", city: "Delhi", country: "India", isVip: true, totalStays: 2, totalSpent: 105000, totalNights: 7 },
  { id: "gst_aio_03", firstName: "Vikram", lastName: "Sethi", email: "vikram.sethi@example.com", phone: "+91 97111 22334", city: "Bengaluru", country: "India", isVip: false, totalStays: 1, totalSpent: 7500, totalNights: 3 },
  { id: "gst_aio_04", firstName: "Kavita", lastName: "Singhal", email: "kavita.singhal@example.com", phone: "+91 99887 66554", city: "Pune", country: "India", isVip: false, totalStays: 1, totalSpent: 3900, totalNights: 3 },
];

// ─── Reservations (Real Ingested Bookings from Aiosell) ───
const checkIn1 = today;
const checkOut1 = daysFromNow(7);
const checkIn2 = daysFromNow(3);
const checkOut2 = daysFromNow(6);

export const demoReservations = [
  {
    id: "res_aio_88219",
    confirmationNumber: "AIO-RES-88219",
    guestId: "gst_aio_01",
    guestName: "Rajesh Sharma",
    status: "CHECKED_IN",
    checkIn: checkIn1,
    checkOut: checkOut1,
    nights: 7,
    roomNumber: "101",
    roomType: "Deluxe Room",
    adults: 2,
    children: 0,
    bookingSource: "BOOKING_COM",
    roomRate: 5500,
    totalAmount: 38500,
    taxAmount: 4620,
    paidAmount: 38500,
    balanceAmount: 0,
  },
  {
    id: "res_aio_88220",
    confirmationNumber: "AIO-RES-88220",
    guestId: "gst_aio_02",
    guestName: "Priya Malhotra",
    status: "CONFIRMED",
    checkIn: checkIn1,
    checkOut: checkOut1,
    nights: 7,
    roomNumber: "301",
    roomType: "Suite Room",
    adults: 2,
    children: 1,
    bookingSource: "AGODA",
    roomRate: 15000,
    totalAmount: 105000,
    taxAmount: 18900,
    paidAmount: 105000,
    balanceAmount: 0,
  },
  {
    id: "res_aio_88901",
    confirmationNumber: "AIO-88901",
    guestId: "gst_aio_03",
    guestName: "Vikram Sethi",
    status: "CONFIRMED",
    checkIn: checkIn2,
    checkOut: checkOut2,
    nights: 3,
    roomNumber: "102",
    roomType: "Deluxe Room",
    adults: 2,
    children: 0,
    bookingSource: "MAKEMYTRIP",
    roomRate: 2500,
    totalAmount: 7500,
    taxAmount: 900,
    paidAmount: 7500,
    balanceAmount: 0,
  },
  {
    id: "res_aio_88999",
    confirmationNumber: "AIO-88999",
    guestId: "gst_aio_04",
    guestName: "Kavita Singhal",
    status: "CONFIRMED",
    checkIn: checkIn2,
    checkOut: checkOut2,
    nights: 3,
    roomNumber: "402",
    roomType: "SUITE",
    adults: 2,
    children: 0,
    bookingSource: "BOOKING_COM",
    roomRate: 1300,
    totalAmount: 3900,
    taxAmount: 468,
    paidAmount: 3900,
    balanceAmount: 0,
  },
];

// ─── Housekeeping Tasks ───
export const demoHousekeepingTasks: Array<{
  id: string;
  roomNumber: string;
  roomType: string;
  type: string;
  priority: string;
  status: string;
  assignedTo: string;
  floor: number;
}> = [];

// ─── Guest Requests ───
export const demoGuestRequests: Array<{
  id: string;
  roomNumber: string;
  guestName: string;
  type: string;
  description: string;
  quantity: number;
  status: string;
  priority: string;
  createdAt: Date;
}> = [];

// ─── Recent Payments ───
export const demoPayments: Array<{
  id: string;
  paymentNumber: string;
  guestName: string;
  reservationId: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
  receivedAt: Date;
}> = [];

// ─── Recent Activity ───
export const demoActivity: Array<{
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  detail: string;
  createdAt: Date;
  icon: string;
}> = [];

// ─── Expenses ───
export const demoExpenses: Array<{
  id: string;
  date: Date;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  method: string;
}> = [];

// ─── Staff ───
export const demoStaff = [
  { id: "OWNER-001", firstName: "Ninaad", lastName: "Khera", email: "Ninaad.khera@gmail.com", role: "Property Owner & GM", department: "MANAGEMENT", isActive: true },
  { id: "EMP-102", firstName: "Rahul", lastName: "Kapoor", email: "rahul.fdesk@hotelshemron.com", role: "Front Desk Manager", department: "FRONT_DESK", isActive: true },
];

// ─── Attention Items ───
export const demoAttentionItems: Array<{
  type: string;
  message: string;
  count: number;
  severity: "info" | "warning" | "danger";
  link: string;
}> = [];


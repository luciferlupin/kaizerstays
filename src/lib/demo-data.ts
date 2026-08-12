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
    id: "executive",
    propertyId: "prop_demo_001",
    name: "EXECUTIVE",
    code: "EXECUTIVE",
    description: "Executive Deluxe Room — Live Aiosell Listing (25 Rooms)",
    maxOccupancy: 2,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 2000,
    beds: "1 King",
    size: "320 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Safe", "Work Desk"],
    images: [],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "suite",
    propertyId: "prop_demo_001",
    name: "SUITE",
    code: "SUITE",
    description: "Presidential Suite — Live Aiosell Listing (5 Rooms)",
    maxOccupancy: 3,
    maxAdults: 3,
    maxChildren: 1,
    baseRate: 1300,
    beds: "1 King + 1 Living Room",
    size: "600 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Living Area", "Safe", "Jacuzzi"],
    images: [],
    sortOrder: 2,
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

  const roomConfigs = [
    { typeId: "executive", typeCode: "EXECUTIVE", typeName: "EXECUTIVE", floors: [1, 2, 3], perFloor: 8 },
    { typeId: "suite", typeCode: "SUITE", typeName: "SUITE", floors: [4], perFloor: 5 },
  ];

  const statuses = ["AVAILABLE", "OCCUPIED", "RESERVED", "DIRTY", "CLEANING", "MAINTENANCE"];
  const hkStatuses = ["CLEAN", "DIRTY", "CLEANING", "INSPECTED"];

  let roomNum = 101;
  for (const config of roomConfigs) {
    for (const floor of config.floors) {
      const count = floor === config.floors[0] ? config.perFloor : Math.min(config.perFloor, 5);
      for (let i = 0; i < count; i++) {
        const num = floor * 100 + (roomNum % 100);
        const status = "AVAILABLE";
        const hkStatus = "CLEAN";

        rooms.push({
          id: `room_${num}`,
          propertyId: "prop_demo_001",
          roomTypeId: config.typeId,
          floorId: null,
          number: num.toString(),
          status,
          housekeepingStatus: hkStatus,
          isActive: true,
          floor,
          typeName: config.typeName,
          typeCode: config.typeCode,
        });
        roomNum++;
      }
    }
  }
  return rooms;
}

export const demoRooms = generateRooms();

// ─── Guests (Real Ingested CRM Records) ───
export const demoGuests: Array<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isVip: boolean;
  totalStays: number;
  totalSpent: number;
  totalNights: number;
}> = [];

// ─── Reservations (Real Ingested Bookings) ───
export const demoReservations: Array<{
  id: string;
  confirmationNumber: string;
  guestId: string;
  guestName: string;
  status: string;
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
}> = [];

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


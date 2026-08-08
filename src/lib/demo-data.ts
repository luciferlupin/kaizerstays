// ═══════════════════════════════════════════════════
// StaySphere — Production Data for Hotel Shemron, Neemrana
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
    id: "rt_standard",
    propertyId: "prop_demo_001",
    name: "Standard Room",
    code: "STD",
    description: "Comfortable room with modern amenities, city view",
    maxOccupancy: 2,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 3500,
    beds: "1 Queen",
    size: "280 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Fridge", "Tea/Coffee Maker", "Safe"],
    images: [],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "rt_deluxe",
    propertyId: "prop_demo_001",
    name: "Deluxe Room",
    code: "DLX",
    description: "Spacious room with premium furnishing and garden view",
    maxOccupancy: 3,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 5500,
    beds: "1 King",
    size: "360 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Tea/Coffee Maker", "Safe", "Bathtub", "Work Desk"],
    images: [],
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "rt_premium",
    propertyId: "prop_demo_001",
    name: "Premium Room",
    code: "PRM",
    description: "Luxury room with balcony, pool view, and premium amenities",
    maxOccupancy: 3,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 8000,
    beds: "1 King",
    size: "450 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Tea/Coffee Maker", "Safe", "Bathtub", "Balcony", "Pool View", "Bathrobe"],
    images: [],
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "rt_suite",
    propertyId: "prop_demo_001",
    name: "Royal Suite",
    code: "STE",
    description: "Expansive suite with living area, dining space, and panoramic views",
    maxOccupancy: 4,
    maxAdults: 3,
    maxChildren: 2,
    baseRate: 15000,
    beds: "1 King + 1 Sofa Bed",
    size: "720 sq ft",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Living Area", "Dining Area", "Safe", "Jacuzzi", "Balcony", "Butler Service"],
    images: [],
    sortOrder: 4,
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
    { typeId: "rt_standard", typeCode: "STD", typeName: "Standard Room", floors: [1, 2], perFloor: 10 },
    { typeId: "rt_deluxe", typeCode: "DLX", typeName: "Deluxe Room", floors: [2, 3], perFloor: 7 },
    { typeId: "rt_premium", typeCode: "PRM", typeName: "Premium Room", floors: [3, 4], perFloor: 5 },
    { typeId: "rt_suite", typeCode: "STE", typeName: "Royal Suite", floors: [4, 5], perFloor: 3 },
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

// ─── Guests (1 Production Verification Record) ───
export const demoGuests = [
  { id: "guest_001", firstName: "Anand", lastName: "Verma", email: "anand.verma@gmail.com", phone: "+91 98112 34567", city: "New Delhi", country: "IN", isVip: true, totalStays: 3, totalSpent: 28500, totalNights: 5 },
];

// ─── Reservations (1 Production Verification Record) ───
export const demoReservations = [
  { id: "res_001", confirmationNumber: "SS-SHM-20260808-00101", guestId: "guest_001", guestName: "Anand Verma", status: "CONFIRMED", checkIn: today, checkOut: tomorrow, nights: 1, roomNumber: "201", roomType: "Deluxe Room", adults: 2, children: 0, bookingSource: "DIRECT", roomRate: 5500, totalAmount: 6160, taxAmount: 660, paidAmount: 5500, balanceAmount: 660 },
];

// ─── Housekeeping Tasks (1 Production Verification Record) ───
export const demoHousekeepingTasks = [
  { id: "hk_001", roomNumber: "104", roomType: "Standard Room", type: "CHECKOUT_CLEANING", priority: "HIGH", status: "IN_PROGRESS", assignedTo: "Ramu Prasad", floor: 1 },
];

// ─── Guest Requests (1 Production Verification Record) ───
export const demoGuestRequests = [
  { id: "req_001", roomNumber: "201", guestName: "Anand Verma", type: "TOWELS", description: "2 Extra Fresh Bath Towels", quantity: 2, status: "ACCEPTED", priority: "NORMAL", createdAt: new Date() },
];

// ─── Recent Payments (1 Production Verification Record) ───
export const demoPayments = [
  { id: "pay_001", paymentNumber: "PAY-20260808-00001", guestName: "Anand Verma", reservationId: "res_001", amount: 5500, method: "UPI", status: "COMPLETED", reference: "UPI987654321", receivedAt: new Date() },
];

// ─── Recent Activity (1 Production Verification Record) ───
export const demoActivity = [
  { id: "act_001", action: "Reservation Confirmed", entity: "reservation", entityId: "res_001", user: "Ninaad Khera", detail: "Anand Verma - Deluxe Room #201 confirmed for 1 night", createdAt: new Date(), icon: "calendar" },
];

// ─── Expenses (1 Production Verification Record) ───
export const demoExpenses = [
  { id: "exp_001", date: today, vendor: "CleanPro Supplies Neemrana", category: "SUPPLIES", description: "Linen Sanitizer & Cleaning Supplies", amount: 2800, method: "UPI" },
];

// ─── Staff (Owner + 1 Front Desk Manager Record) ───
export const demoStaff = [
  { id: "OWNER-001", firstName: "Ninaad", lastName: "Khera", email: "Ninaad.khera@gmail.com", role: "Property Owner & GM", department: "MANAGEMENT", isActive: true },
  { id: "EMP-102", firstName: "Rahul", lastName: "Kapoor", email: "rahul.fdesk@hotelshemron.com", role: "Front Desk Manager", department: "FRONT_DESK", isActive: true },
];

// ─── Attention Items ───
export const demoAttentionItems = [
  { type: "arrivals", message: "1 arrival scheduled today", count: 1, severity: "info" as const, link: "/dashboard/front-desk" },
];

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

// ─── Guests (Clean Empty Production List) ───
export const demoGuests: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string; city: string; country: string; isVip: boolean; totalStays: number; totalSpent: number; totalNights: number }> = [];

// ─── Reservations (Clean Empty Production List) ───
export const demoReservations: Array<any> = [];

// ─── Housekeeping Tasks (Clean Empty Production List) ───
export const demoHousekeepingTasks: Array<any> = [];

// ─── Guest Requests (Clean Empty Production List) ───
export const demoGuestRequests: Array<any> = [];

// ─── Recent Payments (Clean Empty Production List) ───
export const demoPayments: Array<any> = [];

// ─── Recent Activity (Initial Owner Log Entry) ───
export const demoActivity = [
  { id: "act_001", action: "System Initialized", entity: "system", entityId: "prop_demo_001", user: "Ninaad Khera", detail: "StaySphere OS workspace initialized for Hotel Shemron, Neemrana", createdAt: new Date(), icon: "checkin" },
];

// ─── Expenses (Clean Empty Production List) ───
export const demoExpenses: Array<any> = [];

// ─── Staff (Initial Owner Account for Ninaad Khera) ───
export const demoStaff = [
  { id: "OWNER-001", firstName: "Ninaad", lastName: "Khera", email: "Ninaad.khera@gmail.com", role: "Property Owner & GM", department: "MANAGEMENT", isActive: true },
];

// ─── Attention Items ───
export const demoAttentionItems: Array<any> = [];

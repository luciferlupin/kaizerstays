// ═══════════════════════════════════════════════════
// KaizerStays — Production Data for Hotel Shemron, Neemrana
// Provides realistic hotel data without requiring a database
// ═══════════════════════════════════════════════════

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
  totalRooms: 32,
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
    description: "Deluxe Room — Live Aiosell Listing (28 Rooms)",
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

// ─── Rooms (Hotel Shemron, Neemrana - 32 Rooms Total) ───
export function getShemronRoomCategory(roomNumber: string) {
  if (roomNumber === "102" || roomNumber === "302") {
    return {
      roomTypeId: "twin-room",
      typeName: "Twin Room",
      typeCode: "TWIN",
    } as const;
  }

  if (roomNumber === "103" || roomNumber === "303") {
    return {
      roomTypeId: "suite-room",
      typeName: "Suite Room",
      typeCode: "SUITE",
    } as const;
  }

  return {
    roomTypeId: "deluxe-room",
    typeName: "Deluxe Room",
    typeCode: "DELUXE",
  } as const;
}

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

  // Floor 1 rooms (101 - 114). 102 is Twin and 103 is Suite.
  for (let i = 101; i <= 114; i++) {
    const roomNumber = i.toString();
    rooms.push({
      id: `room_${i}`,
      propertyId: "62a25484e5",
      ...getShemronRoomCategory(roomNumber),
      floorId: null,
      number: roomNumber,
      status: "AVAILABLE",
      housekeepingStatus: "CLEAN",
      isActive: true,
      floor: 1,
    });
  }

  // Floor 3 rooms (301 - 319, skipping 313). 302 is Twin and 303 is Suite.
  const floor3Numbers = [301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 314, 315, 316, 317, 318, 319];
  for (const num of floor3Numbers) {
    const roomNumber = num.toString();
    rooms.push({
      id: `room_${num}`,
      propertyId: "62a25484e5",
      ...getShemronRoomCategory(roomNumber),
      floorId: null,
      number: roomNumber,
      status: "AVAILABLE",
      housekeepingStatus: "CLEAN",
      isActive: true,
      floor: 3,
    });
  }

  return rooms;
}

export const demoRooms = generateRooms();

// ─── Guests (Clean Production CRM Ledger) ───
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

// ─── Reservations (Clean Production Reservation Ledger) ───
export const demoReservations: Array<{
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
}> = [];

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

// ─── Recent Payments (Clean Production Financial Ledger) ───
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

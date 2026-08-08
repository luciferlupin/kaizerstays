// ═══════════════════════════════════════════════════
// KaizerStay — Demo Data for Development
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
  name: "Kaizer Hotels Group",
  slug: "kaizer-hotels",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

// ─── Property ───
export const demoProperty = {
  id: "prop_demo_001",
  organizationId: "org_demo_001",
  name: "The Imperial Residency",
  slug: "imperial-residency-delhi",
  type: "HOTEL" as const,
  email: "frontdesk@imperialresidency.in",
  phone: "+91 11 4200 8800",
  address: "23, Aurangzeb Road, Lutyens' Delhi",
  city: "New Delhi",
  state: "Delhi",
  country: "IN",
  zipCode: "110011",
  gstin: "07AABCT1332L1ZD",
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
        const statusIdx = Math.floor(Math.random() * 10);
        let status = "AVAILABLE";
        let hkStatus = "CLEAN";

        if (statusIdx < 4) { status = "OCCUPIED"; hkStatus = "CLEAN"; }
        else if (statusIdx < 6) { status = "AVAILABLE"; hkStatus = "CLEAN"; }
        else if (statusIdx < 7) { status = "RESERVED"; hkStatus = "CLEAN"; }
        else if (statusIdx < 8) { status = "DIRTY"; hkStatus = "DIRTY"; }
        else if (statusIdx < 9) { status = "CLEANING"; hkStatus = "CLEANING"; }
        else { status = "MAINTENANCE"; hkStatus = "DIRTY"; }

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

// ─── Guests ───
export const demoGuests = [
  { id: "guest_001", firstName: "Rajesh", lastName: "Sharma", email: "rajesh.sharma@gmail.com", phone: "+91 98100 45678", city: "Mumbai", country: "IN", isVip: true, totalStays: 12, totalSpent: 245000, totalNights: 28 },
  { id: "guest_002", firstName: "Priya", lastName: "Patel", email: "priya.patel@outlook.com", phone: "+91 97890 12345", city: "Ahmedabad", country: "IN", isVip: false, totalStays: 3, totalSpent: 42000, totalNights: 5 },
  { id: "guest_003", firstName: "Amit", lastName: "Kumar", email: "amit.kumar@yahoo.com", phone: "+91 88765 43210", city: "Bangalore", country: "IN", isVip: false, totalStays: 1, totalSpent: 7000, totalNights: 2 },
  { id: "guest_004", firstName: "Sneha", lastName: "Reddy", email: "sneha.r@gmail.com", phone: "+91 99001 23456", city: "Hyderabad", country: "IN", isVip: true, totalStays: 8, totalSpent: 180000, totalNights: 18 },
  { id: "guest_005", firstName: "Vikram", lastName: "Singh", email: "vikram.singh@corp.in", phone: "+91 97654 32100", city: "Jaipur", country: "IN", isVip: false, totalStays: 5, totalSpent: 65000, totalNights: 10 },
  { id: "guest_006", firstName: "Ananya", lastName: "Gupta", email: "ananya.g@gmail.com", phone: "+91 88900 67890", city: "Delhi", country: "IN", isVip: false, totalStays: 2, totalSpent: 15000, totalNights: 3 },
  { id: "guest_007", firstName: "Mohammed", lastName: "Ali", email: "m.ali@outlook.com", phone: "+91 96543 21098", city: "Lucknow", country: "IN", isVip: false, totalStays: 4, totalSpent: 48000, totalNights: 8 },
  { id: "guest_008", firstName: "Kavitha", lastName: "Nair", email: "kavitha.nair@gmail.com", phone: "+91 87654 09876", city: "Kochi", country: "IN", isVip: true, totalStays: 6, totalSpent: 120000, totalNights: 14 },
  { id: "guest_009", firstName: "Arjun", lastName: "Mehta", email: "arjun.mehta@business.in", phone: "+91 99876 54321", city: "Pune", country: "IN", isVip: false, totalStays: 1, totalSpent: 5500, totalNights: 1 },
  { id: "guest_010", firstName: "Deepika", lastName: "Joshi", email: "deepika.j@yahoo.in", phone: "+91 88001 23456", city: "Chandigarh", country: "IN", isVip: false, totalStays: 3, totalSpent: 35000, totalNights: 6 },
  { id: "guest_011", firstName: "Suresh", lastName: "Iyer", email: "suresh.iyer@gmail.com", phone: "+91 97890 56789", city: "Chennai", country: "IN", isVip: false, totalStays: 2, totalSpent: 22000, totalNights: 4 },
  { id: "guest_012", firstName: "Lakshmi", lastName: "Menon", email: "lakshmi.m@corp.in", phone: "+91 98765 01234", city: "Trivandrum", country: "IN", isVip: true, totalStays: 7, totalSpent: 156000, totalNights: 15 },
];

// ─── Reservations ───
export const demoReservations = [
  // Today's arrivals
  { id: "res_001", confirmationNumber: "KS-IMP-20260808-00124", guestId: "guest_001", guestName: "Rajesh Sharma", status: "CONFIRMED", checkIn: today, checkOut: daysFromNow(3), nights: 3, roomNumber: "301", roomType: "Deluxe Room", adults: 2, children: 0, bookingSource: "DIRECT", roomRate: 5500, totalAmount: 18480, taxAmount: 1980, paidAmount: 5500, balanceAmount: 12980 },
  { id: "res_002", confirmationNumber: "KS-IMP-20260808-00125", guestId: "guest_002", guestName: "Priya Patel", status: "CONFIRMED", checkIn: today, checkOut: daysFromNow(2), nights: 2, roomNumber: "205", roomType: "Standard Room", adults: 1, children: 0, bookingSource: "BOOKING_COM", roomRate: 3500, totalAmount: 7840, taxAmount: 840, paidAmount: 7840, balanceAmount: 0 },
  { id: "res_003", confirmationNumber: "KS-IMP-20260808-00126", guestId: "guest_003", guestName: "Amit Kumar", status: "CONFIRMED", checkIn: today, checkOut: tomorrow, nights: 1, roomNumber: "102", roomType: "Standard Room", adults: 2, children: 1, bookingSource: "WALK_IN", roomRate: 3500, totalAmount: 3920, taxAmount: 420, paidAmount: 0, balanceAmount: 3920 },
  { id: "res_004", confirmationNumber: "KS-IMP-20260808-00127", guestId: "guest_006", guestName: "Ananya Gupta", status: "CONFIRMED", checkIn: today, checkOut: daysFromNow(4), nights: 4, roomNumber: "402", roomType: "Premium Room", adults: 2, children: 0, bookingSource: "WEBSITE", roomRate: 8000, totalAmount: 35840, taxAmount: 3840, paidAmount: 8000, balanceAmount: 27840 },

  // Currently in-house
  { id: "res_005", confirmationNumber: "KS-IMP-20260806-00120", guestId: "guest_004", guestName: "Sneha Reddy", status: "CHECKED_IN", checkIn: daysFromNow(-2), checkOut: tomorrow, nights: 3, roomNumber: "501", roomType: "Royal Suite", adults: 2, children: 1, bookingSource: "DIRECT", roomRate: 15000, totalAmount: 50400, taxAmount: 5400, paidAmount: 15000, balanceAmount: 35400 },
  { id: "res_006", confirmationNumber: "KS-IMP-20260807-00121", guestId: "guest_005", guestName: "Vikram Singh", status: "CHECKED_IN", checkIn: yesterday, checkOut: daysFromNow(2), nights: 3, roomNumber: "303", roomType: "Deluxe Room", adults: 1, children: 0, bookingSource: "MAKEMYTRIP", roomRate: 5500, totalAmount: 18480, taxAmount: 1980, paidAmount: 18480, balanceAmount: 0 },
  { id: "res_007", confirmationNumber: "KS-IMP-20260805-00118", guestId: "guest_007", guestName: "Mohammed Ali", status: "CHECKED_IN", checkIn: daysFromNow(-3), checkOut: today, nights: 3, roomNumber: "210", roomType: "Standard Room", adults: 2, children: 0, bookingSource: "AGODA", roomRate: 3500, totalAmount: 11760, taxAmount: 1260, paidAmount: 11760, balanceAmount: 0 },
  { id: "res_008", confirmationNumber: "KS-IMP-20260806-00119", guestId: "guest_008", guestName: "Kavitha Nair", status: "CHECKED_IN", checkIn: daysFromNow(-2), checkOut: daysFromNow(1), nights: 3, roomNumber: "405", roomType: "Premium Room", adults: 2, children: 0, bookingSource: "DIRECT", roomRate: 8000, totalAmount: 26880, taxAmount: 2880, paidAmount: 26880, balanceAmount: 0 },
  { id: "res_009", confirmationNumber: "KS-IMP-20260807-00122", guestId: "guest_012", guestName: "Lakshmi Menon", status: "CHECKED_IN", checkIn: yesterday, checkOut: daysFromNow(3), nights: 4, roomNumber: "504", roomType: "Royal Suite", adults: 2, children: 1, bookingSource: "CORPORATE", roomRate: 12000, totalAmount: 53760, taxAmount: 5760, paidAmount: 53760, balanceAmount: 0 },

  // Today's departures
  { id: "res_010", confirmationNumber: "KS-IMP-20260805-00115", guestId: "guest_009", guestName: "Arjun Mehta", status: "CHECKED_IN", checkIn: daysFromNow(-3), checkOut: today, nights: 3, roomNumber: "104", roomType: "Standard Room", adults: 1, children: 0, bookingSource: "GOIBIBO", roomRate: 3500, totalAmount: 11760, taxAmount: 1260, paidAmount: 10000, balanceAmount: 1760 },
  { id: "res_011", confirmationNumber: "KS-IMP-20260806-00116", guestId: "guest_010", guestName: "Deepika Joshi", status: "CHECKED_IN", checkIn: daysFromNow(-2), checkOut: today, nights: 2, roomNumber: "306", roomType: "Deluxe Room", adults: 2, children: 0, bookingSource: "EXPEDIA", roomRate: 5500, totalAmount: 12320, taxAmount: 1320, paidAmount: 12320, balanceAmount: 0 },

  // Upcoming
  { id: "res_012", confirmationNumber: "KS-IMP-20260809-00128", guestId: "guest_011", guestName: "Suresh Iyer", status: "CONFIRMED", checkIn: daysFromNow(1), checkOut: daysFromNow(4), nights: 3, roomNumber: "202", roomType: "Standard Room", adults: 2, children: 0, bookingSource: "DIRECT", roomRate: 3500, totalAmount: 11760, taxAmount: 1260, paidAmount: 11760, balanceAmount: 0 },

  // Cancelled
  { id: "res_013", confirmationNumber: "KS-IMP-20260808-00129", guestId: "guest_003", guestName: "Amit Kumar", status: "CANCELLED", checkIn: daysFromNow(5), checkOut: daysFromNow(7), nights: 2, roomNumber: "", roomType: "Deluxe Room", adults: 2, children: 0, bookingSource: "BOOKING_COM", roomRate: 5500, totalAmount: 12320, taxAmount: 1320, paidAmount: 0, balanceAmount: 0 },
];

// ─── Today's Stats ───
export const demoDashboardStats = {
  occupancyRate: 76,
  roomsAvailable: 12,
  roomsOccupied: 33,
  arrivalsToday: 4,
  departuresToday: 3,
  inHouseGuests: 38,
  roomsDirty: 5,
  roomsCleaning: 2,
  roomsMaintenance: 1,
};

export const demoRevenueStats = {
  revenueToday: 142800,
  revenueMTD: 2845600,
  expectedRevenue: 168000,
  outstandingPayments: 82400,
};

export const demoRoomStatusSummary = {
  available: 12,
  occupied: 33,
  reserved: 4,
  dirty: 5,
  cleaning: 2,
  inspected: 1,
  maintenance: 1,
  outOfOrder: 0,
  blocked: 0,
};

// ─── Housekeeping Tasks ───
export const demoHousekeepingTasks = [
  { id: "hk_001", roomNumber: "104", roomType: "Standard Room", type: "CHECKOUT_CLEANING", priority: "HIGH", status: "PENDING", assignedTo: "Ramu Prasad", floor: 1 },
  { id: "hk_002", roomNumber: "210", roomType: "Standard Room", type: "CHECKOUT_CLEANING", priority: "HIGH", status: "IN_PROGRESS", assignedTo: "Sunita Devi", floor: 2 },
  { id: "hk_003", roomNumber: "306", roomType: "Deluxe Room", type: "CHECKOUT_CLEANING", priority: "HIGH", status: "PENDING", assignedTo: null, floor: 3 },
  { id: "hk_004", roomNumber: "303", roomType: "Deluxe Room", type: "STAYOVER_CLEANING", priority: "NORMAL", status: "PENDING", assignedTo: "Ramu Prasad", floor: 3 },
  { id: "hk_005", roomNumber: "501", roomType: "Royal Suite", type: "STAYOVER_CLEANING", priority: "HIGH", status: "ASSIGNED", assignedTo: "Meena Kumari", floor: 5 },
  { id: "hk_006", roomNumber: "108", roomType: "Standard Room", type: "DEEP_CLEANING", priority: "LOW", status: "COMPLETED", assignedTo: "Ramu Prasad", floor: 1 },
  { id: "hk_007", roomNumber: "405", roomType: "Premium Room", type: "STAYOVER_CLEANING", priority: "NORMAL", status: "COMPLETED", assignedTo: "Sunita Devi", floor: 4 },
];

// ─── Guest Requests ───
export const demoGuestRequests = [
  { id: "req_001", roomNumber: "501", guestName: "Sneha Reddy", type: "TOWELS", description: "Extra towels needed", quantity: 2, status: "REQUESTED", priority: "NORMAL", createdAt: new Date(Date.now() - 15 * 60000) },
  { id: "req_002", roomNumber: "405", guestName: "Kavitha Nair", type: "ROOM_SERVICE", description: "Room service - Coffee and sandwiches", quantity: 1, status: "ACCEPTED", priority: "NORMAL", createdAt: new Date(Date.now() - 30 * 60000) },
  { id: "req_003", roomNumber: "303", guestName: "Vikram Singh", type: "MAINTENANCE", description: "AC not cooling properly", quantity: 1, status: "ON_THE_WAY", priority: "HIGH", createdAt: new Date(Date.now() - 45 * 60000) },
  { id: "req_004", roomNumber: "504", guestName: "Lakshmi Menon", type: "LAUNDRY", description: "Express laundry service - 5 items", quantity: 5, status: "COMPLETED", priority: "NORMAL", createdAt: new Date(Date.now() - 120 * 60000) },
];

// ─── Recent Payments ───
export const demoPayments = [
  { id: "pay_001", paymentNumber: "PAY-20260808-00045", guestName: "Priya Patel", reservationId: "res_002", amount: 7840, method: "UPI", status: "COMPLETED", reference: "UPI123456789", receivedAt: new Date(Date.now() - 2 * 3600000) },
  { id: "pay_002", paymentNumber: "PAY-20260808-00044", guestName: "Vikram Singh", reservationId: "res_006", amount: 18480, method: "CREDIT_CARD", status: "COMPLETED", reference: "****4523", receivedAt: new Date(Date.now() - 24 * 3600000) },
  { id: "pay_003", paymentNumber: "PAY-20260808-00043", guestName: "Rajesh Sharma", reservationId: "res_001", amount: 5500, method: "CASH", status: "COMPLETED", reference: null, receivedAt: new Date(Date.now() - 1 * 3600000) },
  { id: "pay_004", paymentNumber: "PAY-20260807-00042", guestName: "Kavitha Nair", reservationId: "res_008", amount: 26880, method: "RAZORPAY", status: "COMPLETED", reference: "pay_Lk8mN2pQ3r", receivedAt: new Date(Date.now() - 48 * 3600000) },
  { id: "pay_005", paymentNumber: "PAY-20260807-00041", guestName: "Lakshmi Menon", reservationId: "res_009", amount: 53760, method: "BANK_TRANSFER", status: "COMPLETED", reference: "NEFT123456", receivedAt: new Date(Date.now() - 24 * 3600000) },
  { id: "pay_006", paymentNumber: "PAY-20260806-00040", guestName: "Arjun Mehta", reservationId: "res_010", amount: 10000, method: "CASH", status: "COMPLETED", reference: null, receivedAt: new Date(Date.now() - 72 * 3600000) },
];

// ─── Recent Activity ───
export const demoActivity = [
  { id: "act_001", action: "Reservation created", entity: "reservation", entityId: "res_001", user: "Pooja Verma", detail: "Rajesh Sharma - Deluxe Room #301, 3 nights", createdAt: new Date(Date.now() - 30 * 60000), icon: "calendar" },
  { id: "act_002", action: "Payment received", entity: "payment", entityId: "pay_003", user: "Pooja Verma", detail: "₹5,500 cash from Rajesh Sharma", createdAt: new Date(Date.now() - 60 * 60000), icon: "payment" },
  { id: "act_003", action: "Guest checked in", entity: "reservation", entityId: "res_006", user: "Rahul Kapoor", detail: "Vikram Singh - Room 303", createdAt: new Date(Date.now() - 90 * 60000), icon: "checkin" },
  { id: "act_004", action: "Room marked clean", entity: "room", entityId: "room_108", user: "Ramu Prasad", detail: "Room 108 - Standard Room", createdAt: new Date(Date.now() - 120 * 60000), icon: "housekeeping" },
  { id: "act_005", action: "Invoice generated", entity: "invoice", entityId: "inv_001", user: "System", detail: "INV-202608-00018 for Mohammed Ali", createdAt: new Date(Date.now() - 150 * 60000), icon: "invoice" },
  { id: "act_006", action: "Reservation cancelled", entity: "reservation", entityId: "res_013", user: "Pooja Verma", detail: "Amit Kumar - Booking.com cancellation", createdAt: new Date(Date.now() - 180 * 60000), icon: "cancel" },
  { id: "act_007", action: "Guest request", entity: "request", entityId: "req_001", user: "Guest", detail: "Room 501 - Extra towels requested", createdAt: new Date(Date.now() - 15 * 60000), icon: "request" },
  { id: "act_008", action: "Rate updated", entity: "rate", entityId: "rt_deluxe", user: "Sunil Manager", detail: "Deluxe Room rate updated to ₹6,000 for Aug 15-18", createdAt: new Date(Date.now() - 240 * 60000), icon: "rate" },
];

// ─── Expenses ───
export const demoExpenses = [
  { id: "exp_001", date: today, vendor: "Delhi Electricity Board", category: "UTILITIES", description: "Monthly electricity bill", amount: 85000, method: "BANK_TRANSFER" },
  { id: "exp_002", date: today, vendor: "Fresh Farms Produce", category: "FOOD", description: "Daily vegetable and fruit supply", amount: 12500, method: "UPI" },
  { id: "exp_003", date: yesterday, vendor: "CleanPro Supplies", category: "SUPPLIES", description: "Housekeeping cleaning supplies", amount: 8900, method: "UPI" },
  { id: "exp_004", date: yesterday, vendor: "TechFix Services", category: "MAINTENANCE", description: "AC servicing - 5 units", amount: 15000, method: "CASH" },
  { id: "exp_005", date: daysFromNow(-2), vendor: "Staff Salaries", category: "SALARY", description: "July 2026 salary disbursement", amount: 450000, method: "BANK_TRANSFER" },
];

// ─── Staff ───
export const demoStaff = [
  { id: "staff_001", firstName: "Sunil", lastName: "Manager", email: "sunil@imperialresidency.in", role: "General Manager", department: "MANAGEMENT", isActive: true },
  { id: "staff_002", firstName: "Pooja", lastName: "Verma", email: "pooja@imperialresidency.in", role: "Front Desk Manager", department: "FRONT_DESK", isActive: true },
  { id: "staff_003", firstName: "Rahul", lastName: "Kapoor", email: "rahul@imperialresidency.in", role: "Receptionist", department: "FRONT_DESK", isActive: true },
  { id: "staff_004", firstName: "Meena", lastName: "Kumari", email: "meena@imperialresidency.in", role: "Housekeeping Manager", department: "HOUSEKEEPING", isActive: true },
  { id: "staff_005", firstName: "Ramu", lastName: "Prasad", email: "ramu@imperialresidency.in", role: "Housekeeping Staff", department: "HOUSEKEEPING", isActive: true },
  { id: "staff_006", firstName: "Sunita", lastName: "Devi", email: "sunita@imperialresidency.in", role: "Housekeeping Staff", department: "HOUSEKEEPING", isActive: true },
  { id: "staff_007", firstName: "Arun", lastName: "Chef", email: "arun@imperialresidency.in", role: "Restaurant Manager", department: "RESTAURANT", isActive: true },
  { id: "staff_008", firstName: "Neha", lastName: "Accountant", email: "neha@imperialresidency.in", role: "Accountant", department: "FINANCE", isActive: true },
];

// ─── Attention Items ───
export const demoAttentionItems = [
  { type: "arrivals", message: "4 arrivals within next 2 hours", count: 4, severity: "warning" as const, link: "/dashboard/front-desk" },
  { type: "dirty_rooms", message: "5 rooms still need cleaning", count: 5, severity: "warning" as const, link: "/dashboard/housekeeping" },
  { type: "outstanding", message: "₹82,400 outstanding from in-house guests", count: 82400, severity: "warning" as const, link: "/dashboard/payments" },
  { type: "maintenance", message: "1 maintenance issue reported", count: 1, severity: "info" as const, link: "/dashboard/rooms" },
];

// ═══════════════════════════════════════════════════
// StaySphere — Restaurant POS Data
// Menu items, tables, kitchen orders for Hotel Shemron
// ═══════════════════════════════════════════════════

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  prepTime: number; // minutes
}

export interface POSTable {
  id: string;
  number: number;
  seats: number;
  location: string;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";
  currentOrderId: string | null;
  guestName: string | null;
  roomNumber: string | null;
}

export interface KOTItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes: string;
}

export interface KitchenOrder {
  id: string;
  kotNumber: string;
  tableNumber: number;
  items: KOTItem[];
  status: "PENDING" | "PREPARING" | "READY" | "SERVED" | "BILLED";
  createdAt: Date;
  total: number;
  guestName: string | null;
  roomNumber: string | null;
  paymentMethod: string | null;
}

// ─── Menu Items ───
export const menuItems: MenuItem[] = [
  // Starters
  { id: "m001", name: "Paneer Tikka", category: "STARTERS", price: 320, isVeg: true, isAvailable: true, prepTime: 15 },
  { id: "m002", name: "Chicken Seekh Kebab", category: "STARTERS", price: 380, isVeg: false, isAvailable: true, prepTime: 18 },
  { id: "m003", name: "Veg Spring Rolls", category: "STARTERS", price: 250, isVeg: true, isAvailable: true, prepTime: 12 },
  { id: "m004", name: "Fish Amritsari", category: "STARTERS", price: 420, isVeg: false, isAvailable: true, prepTime: 20 },
  { id: "m005", name: "Crispy Corn", category: "STARTERS", price: 220, isVeg: true, isAvailable: true, prepTime: 10 },
  { id: "m006", name: "Tandoori Chicken", category: "STARTERS", price: 450, isVeg: false, isAvailable: true, prepTime: 25 },

  // Main Course
  { id: "m010", name: "Dal Makhani", category: "MAIN_COURSE", price: 350, isVeg: true, isAvailable: true, prepTime: 20 },
  { id: "m011", name: "Butter Chicken", category: "MAIN_COURSE", price: 420, isVeg: false, isAvailable: true, prepTime: 22 },
  { id: "m012", name: "Paneer Butter Masala", category: "MAIN_COURSE", price: 360, isVeg: true, isAvailable: true, prepTime: 18 },
  { id: "m013", name: "Mutton Rogan Josh", category: "MAIN_COURSE", price: 520, isVeg: false, isAvailable: true, prepTime: 30 },
  { id: "m014", name: "Kadhai Paneer", category: "MAIN_COURSE", price: 340, isVeg: true, isAvailable: true, prepTime: 15 },
  { id: "m015", name: "Chicken Biryani", category: "MAIN_COURSE", price: 380, isVeg: false, isAvailable: true, prepTime: 25 },
  { id: "m016", name: "Veg Biryani", category: "MAIN_COURSE", price: 300, isVeg: true, isAvailable: true, prepTime: 22 },
  { id: "m017", name: "Butter Naan", category: "MAIN_COURSE", price: 60, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m018", name: "Garlic Naan", category: "MAIN_COURSE", price: 80, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m019", name: "Steamed Rice", category: "MAIN_COURSE", price: 150, isVeg: true, isAvailable: true, prepTime: 10 },
  { id: "m020", name: "Jeera Rice", category: "MAIN_COURSE", price: 180, isVeg: true, isAvailable: true, prepTime: 10 },

  // Beverages
  { id: "m030", name: "Fresh Lime Soda", category: "BEVERAGES", price: 120, isVeg: true, isAvailable: true, prepTime: 3 },
  { id: "m031", name: "Masala Chai", category: "BEVERAGES", price: 80, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m032", name: "Filter Coffee", category: "BEVERAGES", price: 100, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m033", name: "Mango Lassi", category: "BEVERAGES", price: 150, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m034", name: "Mineral Water (1L)", category: "BEVERAGES", price: 50, isVeg: true, isAvailable: true, prepTime: 1 },
  { id: "m035", name: "Coca Cola", category: "BEVERAGES", price: 80, isVeg: true, isAvailable: true, prepTime: 1 },
  { id: "m036", name: "Fresh Orange Juice", category: "BEVERAGES", price: 180, isVeg: true, isAvailable: true, prepTime: 5 },

  // Desserts
  { id: "m040", name: "Gulab Jamun", category: "DESSERTS", price: 150, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m041", name: "Rasmalai", category: "DESSERTS", price: 180, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m042", name: "Ice Cream (2 scoops)", category: "DESSERTS", price: 200, isVeg: true, isAvailable: true, prepTime: 3 },
  { id: "m043", name: "Brownie with Ice Cream", category: "DESSERTS", price: 280, isVeg: true, isAvailable: true, prepTime: 8 },

  // Breakfast
  { id: "m050", name: "Masala Omelette", category: "BREAKFAST", price: 120, isVeg: false, isAvailable: true, prepTime: 8 },
  { id: "m051", name: "Aloo Paratha (2pc)", category: "BREAKFAST", price: 180, isVeg: true, isAvailable: true, prepTime: 12 },
  { id: "m052", name: "Poha", category: "BREAKFAST", price: 100, isVeg: true, isAvailable: true, prepTime: 10 },
  { id: "m053", name: "Toast & Butter", category: "BREAKFAST", price: 80, isVeg: true, isAvailable: true, prepTime: 5 },
  { id: "m054", name: "Continental Breakfast Platter", category: "BREAKFAST", price: 450, isVeg: false, isAvailable: true, prepTime: 15 },
];

// ─── Restaurant Tables ───
export const posTables: POSTable[] = [
  { id: "tbl_1", number: 1, seats: 2, location: "Indoor", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_2", number: 2, seats: 2, location: "Indoor", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_3", number: 3, seats: 4, location: "Indoor", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_4", number: 4, seats: 4, location: "Indoor", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_5", number: 5, seats: 6, location: "Indoor", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_6", number: 6, seats: 6, location: "Indoor", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_7", number: 7, seats: 2, location: "Poolside", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_8", number: 8, seats: 4, location: "Poolside", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_9", number: 9, seats: 4, location: "Poolside", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_10", number: 10, seats: 8, location: "Terrace", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_11", number: 11, seats: 4, location: "Terrace", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
  { id: "tbl_12", number: 12, seats: 2, location: "Terrace", status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null },
];

// ─── Active Kitchen Orders (Clean Empty List) ───
export const activeKOTs: KitchenOrder[] = [];

export const menuCategories = [
  { id: "STARTERS", label: "Starters", emoji: "🍢" },
  { id: "MAIN_COURSE", label: "Main Course", emoji: "🍛" },
  { id: "BEVERAGES", label: "Beverages", emoji: "🥤" },
  { id: "DESSERTS", label: "Desserts", emoji: "🍮" },
  { id: "BREAKFAST", label: "Breakfast", emoji: "🍳" },
];

export const posStats = {
  todayRevenue: 0,
  ordersToday: 0,
  avgOrderValue: 0,
  activeOrders: 0,
};

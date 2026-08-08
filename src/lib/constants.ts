// ═══════════════════════════════════════════════════
// KaizerStay — Application Constants
// ═══════════════════════════════════════════════════

export const APP_NAME = "KaizerStay";
export const APP_DESCRIPTION = "Run your entire hotel from one intelligent operating system";
export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

// ─── Room Status Labels & Colors ───

export const ROOM_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgClass: string }
> = {
  AVAILABLE: { label: "Available", color: "success", bgClass: "room-available" },
  OCCUPIED: { label: "Occupied", color: "primary", bgClass: "room-occupied" },
  RESERVED: { label: "Reserved", color: "purple", bgClass: "room-reserved" },
  DIRTY: { label: "Dirty", color: "warning", bgClass: "room-dirty" },
  CLEANING: { label: "Cleaning", color: "orange", bgClass: "room-cleaning" },
  INSPECTED: { label: "Inspected", color: "teal", bgClass: "room-inspected" },
  MAINTENANCE: { label: "Maintenance", color: "danger", bgClass: "room-maintenance" },
  OUT_OF_ORDER: { label: "Out of Order", color: "default", bgClass: "room-out-of-order" },
  BLOCKED: { label: "Blocked", color: "default", bgClass: "room-blocked" },
};

export const HOUSEKEEPING_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  CLEAN: { label: "Clean", color: "success" },
  DIRTY: { label: "Dirty", color: "warning" },
  CLEANING: { label: "Cleaning", color: "orange" },
  INSPECTED: { label: "Inspected", color: "teal" },
};

// ─── Reservation Status Labels & Colors ───

export const RESERVATION_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  PENDING: { label: "Pending", color: "warning" },
  CONFIRMED: { label: "Confirmed", color: "primary" },
  CHECKED_IN: { label: "Checked In", color: "success" },
  CHECKED_OUT: { label: "Checked Out", color: "default" },
  CANCELLED: { label: "Cancelled", color: "danger" },
  NO_SHOW: { label: "No Show", color: "danger" },
};

// ─── Booking Source Labels ───

export const BOOKING_SOURCE_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  WALK_IN: "Walk-In",
  WEBSITE: "Website",
  BOOKING_COM: "Booking.com",
  AGODA: "Agoda",
  EXPEDIA: "Expedia",
  MAKEMYTRIP: "MakeMyTrip",
  GOIBIBO: "Goibibo",
  AIRBNB: "Airbnb",
  TRAVEL_AGENT: "Travel Agent",
  CORPORATE: "Corporate",
  OTHER: "Other",
};

// ─── Payment Method Labels ───

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  RAZORPAY: "Razorpay",
  OTA_COLLECT: "OTA Collect",
  CORPORATE_CREDIT: "Corporate Credit",
  OTHER: "Other",
};

export const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  PENDING: { label: "Pending", color: "warning" },
  COMPLETED: { label: "Completed", color: "success" },
  FAILED: { label: "Failed", color: "danger" },
  REFUNDED: { label: "Refunded", color: "purple" },
  PARTIALLY_REFUNDED: { label: "Partially Refunded", color: "orange" },
};

// ─── Folio Category Labels ───

export const FOLIO_CATEGORY_LABELS: Record<string, string> = {
  ROOM_CHARGE: "Room Charge",
  TAX: "Tax",
  RESTAURANT: "Restaurant",
  MINIBAR: "Mini Bar",
  LAUNDRY: "Laundry",
  SPA: "Spa",
  TRANSPORT: "Transport",
  EXTRA_BED: "Extra Bed",
  LATE_CHECKOUT: "Late Checkout",
  EARLY_CHECKIN: "Early Check-in",
  ROOM_SERVICE: "Room Service",
  TELEPHONE: "Telephone",
  INTERNET: "Internet",
  PARKING: "Parking",
  DISCOUNT: "Discount",
  ADJUSTMENT: "Adjustment",
  PAYMENT: "Payment",
  REFUND: "Refund",
  OTHER: "Other",
};

// ─── Priority Labels ───

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "default" },
  NORMAL: { label: "Normal", color: "primary" },
  HIGH: { label: "High", color: "warning" },
  URGENT: { label: "Urgent", color: "danger" },
};

// ─── Task Status Labels ───

export const TASK_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "default" },
  OPEN: { label: "Open", color: "warning" },
  ASSIGNED: { label: "Assigned", color: "primary" },
  IN_PROGRESS: { label: "In Progress", color: "orange" },
  COMPLETED: { label: "Completed", color: "success" },
  INSPECTED: { label: "Inspected", color: "teal" },
  CLOSED: { label: "Closed", color: "default" },
};

// ─── Guest ID Types ───

export const GUEST_ID_TYPES = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "PAN", label: "PAN Card" },
  { value: "OTHER", label: "Other" },
];

// ─── Meal Plans ───

export const MEAL_PLANS = [
  { value: "EP", label: "European Plan (Room Only)" },
  { value: "CP", label: "Continental Plan (Breakfast)" },
  { value: "MAP", label: "Modified American Plan (Breakfast + Dinner)" },
  { value: "AP", label: "American Plan (All Meals)" },
];

// ─── Permissions ───

export const PERMISSIONS = {
  // Reservations
  VIEW_RESERVATIONS: "view_reservations",
  CREATE_RESERVATIONS: "create_reservations",
  EDIT_RESERVATIONS: "edit_reservations",
  CANCEL_RESERVATIONS: "cancel_reservations",
  CHECK_IN_GUEST: "check_in_guest",
  CHECK_OUT_GUEST: "check_out_guest",

  // Payments
  VIEW_PAYMENTS: "view_payments",
  RECORD_PAYMENT: "record_payment",
  REFUND_PAYMENT: "refund_payment",

  // Guests
  VIEW_GUESTS: "view_guests",
  EDIT_GUESTS: "edit_guests",

  // Rooms
  MANAGE_ROOMS: "manage_rooms",

  // Housekeeping
  MANAGE_HOUSEKEEPING: "manage_housekeeping",
  UPDATE_ROOM_STATUS: "update_room_status",

  // Reports
  VIEW_REPORTS: "view_reports",
  VIEW_ANALYTICS: "view_analytics",

  // Rates
  EDIT_RATES: "edit_rates",

  // Staff
  MANAGE_STAFF: "manage_staff",

  // Settings
  MANAGE_PROPERTY_SETTINGS: "manage_property_settings",

  // POS
  ACCESS_POS: "access_pos",

  // Expenses
  VIEW_EXPENSES: "view_expenses",
  CREATE_EXPENSES: "create_expenses",

  // Invoices
  VIEW_INVOICES: "view_invoices",
  CREATE_INVOICES: "create_invoices",
} as const;

// ─── Navigation Items ───

export const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Front Desk", href: "/dashboard/front-desk", icon: "ConciergeBell" },
  { label: "Reservations", href: "/dashboard/reservations", icon: "CalendarCheck" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "Calendar" },
  { label: "Guests", href: "/dashboard/guests", icon: "Users" },
  { label: "Rooms", href: "/dashboard/rooms", icon: "DoorOpen" },
  { label: "Housekeeping", href: "/dashboard/housekeeping", icon: "Sparkles" },
  { label: "Guest Requests", href: "/dashboard/requests", icon: "MessageSquare" },
  { label: "Payments", href: "/dashboard/payments", icon: "CreditCard" },
  { label: "Expenses", href: "/dashboard/expenses", icon: "Receipt" },
  { label: "Invoices", href: "/dashboard/invoices", icon: "FileText" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3" },
  { label: "Reports", href: "/dashboard/reports", icon: "ClipboardList" },
  { label: "Staff", href: "/dashboard/staff", icon: "UserCog" },
  { label: "Activity", href: "/dashboard/activity", icon: "Activity" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

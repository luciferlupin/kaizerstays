// ═══════════════════════════════════════════════════
// KaizerStay — Shared TypeScript Types
// ═══════════════════════════════════════════════════

import type {
  Organization,
  Property,
  Room,
  RoomType,
  Guest,
  Reservation,
  ReservationRoom,
  Folio,
  FolioItem,
  Payment,
  Invoice,
  HousekeepingTask,
  MaintenanceTask,
  GuestRequest,
  Staff,
  Role,
  AuditLog,
  Notification,
  Expense,
  RoomStatus,
  HousekeepingStatus,
  ReservationStatus,
  BookingSource,
  PaymentMethod,
  PaymentStatus,
  Priority,
  TaskStatus,
  RequestStatus,
  FolioCategory,
  InvoiceStatus,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Organization,
  Property,
  Room,
  RoomType,
  Guest,
  Reservation,
  ReservationRoom,
  Folio,
  FolioItem,
  Payment,
  Invoice,
  HousekeepingTask,
  MaintenanceTask,
  GuestRequest,
  Staff,
  Role,
  AuditLog,
  Notification,
  Expense,
};

// Re-export enums
export {
  RoomStatus,
  HousekeepingStatus,
  ReservationStatus,
  BookingSource,
  PaymentMethod,
  PaymentStatus,
  Priority,
  TaskStatus,
  RequestStatus,
  FolioCategory,
  InvoiceStatus,
} from "@prisma/client";

// ─── Extended Types with Relations ───

export type RoomWithType = Room & {
  roomType: RoomType;
};

export type ReservationWithGuest = Reservation & {
  guest: Guest;
};

export type ReservationFull = Reservation & {
  guest: Guest;
  rooms: (ReservationRoom & { room: Room | null; roomType: RoomType })[];
  folios: Folio[];
  payments: Payment[];
};

export type FolioWithItems = Folio & {
  items: FolioItem[];
};

export type HousekeepingTaskWithRoom = HousekeepingTask & {
  room: Room & { roomType: RoomType };
  assignedTo: Staff | null;
};

export type GuestRequestWithDetails = GuestRequest & {
  room: Room | null;
  guest: Guest | null;
  assignedTo: Staff | null;
};

// ─── Service Input Types ───

export interface CreateReservationInput {
  propertyId: string;
  guestId?: string;
  guest?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    country?: string;
    idType?: string;
    idNumber?: string;
  };
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  roomTypeId: string;
  roomId?: string;
  roomRate: number;
  bookingSource: BookingSource;
  specialRequests?: string;
  createdById?: string;
}

export interface CheckInInput {
  reservationId: string;
  roomId?: string;
  staffId?: string;
  notes?: string;
}

export interface CheckOutInput {
  reservationId: string;
  staffId?: string;
  notes?: string;
}

export interface RecordPaymentInput {
  propertyId: string;
  reservationId?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  guestName?: string;
  notes?: string;
  receivedBy?: string;
}

export interface AddFolioChargeInput {
  folioId: string;
  description: string;
  category: FolioCategory;
  amount: number;
  taxAmount?: number;
  reference?: string;
  postedBy?: string;
}

export interface CreateHousekeepingTaskInput {
  propertyId: string;
  roomId: string;
  type: string;
  priority?: Priority;
  assignedToId?: string;
  notes?: string;
}

// ─── Dashboard Types ───

export interface DashboardStats {
  occupancyRate: number;
  roomsAvailable: number;
  roomsOccupied: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  roomsDirty: number;
  roomsCleaning: number;
  roomsMaintenance: number;
}

export interface RevenueStats {
  revenueToday: number;
  revenueMTD: number;
  expectedRevenue: number;
  outstandingPayments: number;
}

export interface RoomStatusSummary {
  available: number;
  occupied: number;
  reserved: number;
  dirty: number;
  cleaning: number;
  inspected: number;
  maintenance: number;
  outOfOrder: number;
  blocked: number;
}

// ─── API Response Types ───

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Auth Types ───

export interface CurrentUser {
  id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  organizationId: string;
  propertyIds: string[];
  permissions: string[];
}

// ─── Navigation ───

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

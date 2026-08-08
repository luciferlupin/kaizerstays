// ═══════════════════════════════════════════════════
// StaySphere — Shared TypeScript Types (Fail-Safe)
// ═══════════════════════════════════════════════════

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "DIRTY" | "CLEANING" | "MAINTENANCE" | "RESERVED" | "OUT_OF_SERVICE" | "INSPECTED";
export type HousekeepingStatus = "CLEAN" | "DIRTY" | "CLEANING" | "INSPECTED";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type BookingSource = "DIRECT" | "WEBSITE" | "WALK_IN" | "BOOKING_COM" | "MAKEMYTRIP" | "AGODA" | "GOIBIBO" | "EXPEDIA" | "AIRBNB" | "CORPORATE";
export type PaymentMethod = "CASH" | "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "RAZORPAY" | "BANK_TRANSFER" | "ROOM_FOLIO";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type RequestStatus = "REQUESTED" | "ACCEPTED" | "ON_THE_WAY" | "COMPLETED" | "CANCELLED";
export type FolioCategory = "ROOM_CHARGE" | "TAX" | "RESTAURANT" | "LAUNDRY" | "MINIBAR" | "PAYMENT" | "OTHER";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
}

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  gstin: string;
}

export interface Room {
  id: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  isActive: boolean;
  floor: number;
  typeName: string;
  typeCode: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  description: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  beds: string;
  size: string;
  amenities: string[];
  isActive: boolean;
}

export interface Guest {
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
}

export interface Reservation {
  id: string;
  confirmationNumber: string;
  guestId: string;
  guestName: string;
  status: ReservationStatus;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  roomNumber: string;
  roomType: string;
  adults: number;
  children: number;
  bookingSource: BookingSource;
  roomRate: number;
  totalAmount: number;
  taxAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface FolioItem {
  id: string;
  description: string;
  category: FolioCategory;
  amount: number;
  date: Date | string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  guestName: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  receivedAt: Date | string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType: string;
  type: string;
  priority: Priority;
  status: TaskStatus;
  assignedTo: string | null;
  floor: number;
}

export interface GuestRequest {
  id: string;
  roomNumber: string;
  guestName: string;
  type: string;
  description: string;
  quantity: number;
  status: RequestStatus;
  priority: Priority;
  createdAt: Date | string;
}

export type RoomWithType = Room & {
  roomType: RoomType;
};

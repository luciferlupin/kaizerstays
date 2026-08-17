import { NextResponse } from "next/server";
import {
  getAllStoredReservations,
  saveStoredReservation,
  updateReservationStatusInStore,
} from "@/lib/server-store";
import { prisma } from "@/lib/prisma";
import { calculateInclusiveHotelGST } from "@/lib/gst";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder") || process.env.DATABASE_URL?.includes("[YOUR-DB-PASSWORD]");
    let dbReservations: any[] = [];

    if (!isPlaceholder) {
      try {
        dbReservations = await prisma.reservation.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        });
      } catch (err) {
        console.warn("[api/reservations] Prisma query fallback to server-store:", err);
      }
    }

    let supabaseReservations: any[] = [];
    try {
      const { fetchSupabaseReservations } = await import("@/lib/supabase");
      supabaseReservations = await fetchSupabaseReservations();
    } catch {}

    const stored = getAllStoredReservations();
    const mergedMap = new Map<string, any>();

    // Priority 1: Stored local server reservations
    stored.forEach((r) => mergedMap.set((r.id || r.confirmationNumber).trim().toLowerCase(), r));

    // Priority 2: Supabase database reservations
    supabaseReservations.forEach((r: any) => {
      const key = (r.id || r.confirmationNumber).trim().toLowerCase();
      if (!mergedMap.has(key)) {
        mergedMap.set(key, r);
      }
    });

    // Priority 3: Prisma database reservations
    dbReservations.forEach((r: any) => {
      const key = (r.id || r.confirmationNumber).trim().toLowerCase();
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          ...r,
          guestName: r.guestName || "Guest",
          roomType: r.roomType || "Deluxe Room",
          bookingSource: r.bookingSource || "DIRECT",
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: Array.from(mergedMap.values()),
      count: mergedMap.size,
      source: "SUPABASE_PLUS_SERVER_STORE",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const confNo =
      body.confirmationNumber ||
      `KZ-SHM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nights = Math.max(1, Number(body.nights) || 1);
    const roomRate = Math.max(0, Number(body.roomRate) || 2800);
    const totalAmount = Math.max(0, Number(body.totalAmount ?? roomRate * nights));
    const gst = calculateInclusiveHotelGST(totalAmount);
    const paidAmount = Math.max(0, Number(body.paidAmount) || 0);

    const newRes = {
      id: body.id || `res_${Date.now()}`,
      confirmationNumber: confNo,
      guestName: body.guestName || "Guest",
      guestId: body.guestId || `guest_${Date.now()}`,
      status: (body.status || "CONFIRMED") as any,
      checkIn: body.checkIn || new Date().toISOString(),
      checkOut: body.checkOut || new Date().toISOString(),
      nights,
      roomNumber: body.roomNumber || "",
      roomType: body.roomType || "Deluxe Room",
      adults: Number(body.adults) || 2,
      children: Number(body.children) || 0,
      bookingSource: body.bookingSource || "DIRECT",
      roomRate,
      totalAmount: gst.totalInclusive,
      taxAmount: gst.totalTax,
      paidAmount,
      balanceAmount: Math.max(0, gst.totalInclusive - paidAmount),
      guestEmail: body.guestEmail || "",
      guestPhone: body.guestPhone || "",
      notes: body.notes || "",
      folio: body.folio || [
        {
          id: `f_rm_${body.id || Date.now()}`,
          description: `${body.roomType || "Deluxe Room"} (${nights} Nights)`,
          category: "ROOM_CHARGE",
          amount: gst.taxableValue,
          date: body.checkIn || new Date(),
        },
        {
          id: `f_tx_${body.id || Date.now()}`,
          description: "GST Tax (5% included)",
          category: "TAX",
          amount: gst.totalTax,
          date: body.checkIn || new Date(),
        },
        ...(paidAmount > 0
          ? [
              {
                id: `f_py_${body.id || Date.now()}`,
                description: "Advance Payment Received",
                category: "PAYMENT" as const,
                amount: -paidAmount,
                date: new Date(),
              },
            ]
          : []),
      ],
    };

    // Save to persistent server store
    const saved = saveStoredReservation(newRes);

    // Save to Supabase Cloud Storage
    try {
      const { upsertSupabaseReservation } = await import("@/lib/supabase");
      await upsertSupabaseReservation(newRes);
    } catch (err) {
      console.warn("[api/reservations] Supabase insert warning:", err);
    }

    // Try saving to Prisma if DB is available
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder") || process.env.DATABASE_URL?.includes("[YOUR-DB-PASSWORD]");
    if (!isPlaceholder) {
      try {
        await prisma.reservation.create({
          data: {
            confirmationNumber: confNo,
            guestName: newRes.guestName,
            status: newRes.status,
            checkIn: new Date(newRes.checkIn),
            checkOut: new Date(newRes.checkOut),
            nights: newRes.nights,
            roomNumber: newRes.roomNumber,
            roomType: newRes.roomType,
            adults: newRes.adults,
            children: newRes.children,
            bookingSource: newRes.bookingSource as any,
            roomRate: newRes.roomRate,
            totalAmount: newRes.totalAmount,
            taxAmount: newRes.taxAmount,
            paidAmount: newRes.paidAmount,
            balanceAmount: newRes.balanceAmount,
          } as any,
        });
      } catch (err) {
        console.warn("[api/reservations] Prisma insert warning:", err);
      }
    }

    return NextResponse.json({ success: true, data: saved, source: "SERVER_PERSISTENT_STORE" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, confirmationNumber, status, roomNumber, paidAmount, balanceAmount, folio } = body;
    const targetId = id || confirmationNumber;

    if (!targetId) {
      return NextResponse.json({ success: false, error: "Missing reservation id or confirmationNumber" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (roomNumber !== undefined) updates.roomNumber = roomNumber;
    if (paidAmount !== undefined) updates.paidAmount = paidAmount;
    if (balanceAmount !== undefined) updates.balanceAmount = balanceAmount;
    if (folio !== undefined) updates.folio = folio;

    const updated = updateReservationStatusInStore(targetId, updates);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Reservation ${targetId} updated to status ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

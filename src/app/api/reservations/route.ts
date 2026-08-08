import { NextResponse } from "next/server";
import { demoReservations } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder");
    if (!isPlaceholder) {
      try {
        const dbReservations = await prisma.reservation.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        if (dbReservations.length > 0) {
          return NextResponse.json({ success: true, data: dbReservations, source: "POSTGRESQL_DB" });
        }
      } catch (err) {
        console.warn("DB query fallback to memory:", err);
      }
    }
    return NextResponse.json({ success: true, data: demoReservations, source: "REACTIVE_MEMORY" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder");

    const confNo = `SS-SHM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes = {
      id: `res_${Date.now()}`,
      confirmationNumber: confNo,
      guestName: body.guestName || "Guest",
      guestId: body.guestId || `guest_${Date.now()}`,
      status: "CONFIRMED",
      checkIn: body.checkIn || new Date().toISOString(),
      checkOut: body.checkOut || new Date().toISOString(),
      nights: body.nights || 2,
      roomNumber: body.roomNumber || "301",
      roomType: body.roomType || "Deluxe Room",
      adults: body.adults || 2,
      children: body.children || 0,
      bookingSource: body.bookingSource || "DIRECT",
      roomRate: body.roomRate || 5500,
      totalAmount: body.totalAmount || 12320,
      taxAmount: body.taxAmount || 1320,
      paidAmount: body.paidAmount || 5000,
      balanceAmount: body.balanceAmount || 7320,
      createdAt: new Date().toISOString(),
    };

    if (!isPlaceholder) {
      try {
        // Real DB insertion if connected
        const dbRecord = await prisma.reservation.create({
          data: {
            confirmationNumber: confNo,
            guestName: newRes.guestName,
            status: "CONFIRMED" as any,
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
        return NextResponse.json({ success: true, data: dbRecord, source: "POSTGRESQL_DB" });
      } catch (err) {
        console.warn("DB insert fallback to memory:", err);
      }
    }

    return NextResponse.json({ success: true, data: newRes, source: "REACTIVE_MEMORY" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

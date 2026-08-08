import { NextResponse } from "next/server";
import { demoStaff } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder");
    if (!isPlaceholder) {
      try {
        const dbStaff = await prisma.staff.findMany({
          take: 50,
        });
        if (dbStaff.length > 0) {
          return NextResponse.json({ success: true, data: dbStaff, source: "POSTGRESQL_DB" });
        }
      } catch (err) {
        console.warn("DB query staff fallback:", err);
      }
    }
    return NextResponse.json({ success: true, data: demoStaff, source: "REACTIVE_MEMORY" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder");

    const newStaff = {
      id: body.staffId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      firstName: body.name ? body.name.split(" ")[0] : "Staff",
      lastName: body.name ? body.name.split(" ").slice(1).join(" ") : "Member",
      email: body.email || "staff@hotelshemron.com",
      phone: body.phone || "+91 98000 00000",
      role: body.role || "Front Desk Receptionist",
      department: body.role?.includes("Desk") ? "Front Office" : "Operations",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (!isPlaceholder) {
      try {
        const dbRecord = await prisma.staff.create({
          data: {
            employeeId: newStaff.id,
            firstName: newStaff.firstName,
            lastName: newStaff.lastName,
            email: newStaff.email,
            phone: newStaff.phone,
            roleTitle: newStaff.role,
            department: newStaff.department,
            isActive: true,
          } as any,
        });
        return NextResponse.json({ success: true, data: dbRecord, source: "POSTGRESQL_DB" });
      } catch (err) {
        console.warn("DB insert staff fallback:", err);
      }
    }

    return NextResponse.json({ success: true, data: newStaff, source: "REACTIVE_MEMORY" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

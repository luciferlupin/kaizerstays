import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const isPlaceholder = process.env.DATABASE_URL?.includes("placeholder");

    if (isPlaceholder) {
      return NextResponse.json({
        status: "ONLINE",
        mode: "DEMO_PERSISTENT_MEMORY",
        databaseConnected: false,
        message: "StaySphere is running in high-performance reactive memory mode with LocalStorage persistence. Supply a real PostgreSQL DATABASE_URL in .env to connect a live cloud database (Supabase/Neon).",
        timestamp: new Date().toISOString(),
      });
    }

    // Attempt real database query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ONLINE",
      mode: "CLOUD_DATABASE_CONNECTED",
      databaseConnected: true,
      provider: "PostgreSQL",
      message: "Database connection verified. Real-time PostgreSQL storage active.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "DEGRADED",
        mode: "FALLBACK_MEMORY",
        databaseConnected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

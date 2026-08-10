import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const isPlaceholder = !dbUrl || dbUrl.includes("placeholder") || dbUrl.includes("[YOUR-DB-PASSWORD]") || dbUrl.includes("YOUR-");

    if (isPlaceholder) {
      return NextResponse.json({
        status: "ONLINE",
        mode: "LOCAL_BROWSER_WORKSPACE",
        databaseConnected: false,
        message: "KaizerStays OS is online. Hotel data is currently persisted in this browser; no cloud database connection is verified.",
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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "DEGRADED",
        mode: "FALLBACK_MEMORY",
        databaseConnected: false,
        error: error instanceof Error ? error.message : "Database health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

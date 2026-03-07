import { NextResponse } from "next/server"
import { getSectorPerformances } from "@/lib/analysis/sector-rotation"

export async function GET() {
  try {
    const performances = await getSectorPerformances()
    return NextResponse.json({ success: true, data: performances })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to calculate sector performances" },
      { status: 500 }
    )
  }
}

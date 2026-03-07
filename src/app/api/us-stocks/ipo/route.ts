import { NextResponse } from "next/server"
import { getUSIPOCalendar } from "@/lib/api/finnhub"

export async function GET() {
  try {
    const events = await getUSIPOCalendar()
    const today = new Date().toISOString().slice(0, 10)

    const upcoming = events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))

    const recent = events
      .filter((e) => e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({
      success: true,
      data: { upcoming, recent },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

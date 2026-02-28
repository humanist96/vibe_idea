import { NextRequest, NextResponse } from "next/server"
import { getCorporateEvents } from "@/lib/api/dart-events"
import type { EventCategory } from "@/lib/api/dart-events-types"

const VALID_CATEGORIES: readonly string[] = [
  "유상증자",
  "무상증자",
  "자사주",
  "사채",
  "합병분할",
  "기타",
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get("days")
  const categoryParam = searchParams.get("category")

  const days = daysParam ? parseInt(daysParam, 10) : 30
  if (days < 1 || days > 365) {
    return NextResponse.json(
      { success: false, error: "days must be 1-365" },
      { status: 400 }
    )
  }

  const category =
    categoryParam && VALID_CATEGORIES.includes(categoryParam)
      ? (categoryParam as EventCategory)
      : undefined

  try {
    const events = await getCorporateEvents(days, category)
    return NextResponse.json({ success: true, data: events })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch corporate events" },
      { status: 500 }
    )
  }
}

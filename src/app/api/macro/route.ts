import { NextResponse } from "next/server"
import { getKoreanMacroOverview } from "@/lib/api/ecos"

export async function GET() {
  try {
    const indicators = await getKoreanMacroOverview()
    return NextResponse.json({ success: true, data: indicators })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch Korean macro data" },
      { status: 500 }
    )
  }
}

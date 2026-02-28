import { NextResponse } from "next/server"
import { getGlobalMacroOverview } from "@/lib/api/fred"

export async function GET() {
  try {
    const indicators = await getGlobalMacroOverview()
    return NextResponse.json({ success: true, data: indicators })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch global macro data" },
      { status: 500 }
    )
  }
}

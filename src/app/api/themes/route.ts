import { NextResponse } from "next/server"
import { getThemeList } from "@/lib/api/naver-theme"

export async function GET() {
  try {
    const data = await getThemeList()
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch theme list" },
      { status: 500 }
    )
  }
}

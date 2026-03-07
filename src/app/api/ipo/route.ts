import { NextResponse } from "next/server"
import { getIpoList } from "@/lib/api/ipo-38comm"

export async function GET() {
  try {
    const items = await getIpoList()
    return NextResponse.json({ success: true, data: items })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch IPO data" },
      { status: 500 }
    )
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { getCompanyOverview } from "@/lib/api/dart"
import { ensureLoaded, findStock } from "@/lib/data/stock-registry"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params

    await ensureLoaded()
    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    await corpCodeRegistry.ensureLoaded()
    const corpCode = corpCodeRegistry.resolve(ticker)
    if (!corpCode) {
      return NextResponse.json(
        { success: false, error: "기업 정보를 불러올 수 없습니다." },
        { status: 404 }
      )
    }

    const data = await getCompanyOverview(corpCode)

    if (!data) {
      return NextResponse.json(
        { success: false, error: "기업 정보를 불러올 수 없습니다." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Company API error:", error)
    return NextResponse.json(
      { success: false, error: "기업 정보를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}

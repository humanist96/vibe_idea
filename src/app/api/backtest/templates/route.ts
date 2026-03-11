import { NextResponse } from "next/server"
import { STRATEGY_TEMPLATES } from "@/lib/backtest/templates"

export async function GET() {
  return NextResponse.json({
    success: true,
    templates: STRATEGY_TEMPLATES,
  })
}

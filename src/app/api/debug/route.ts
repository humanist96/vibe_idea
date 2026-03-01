import { NextResponse } from "next/server"

export async function GET() {
  const dartKey = process.env.DART_API_KEY
  const results: Record<string, unknown> = {
    hasDartKey: !!dartKey,
    region: process.env.VERCEL_REGION ?? "local",
  }

  // Test 1: DART elestock API (small JSON)
  try {
    const start = Date.now()
    const res = await fetch(
      `https://opendart.fss.or.kr/api/elestock.json?crtfc_key=${dartKey}&corp_code=00126380`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    results.elestock = {
      httpStatus: res.status,
      dartStatus: data.status,
      dartMessage: data.message,
      items: data.list?.length ?? 0,
      ms: Date.now() - start,
    }
  } catch (error) {
    results.elestock = { error: error instanceof Error ? error.message : String(error) }
  }

  // Test 2: DART corpCode.xml ZIP (large file ~2MB)
  try {
    const start = Date.now()
    const res = await fetch(
      `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${dartKey}`,
      { signal: AbortSignal.timeout(15000) }
    )
    const contentLength = res.headers.get("content-length")
    results.corpCodeZip = {
      httpStatus: res.status,
      contentType: res.headers.get("content-type"),
      contentLength,
      ms: Date.now() - start,
    }
  } catch (error) {
    results.corpCodeZip = { error: error instanceof Error ? error.message : String(error) }
  }

  // Test 3: DART dividend API
  try {
    const start = Date.now()
    const res = await fetch(
      `https://opendart.fss.or.kr/api/alotMatter.json?crtfc_key=${dartKey}&corp_code=00126380&bgn_de=20240101&end_de=20241231`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    results.dividend = {
      httpStatus: res.status,
      dartStatus: data.status,
      dartMessage: data.message,
      ms: Date.now() - start,
    }
  } catch (error) {
    results.dividend = { error: error instanceof Error ? error.message : String(error) }
  }

  return NextResponse.json(results)
}

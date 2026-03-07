import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  ticker: z.string(),
  name: z.string(),
  earningsData: z.object({
    actualEps: z.number().nullable().optional(),
    estimatedEps: z.number().nullable().optional(),
    actualRevenue: z.number().nullable().optional(),
    estimatedRevenue: z.number().nullable().optional(),
    surprisePercent: z.number().nullable().optional(),
    reportDate: z.string().optional(),
  }).optional(),
  recentPrice: z.number().optional(),
  changePercent: z.number().optional(),
  sector: z.string().optional(),
  mode: z.enum(["preview", "review"]),
})

const PREVIEW_PROMPT = `당신은 실적 발표 프리뷰 전문가입니다. 실적 발표 전 핵심 관전포인트를 분석하세요.

반환 형식 (JSON만):
{
  "keyPoints": ["관전포인트 1", "관전포인트 2", "관전포인트 3"],
  "consensus": "컨센서스 요약 1문장",
  "surpriseProbability": "높음" | "보통" | "낮음",
  "riskFactors": ["리스크 1", "리스크 2"],
  "expectedReaction": "예상 시장 반응 1문장",
  "summary": "전체 프리뷰 요약 2~3문장"
}
반드시 유효한 JSON만 응답.`

const REVIEW_PROMPT = `당신은 실적 발표 리뷰 전문가입니다. 실적 발표 결과를 분석하세요.

반환 형식 (JSON만):
{
  "verdict": "Beat" | "Meet" | "Miss",
  "surpriseAnalysis": "서프라이즈 분석 1문장",
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "priceImpact": "긍정적" | "부정적" | "중립",
  "outlook": "향후 전망 1~2문장",
  "summary": "전체 리뷰 요약 2~3문장"
}
반드시 유효한 JSON만 응답.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      )
    }

    const { ticker, name, earningsData, recentPrice, changePercent, sector, mode } = parsed.data

    const contextParts = [`종목: ${name}(${ticker})`]
    if (sector) contextParts.push(`섹터: ${sector}`)
    if (recentPrice) contextParts.push(`현재가: ${recentPrice.toLocaleString()}원`)
    if (changePercent) contextParts.push(`등락률: ${changePercent.toFixed(1)}%`)

    if (earningsData) {
      if (earningsData.estimatedEps != null) contextParts.push(`EPS 컨센서스: ${earningsData.estimatedEps}`)
      if (earningsData.actualEps != null) contextParts.push(`실제 EPS: ${earningsData.actualEps}`)
      if (earningsData.estimatedRevenue != null) contextParts.push(`매출 컨센서스: ${earningsData.estimatedRevenue.toLocaleString()}`)
      if (earningsData.actualRevenue != null) contextParts.push(`실제 매출: ${earningsData.actualRevenue.toLocaleString()}`)
      if (earningsData.surprisePercent != null) contextParts.push(`서프라이즈: ${earningsData.surprisePercent.toFixed(1)}%`)
      if (earningsData.reportDate) contextParts.push(`발표일: ${earningsData.reportDate}`)
    }

    const systemPrompt = mode === "preview" ? PREVIEW_PROMPT : REVIEW_PROMPT

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `실적 ${mode === "preview" ? "프리뷰" : "리뷰"}를 작성해주세요.\n\n${contextParts.join("\n")}` },
      ],
      temperature: 0.3,
      max_tokens: 600,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI 응답을 받지 못했습니다." },
        { status: 500 }
      )
    }

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: { mode, ...result } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: `실적 분석 실패: ${message}` },
      { status: 500 }
    )
  }
}

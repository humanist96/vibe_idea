import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  topic: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  portfolio: z.array(
    z.object({
      name: z.string(),
      ticker: z.string(),
      sector: z.string(),
    })
  ).optional(),
  mode: z.enum(["daily_lesson", "concept_explain", "quiz"]),
})

const DAILY_LESSON_PROMPT = `당신은 친근한 AI 투자 코치입니다. 사용자의 수준에 맞는 오늘의 미니 레슨을 작성하세요.

반환 형식 (JSON만):
{
  "lessonTitle": "레슨 제목",
  "emoji": "관련 이모지",
  "difficulty": "초급" | "중급" | "고급",
  "concept": "핵심 개념 설명 2~3문장",
  "realExample": "실제 종목/시장 사례로 설명 2문장",
  "tip": "실전 활용 팁 1문장",
  "quiz": {
    "question": "퀴즈 질문",
    "options": ["선택지1", "선택지2", "선택지3"],
    "answer": 0~2 (정답 인덱스),
    "explanation": "정답 설명 1문장"
  }
}

사용자의 보유 종목이 있으면 그 종목을 예시로 활용하세요.
반드시 유효한 JSON만 응답.`

const CONCEPT_PROMPT = `당신은 친근한 AI 투자 코치입니다. 요청된 투자 개념을 쉽게 설명하세요.

반환 형식 (JSON만):
{
  "concept": "개념명",
  "emoji": "관련 이모지",
  "simpleExplanation": "초등학생도 이해할 수 있는 비유 1~2문장",
  "technicalExplanation": "정확한 기술적 설명 2~3문장",
  "practicalUse": "실전에서 어떻게 활용하는지 1~2문장",
  "commonMistakes": ["흔한 실수 1", "흔한 실수 2"],
  "relatedConcepts": ["관련 개념 1", "관련 개념 2"]
}

사용자의 보유 종목이 있으면 그 종목의 실제 데이터로 설명하세요.
반드시 유효한 JSON만 응답.`

const QUIZ_PROMPT = `당신은 AI 투자 코치입니다. 투자 지식 퀴즈 3문제를 출제하세요.

반환 형식 (JSON만):
{
  "quizTitle": "퀴즈 제목",
  "questions": [
    {
      "question": "질문",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0~3,
      "explanation": "정답 설명 1문장",
      "difficulty": "초급" | "중급" | "고급"
    }
  ]
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

    const { topic, level, portfolio, mode } = parsed.data
    const parts: string[] = []

    if (level) parts.push(`사용자 수준: ${level === "beginner" ? "초급" : level === "intermediate" ? "중급" : "고급"}`)
    if (topic) parts.push(`주제: ${topic}`)
    if (portfolio && portfolio.length > 0) {
      parts.push(`보유 종목: ${portfolio.map((p) => `${p.name}(${p.sector})`).join(", ")}`)
    }

    const promptMap = {
      daily_lesson: DAILY_LESSON_PROMPT,
      concept_explain: CONCEPT_PROMPT,
      quiz: QUIZ_PROMPT,
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptMap[mode] },
        { role: "user", content: parts.join("\n") || "오늘의 투자 레슨을 알려주세요." },
      ],
      temperature: 0.5,
      max_tokens: 700,
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
      { success: false, error: `코치 응답 실패: ${message}` },
      { status: 500 }
    )
  }
}

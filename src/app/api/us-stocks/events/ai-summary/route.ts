import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../../auth"
import { generateAIAnalysis } from "@/lib/api/openai"

const bodySchema = z.object({
  context: z.string().min(10).max(2000),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const summary = await generateAIAnalysis(parsed.data.context)

    return NextResponse.json({
      success: true,
      data: { summary },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

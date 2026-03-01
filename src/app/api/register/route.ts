import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"

export const runtime = "nodejs"

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "잘못된 입력입니다"
      return NextResponse.json({ success: false, error: message }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "이미 가입된 이메일입니다" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[register] error:", error)
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

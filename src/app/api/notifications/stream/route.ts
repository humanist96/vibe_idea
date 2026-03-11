import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    let lastChecked = new Date()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
        )
      },
      async pull(controller) {
        try {
          const newNotifications = await prisma.alertNotification.findMany({
            where: {
              userId,
              createdAt: { gt: lastChecked },
              read: false,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          })

          if (newNotifications.length > 0) {
            lastChecked = new Date()
            for (const n of newNotifications) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "notification",
                    id: n.id,
                    ticker: n.ticker,
                    message: n.message,
                    notificationType: n.type,
                    createdAt: n.createdAt.toISOString(),
                  })}\n\n`
                )
              )
            }
          } else {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`
              )
            )
          }

          await new Promise((resolve) => setTimeout(resolve, 30000))
        } catch {
          controller.close()
        }
      },
      cancel() {
        // Client disconnected
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    console.error("SSE stream error:", error)
    return NextResponse.json(
      { success: false, error: "SSE stream failed" },
      { status: 500 }
    )
  }
}

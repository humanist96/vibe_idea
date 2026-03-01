import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const [watchlistItems, presets, defaults, recentlyViewed, notifications] =
    await Promise.all([
      prisma.watchlistItem.findMany({
        where: { userId },
        orderBy: { addedAt: "asc" },
        select: { ticker: true },
      }),
      prisma.screenerPreset.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.screenerDefaults.findFirst({
        where: { userId },
      }),
      prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: 20,
      }),
      prisma.userNotification.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 50,
      }),
    ])

  return NextResponse.json({
    success: true,
    data: {
      watchlist: watchlistItems.map((w) => w.ticker),
      presets: presets.map((p) => ({
        id: p.id,
        name: p.name,
        filters: p.filters as Record<string, string>,
        createdAt: p.createdAt.getTime(),
      })),
      defaults: defaults
        ? {
            lastFilters: defaults.lastFilters as Record<string, string>,
            lastSort: defaults.lastSort,
            lastOrder: defaults.lastOrder,
          }
        : null,
      recentlyViewed: recentlyViewed.map((r) => ({
        ticker: r.ticker,
        name: r.name,
        viewedAt: r.viewedAt.getTime(),
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        ticker: n.ticker,
        stockName: n.stockName,
        message: n.message,
        date: n.date,
        read: n.read,
      })),
    },
  })
}

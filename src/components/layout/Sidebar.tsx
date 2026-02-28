"use client"

import { cn } from "@/lib/utils/cn"
import { SidebarNav } from "./SidebarNav"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

interface SidebarProps {
  readonly className?: string
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-slate-800 bg-slate-900 lg:flex",
        className
      )}
    >
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <Link href="/" className="text-lg font-bold text-white">
          KoreaStockAI
        </Link>
      </div>

      <SidebarNav />

      <div className="mt-auto border-t border-slate-800 p-4">
        <p className="text-xs text-slate-500">
          AI 분석은 투자 참고용이며
          <br />
          투자 책임은 본인에게 있습니다.
        </p>
      </div>
    </aside>
  )
}

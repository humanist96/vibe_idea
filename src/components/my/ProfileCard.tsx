"use client"

import { useSession } from "next-auth/react"
import { useMarketMode } from "@/store/market-mode"
import { User } from "lucide-react"

export function ProfileCard() {
  const { data: session } = useSession()
  const { mode, setMode } = useMarketMode()

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <User className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">프로필</h3>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs text-[var(--color-text-muted)]">이름</span>
          <p className="text-sm text-[var(--color-text-primary)]">
            {session?.user?.name || "사용자"}
          </p>
        </div>
        <div>
          <span className="text-xs text-[var(--color-text-muted)]">이메일</span>
          <p className="text-sm text-[var(--color-text-primary)]">
            {session?.user?.email || "-"}
          </p>
        </div>
        <div>
          <span className="text-xs text-[var(--color-text-muted)]">마켓 모드</span>
          <div className="mt-1 flex rounded-xl bg-[var(--color-surface-100)] p-1">
            <button
              type="button"
              onClick={() => setMode("kr")}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "kr"
                  ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              🇰🇷 국내
            </button>
            <button
              type="button"
              onClick={() => setMode("us")}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "us"
                  ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              🇺🇸 해외
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

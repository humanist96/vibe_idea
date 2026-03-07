"use client"

import { cn } from "@/lib/utils/cn"
import { Calendar, Building2, TrendingUp } from "lucide-react"

interface IpoItem {
  readonly company: string
  readonly leadUnderwriter: string
  readonly offeringPriceRange: string
  readonly offeringPrice: string
  readonly demandForecastDate: string
  readonly subscriptionDate: string
  readonly listingDate: string
  readonly competitionRate: string
  readonly status: "upcoming" | "active" | "listed"
  readonly dDay: number | null
}

interface IpoCardProps {
  readonly item: IpoItem
}

function getStatusBadge(status: IpoItem["status"], dDay: number | null) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gain-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-gain)]">
          <span className="live-dot" />
          청약중
        </span>
      )
    case "upcoming":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
          {dDay !== null && dDay > 0 ? `D-${dDay}` : "청약예정"}
        </span>
      )
    case "listed":
      return (
        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-100)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-tertiary)]">
          상장완료
        </span>
      )
  }
}

export function IpoCard({ item }: IpoCardProps) {
  return (
    <div
      className={cn(
        "glass-card glass-card-hover rounded-xl p-4 transition-all duration-200",
        item.status === "active" && "ring-1 ring-[var(--color-gain)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {item.company}
        </h3>
        {getStatusBadge(item.status, item.dDay)}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[var(--color-text-muted)]">청약일</p>
            <p className="font-medium text-[var(--color-text-secondary)]">
              {item.subscriptionDate || "--"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[var(--color-text-muted)]">상장일</p>
            <p className="font-medium text-[var(--color-text-secondary)]">
              {item.listingDate || "--"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[var(--color-text-muted)]">주관사</p>
            <p className="font-medium text-[var(--color-text-secondary)]">
              {item.leadUnderwriter || "--"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[var(--color-text-muted)]">경쟁률</p>
            <p className="font-medium text-[var(--color-text-secondary)]">
              {item.competitionRate || "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-2 text-xs">
        <span className="text-[var(--color-text-muted)]">공모가</span>
        <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
          {item.offeringPrice || item.offeringPriceRange || "--"}
        </span>
      </div>
    </div>
  )
}

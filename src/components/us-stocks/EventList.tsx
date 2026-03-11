"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Bell } from "lucide-react"

type USEventType = "EARNINGS" | "IPO" | "OTHER"

interface USEventItem {
  readonly id: string
  readonly ticker: string
  readonly company: string
  readonly type: USEventType
  readonly title: string
  readonly eventDate: string
  readonly metadata: Readonly<Record<string, unknown>>
  readonly source: "finnhub"
}

interface EventListProps {
  readonly events: readonly USEventItem[]
  readonly onSelectEvent: (event: USEventItem) => void
}

const EVENT_TYPE_BADGE: Readonly<
  Record<USEventType, { readonly variant: "blue" | "green" | "gray"; readonly label: string }>
> = {
  EARNINGS: { variant: "blue", label: "실적 발표" },
  IPO: { variant: "green", label: "IPO" },
  OTHER: { variant: "gray", label: "기타" },
}

function formatHour(hour: unknown): string {
  if (hour === "bmo") return "장전"
  if (hour === "amc") return "장후"
  return "-"
}

export function EventList({ events, onSelectEvent }: EventListProps) {
  if (events.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
          해당 기간에 이벤트가 없습니다.
        </div>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-up stagger-3">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            이벤트 목록
            <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
              ({events.length}건)
            </span>
          </span>
        </CardTitle>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                날짜
              </th>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                종목
              </th>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                제목
              </th>
              <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                분류
              </th>
              <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                시간
              </th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 100).map((evt) => {
              const badge = EVENT_TYPE_BADGE[evt.type] ?? EVENT_TYPE_BADGE.OTHER
              return (
                <tr
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="table-row-hover cursor-pointer border-b border-[var(--color-border-subtle)] last:border-0"
                >
                  <td className="py-2.5 font-mono text-xs text-[var(--color-text-secondary)]">
                    {evt.eventDate}
                  </td>
                  <td className="py-2.5">
                    <span className="font-mono text-xs font-medium text-[var(--color-accent-500)]">
                      {evt.ticker}
                    </span>
                    {evt.company !== evt.ticker && (
                      <span className="ml-1.5 text-xs text-[var(--color-text-secondary)]">
                        {evt.company}
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs truncate py-2.5 text-xs text-[var(--color-text-primary)]">
                    {evt.title}
                  </td>
                  <td className="py-2.5 text-center">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="py-2.5 text-center text-xs text-[var(--color-text-muted)]">
                    {evt.type === "EARNINGS"
                      ? formatHour(evt.metadata.hour)
                      : "-"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

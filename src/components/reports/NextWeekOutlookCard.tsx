"use client"

import { Calendar, AlertTriangle, Lightbulb } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import type { NextWeekOutlook } from "@/lib/report/weekly-types"

interface NextWeekOutlookCardProps {
  readonly outlook: NextWeekOutlook
}

export function NextWeekOutlookCard({ outlook }: NextWeekOutlookCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            다음 주 전망
          </span>
        </CardTitle>
      </CardHeader>

      <div className="space-y-4 px-4 pb-4">
        {/* Events */}
        {outlook.events.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-3 w-3 text-blue-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                주요 일정
              </p>
            </div>
            <ul className="space-y-1">
              {outlook.events.map((event, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {event}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {outlook.risks.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                주의 사항
              </p>
            </div>
            <ul className="space-y-1">
              {outlook.risks.map((risk, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategy */}
        {outlook.strategy && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                AI 전략 제안
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/30 p-3">
              <p className="text-xs leading-relaxed text-emerald-800">
                {outlook.strategy}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AnalyzedReportData, ReportMeta } from "@/lib/report/types"

const MAX_REPORTS = 30
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

interface ReportHistoryState {
  readonly reports: readonly ReportMeta[]
  readonly reportData: Record<string, AnalyzedReportData>
  addReport: (meta: ReportMeta, data: AnalyzedReportData) => void
  getReport: (id: string) => AnalyzedReportData | undefined
  deleteReport: (id: string) => void
  cleanupOld: () => void
}

export const useReportHistoryStore = create<ReportHistoryState>()(
  persist(
    (set, get) => ({
      reports: [],
      reportData: {},

      addReport: (meta, data) => {
        set((state) => {
          const existing = state.reports.filter((r) => r.id !== meta.id)
          const reports = [meta, ...existing].slice(0, MAX_REPORTS)
          const reportData = { ...state.reportData, [meta.id]: data }
          return { reports, reportData }
        })
      },

      getReport: (id) => {
        return get().reportData[id]
      },

      deleteReport: (id) => {
        set((state) => {
          const reports = state.reports.filter((r) => r.id !== id)
          const { [id]: _, ...reportData } = state.reportData
          return { reports, reportData }
        })
      },

      cleanupOld: () => {
        const cutoff = Date.now() - THIRTY_DAYS_MS
        set((state) => {
          const reports = state.reports.filter(
            (r) => new Date(r.generatedAt).getTime() > cutoff
          )
          const validIds = new Set(reports.map((r) => r.id))
          const reportData: Record<string, AnalyzedReportData> = {}
          for (const [id, data] of Object.entries(state.reportData)) {
            if (validIds.has(id)) {
              reportData[id] = data
            }
          }
          return { reports, reportData }
        })
      },
    }),
    {
      name: "korea-stock-ai-reports",
      version: 1,
    }
  )
)

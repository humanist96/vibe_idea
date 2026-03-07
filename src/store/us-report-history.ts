import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { USAnalyzedReportData, USReportMeta } from "@/lib/report/us-types"

const MAX_REPORTS = 30
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// Re-export for backward compat
export type { USReportMeta, USAnalyzedReportData as USReportData } from "@/lib/report/us-types"

interface USReportHistoryState {
  readonly reports: readonly USReportMeta[]
  readonly reportData: Record<string, USAnalyzedReportData>
  addReport: (meta: USReportMeta, data: USAnalyzedReportData) => void
  getReport: (id: string) => USAnalyzedReportData | undefined
  deleteReport: (id: string) => void
  cleanupOld: () => void
}

export const useUSReportHistoryStore = create<USReportHistoryState>()(
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
          const reportData: Record<string, USAnalyzedReportData> = {}
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
      name: "us-stock-ai-reports",
      version: 2,
    }
  )
)

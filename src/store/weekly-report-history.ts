"use client"

import { create } from "zustand"
import type { WeeklyAnalyzedData, WeeklyReportMeta } from "@/lib/report/weekly-types"

interface WeeklyReportHistoryState {
  readonly reports: readonly WeeklyReportMeta[]
  readonly reportData: Record<string, WeeklyAnalyzedData>
  readonly loading: boolean
  setReports: (reports: readonly WeeklyReportMeta[]) => void
  addReport: (meta: WeeklyReportMeta, data: WeeklyAnalyzedData) => void
  setReportData: (id: string, data: WeeklyAnalyzedData) => void
  getReport: (id: string) => WeeklyAnalyzedData | undefined
  deleteReport: (id: string) => void
  setLoading: (loading: boolean) => void
  fetchReports: () => Promise<void>
  fetchReportDetail: (reportId: string) => Promise<WeeklyAnalyzedData | null>
  deleteReportFromServer: (reportId: string) => Promise<void>
}

export const useWeeklyReportHistoryStore = create<WeeklyReportHistoryState>()(
  (set, get) => ({
    reports: [],
    reportData: {},
    loading: false,

    setReports: (reports) => set({ reports }),
    setLoading: (loading) => set({ loading }),

    addReport: (meta, data) => {
      set((state) => {
        const existing = state.reports.filter((r) => r.id !== meta.id)
        const reports = [meta, ...existing]
        const reportData = { ...state.reportData, [meta.id]: data }
        return { reports, reportData }
      })
    },

    setReportData: (id, data) => {
      set((state) => ({
        reportData: { ...state.reportData, [id]: data },
      }))
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

    fetchReports: async () => {
      set({ loading: true })
      try {
        const res = await fetch("/api/reports/weekly")
        const json = await res.json()
        if (json.success && json.data) {
          set({ reports: json.data })
        }
      } catch {
        // 네트워크 오류 시 빈 목록 유지
      } finally {
        set({ loading: false })
      }
    },

    fetchReportDetail: async (reportId: string) => {
      const existing = get().reportData[reportId]
      if (existing) return existing

      try {
        const res = await fetch(`/api/reports/${reportId}`)
        const json = await res.json()
        if (json.success && json.data) {
          const data = json.data as WeeklyAnalyzedData
          set((state) => ({
            reportData: { ...state.reportData, [reportId]: data },
          }))
          return data
        }
      } catch {
        // 조회 실패
      }
      return null
    },

    deleteReportFromServer: async (reportId: string) => {
      try {
        const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" })
        const json = await res.json()
        if (json.success) {
          get().deleteReport(reportId)
        }
      } catch {
        // 삭제 실패
      }
    },
  })
)

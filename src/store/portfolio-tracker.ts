import { create } from "zustand"
import type {
  PortfolioItemLive,
  PortfolioSummary,
  TransactionRecord,
  DividendRecordItem,
} from "@/lib/portfolio/types"

interface PortfolioTrackerState {
  readonly items: readonly PortfolioItemLive[]
  readonly summary: PortfolioSummary | null
  readonly transactions: readonly TransactionRecord[]
  readonly dividendRecords: readonly DividendRecordItem[]
  readonly isLoading: boolean
  readonly activeTab: "overview" | "transactions" | "dividends"
  setItems: (items: readonly PortfolioItemLive[]) => void
  setSummary: (summary: PortfolioSummary) => void
  setTransactions: (txs: readonly TransactionRecord[]) => void
  addTransaction: (tx: TransactionRecord) => void
  removeTransaction: (id: string) => void
  setDividendRecords: (records: readonly DividendRecordItem[]) => void
  addDividendRecord: (record: DividendRecordItem) => void
  setLoading: (loading: boolean) => void
  setActiveTab: (tab: "overview" | "transactions" | "dividends") => void
}

export const usePortfolioTrackerStore = create<PortfolioTrackerState>()(
  (set) => ({
    items: [],
    summary: null,
    transactions: [],
    dividendRecords: [],
    isLoading: false,
    activeTab: "overview",

    setItems: (items) => set({ items }),

    setSummary: (summary) => set({ summary }),

    setTransactions: (transactions) => set({ transactions }),

    addTransaction: (tx) =>
      set((state) => ({
        transactions: [tx, ...state.transactions],
      })),

    removeTransaction: (id) =>
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),

    setDividendRecords: (dividendRecords) => set({ dividendRecords }),

    addDividendRecord: (record) =>
      set((state) => ({
        dividendRecords: [record, ...state.dividendRecords],
      })),

    setLoading: (isLoading) => set({ isLoading }),

    setActiveTab: (activeTab) => set({ activeTab }),
  })
)

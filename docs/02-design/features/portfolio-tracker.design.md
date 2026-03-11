# Portfolio Tracker — Design Document

> **Status**: Ready for Implementation
> **Date**: 2026-03-11
> **Depends on**: portfolio-tracker.plan.md

---

## 1. Prisma Schema

```prisma
// Existing: PortfolioItem model (ticker, market, name, sectorKr, quantity, avgPrice) — keep as-is

model Transaction {
  id        String   @id @default(cuid())
  userId    String
  ticker    String
  market    String   // "KR" | "US"
  type      String   // "BUY" | "SELL"
  quantity  Float
  price     Float
  fee       Float    @default(0)
  date      DateTime
  note      String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, ticker])
  @@index([userId, date])
}

model DividendRecord {
  id         String   @id @default(cuid())
  userId     String
  ticker     String
  market     String
  amount     Float
  currency   String   @default("KRW")
  receivedAt DateTime
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

---

## 2. API Routes

| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| GET | `/api/user/portfolio` | — | `PortfolioItem[]` with live price |
| PUT | `/api/user/portfolio` | `{ items }` | `{ success }` (existing) |
| GET | `/api/user/portfolio/summary` | — | `PortfolioSummary` |
| GET | `/api/user/transactions` | `?ticker&limit=50` | `Transaction[]` |
| POST | `/api/user/transactions` | `{ ticker, market, type, quantity, price, fee?, date, note? }` | `Transaction` |
| PUT | `/api/user/transactions/[id]` | partial fields | `Transaction` |
| DELETE | `/api/user/transactions/[id]` | — | `{ success }` |
| GET | `/api/user/dividends` | — | `DividendRecord[]` |
| POST | `/api/user/dividends` | `{ ticker, market, amount, currency, receivedAt }` | `DividendRecord` |

**GET `/api/user/portfolio`** response shape:
```ts
interface PortfolioItemLive {
  readonly ticker: string
  readonly market: "KR" | "US"
  readonly name: string
  readonly sectorKr: string
  readonly quantity: number
  readonly avgPrice: number
  readonly currentPrice: number
  readonly unrealizedPnl: number
  readonly unrealizedPnlPct: number
}
```

**GET `/api/user/portfolio/summary`** response:
```ts
interface PortfolioSummary {
  readonly totalValue: number
  readonly totalCost: number
  readonly totalPnl: number
  readonly totalPnlPct: number
  readonly dailyPnl: number
  readonly dailyPnlPct: number
}
```

---

## 3. Zustand Store

**`src/lib/stores/portfolioStore.ts`**:

```ts
interface PortfolioState {
  items: readonly PortfolioItemLive[]
  summary: PortfolioSummary | null
  transactions: readonly Transaction[]
  isLoading: boolean
  setItems: (items: readonly PortfolioItemLive[]) => void
  setSummary: (summary: PortfolioSummary) => void
  addTransaction: (tx: Transaction) => void
  removeTransaction: (id: string) => void
}
```

Server state (items, summary) fetched via TanStack Query; Zustand holds optimistic UI state only.

---

## 4. Component Hierarchy

```
src/app/portfolio/page.tsx
  └── PortfolioDashboard.tsx
        ├── SummaryCards.tsx            # Total value, daily P&L, total return
        ├── AssetAllocationChart.tsx    # Donut: by sector + by market (recharts)
        ├── PerformanceChart.tsx        # Line: portfolio vs KOSPI/S&P500 (recharts)
        ├── HoldingsTable.tsx           # Per-stock: price, qty, P&L, P&L%
        └── DividendIncomeCard.tsx      # Expected annual dividend

src/app/portfolio/transactions/page.tsx
  └── TransactionHistory.tsx
        ├── TransactionForm.tsx         # Add/edit: ticker, type, qty, price, date
        └── TransactionTable.tsx        # Sortable, with edit/delete actions

src/app/portfolio/dividends/page.tsx
  └── DividendTracker.tsx
        ├── DividendForm.tsx
        └── DividendTable.tsx
```

---

## 5. Data Flow

```
[Page mount]
  → TanStack Query: GET /api/user/portfolio → HoldingsTable
  → TanStack Query: GET /api/user/portfolio/summary → SummaryCards
  → TanStack Query: GET /api/user/transactions → TransactionHistory

[Add Transaction]
  → TransactionForm submit → POST /api/user/transactions
  → invalidate ["transactions"] + ["portfolio"] queries

[AssetAllocationChart]
  → derived from HoldingsTable items (groupBy sectorKr / market)
  → computed client-side, no extra API call

[PerformanceChart]
  → GET /api/user/portfolio/performance (weekly snapshots)
  → overlay with benchmark index data
```

---

## 6. File Structure

```
src/
├── app/
│   ├── api/user/
│   │   ├── portfolio/route.ts           # extend: add GET handler
│   │   ├── portfolio/summary/route.ts   # new
│   │   ├── transactions/route.ts        # new
│   │   ├── transactions/[id]/route.ts   # new
│   │   ├── dividends/route.ts           # new
│   └── portfolio/
│       ├── page.tsx
│       ├── transactions/page.tsx
│       └── dividends/page.tsx
├── components/
│   └── portfolio/
│       ├── PortfolioDashboard.tsx
│       ├── SummaryCards.tsx
│       ├── AssetAllocationChart.tsx
│       ├── PerformanceChart.tsx
│       ├── HoldingsTable.tsx
│       ├── DividendIncomeCard.tsx
│       ├── TransactionHistory.tsx
│       ├── TransactionForm.tsx
│       ├── TransactionTable.tsx
│       └── DividendTracker.tsx
└── lib/
    └── stores/portfolioStore.ts
```

---

## 7. Implementation Order

1. Add `Transaction` + `DividendRecord` to Prisma schema, run migration
2. Add `GET` handler to existing `api/user/portfolio/route.ts` (fetch live prices)
3. Implement `GET /api/user/portfolio/summary`
4. Implement `GET/POST /api/user/transactions` + `PUT/DELETE /[id]`
5. Implement `GET/POST /api/user/dividends`
6. Create `portfolioStore.ts` Zustand store
7. Build `SummaryCards` + `HoldingsTable`
8. Build `AssetAllocationChart` (recharts PieChart)
9. Build `PerformanceChart` (recharts LineChart with benchmark)
10. Build `TransactionForm` + `TransactionTable`
11. Build `DividendIncomeCard` + `DividendTracker`
12. Wire `/portfolio/page.tsx` with `PortfolioDashboard`

# Backtest — Design Document

> **Status**: Ready for Implementation
> **Date**: 2026-03-11
> **Depends on**: backtest.plan.md

---

## 1. Prisma Schema

```prisma
model Strategy {
  id         String     @id @default(cuid())
  userId     String
  name       String
  definition Json       // StrategyDefinition JSON
  isTemplate Boolean    @default(false)
  createdAt  DateTime   @default(now())
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  backtests  Backtest[]
  @@index([userId])
}

model Backtest {
  id         String    @id @default(cuid())
  userId     String
  strategyId String?
  ticker     String
  market     String
  period     String    // "1y" | "3y" | "5y"
  result     Json      // BacktestResult JSON
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  strategy   Strategy? @relation(fields: [strategyId], references: [id])
  @@index([userId])
}
```

---

## 2. Core Types

```ts
// lib/backtest/types.ts
type Operator = ">" | "<" | ">=" | "<=" | "crossAbove" | "crossBelow"
type Indicator = "RSI" | "MA" | "EMA" | "MACD" | "BB_UPPER" | "BB_LOWER" | "PRICE"

interface Condition {
  readonly indicator: Indicator
  readonly params: Readonly<Record<string, number>>  // { period: 14 }
  readonly operator: Operator
  readonly value: number
}

interface StrategyDefinition {
  readonly buyConditions: readonly Condition[]    // AND logic
  readonly sellConditions: readonly Condition[]   // AND logic
  readonly stopLoss?: number                       // % e.g. -5
  readonly takeProfit?: number                     // % e.g. 20
}

interface TradeEntry {
  readonly date: string
  readonly type: "BUY" | "SELL"
  readonly price: number
  readonly shares: number
  readonly returnPct?: number
}

interface BacktestResult {
  readonly totalReturn: number
  readonly cagr: number
  readonly mdd: number
  readonly sharpe: number
  readonly winRate: number
  readonly totalTrades: number
  readonly trades: readonly TradeEntry[]
}
```

---

## 3. API Routes

| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| POST | `/api/backtest/run` | `{ strategy, ticker, market, period }` | `BacktestResult` |
| GET | `/api/backtest/templates` | — | `Strategy[]` |
| GET | `/api/backtest/history` | `?limit=20` | `Backtest[]` |
| POST | `/api/user/strategies` | `{ name, definition }` | `Strategy` |
| GET | `/api/user/strategies` | — | `Strategy[]` |

**Run endpoint schema** (`src/app/api/backtest/run/route.ts`):

```ts
const runSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  period: z.enum(["1y", "3y", "5y"]),
  strategy: z.object({
    buyConditions: z.array(conditionSchema).min(1),
    sellConditions: z.array(conditionSchema).min(1),
    stopLoss: z.number().negative().optional(),
    takeProfit: z.number().positive().optional(),
  }),
})
```

---

## 4. Backtest Engine

**`lib/backtest/engine.ts`** — pure function, no side effects:

```ts
export function runBacktest(
  ohlcv: readonly OHLCVBar[],
  strategy: StrategyDefinition,
  options: { commissionRate?: number }
): BacktestResult
```

- Computes indicators via `lib/analysis/technical.ts` (existing)
- Evaluates buy/sell conditions day-by-day
- Tracks open position, applies commission (default 0.015%)
- Returns immutable `BacktestResult`

**`lib/backtest/templates.ts`** — pre-built strategies:

```ts
export const TEMPLATES: readonly Strategy[] = [
  { name: "Golden Cross", definition: { buyConditions: [MA50 crossAbove MA200], ... } },
  { name: "RSI Oversold Bounce", definition: { buyConditions: [RSI < 30], ... } },
  { name: "Bollinger Band Breakout", ... },
  { name: "MACD Signal Cross", ... },
  { name: "Dual MA Trend", ... },
]
```

---

## 5. Component Hierarchy

```
src/app/backtest/page.tsx
  ├── StrategyBuilder.tsx          # Left panel: condition editor
  │     ├── ConditionRow.tsx       # Indicator + operator + value
  │     └── TemplateSelector.tsx   # Load pre-built template
  └── BacktestResultPanel.tsx      # Right panel: results
        ├── MetricsGrid.tsx        # Total return, CAGR, MDD, Sharpe, Win rate
        ├── SignalChart.tsx        # Price chart + buy/sell markers (recharts)
        └── TradeLogTable.tsx      # Sortable table of all trades
```

---

## 6. Data Flow

```
[User] fills StrategyBuilder → clicks "Run Backtest"
  → POST /api/backtest/run
      → fetch OHLCV from historical data API
      → runBacktest(ohlcv, strategy) → BacktestResult
      → optionally save to Backtest table
  → BacktestResultPanel renders MetricsGrid + SignalChart + TradeLogTable

[Load Template] GET /api/backtest/templates
  → TemplateSelector populates StrategyBuilder fields

[Save Strategy] POST /api/user/strategies
  → stored for reuse, linked to future Backtest runs
```

---

## 7. File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── backtest/run/route.ts
│   │   ├── backtest/templates/route.ts
│   │   ├── backtest/history/route.ts
│   │   └── user/strategies/route.ts
│   └── backtest/
│       ├── page.tsx
│       └── [strategyId]/page.tsx
├── components/
│   └── backtest/
│       ├── StrategyBuilder.tsx
│       ├── ConditionRow.tsx
│       ├── TemplateSelector.tsx
│       ├── BacktestResultPanel.tsx
│       ├── MetricsGrid.tsx
│       ├── SignalChart.tsx
│       └── TradeLogTable.tsx
└── lib/
    └── backtest/
        ├── engine.ts              # pure backtest function
        ├── templates.ts           # pre-built strategies
        └── types.ts               # StrategyDefinition, BacktestResult
```

---

## 8. Implementation Order

1. Define types in `lib/backtest/types.ts`
2. Implement `lib/backtest/engine.ts` with unit tests
3. Add `lib/backtest/templates.ts` (5 templates)
4. Add `Strategy` + `Backtest` to Prisma schema, migrate
5. Implement `POST /api/backtest/run` (auth + Zod + engine call)
6. Implement `GET /api/backtest/templates`
7. Implement `POST/GET /api/user/strategies`
8. Build `StrategyBuilder` + `ConditionRow` + `TemplateSelector`
9. Build `MetricsGrid` + `TradeLogTable`
10. Build `SignalChart` overlay (recharts custom dot renderer)
11. Wire `/backtest/page.tsx` layout with split panels

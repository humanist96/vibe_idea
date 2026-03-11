# Notification System — Design Document

> **Status**: Ready for Implementation
> **Date**: 2026-03-11
> **Depends on**: notification.plan.md

---

## 1. Prisma Schema

```prisma
model AlertRule {
  id        String   @id @default(cuid())
  userId    String
  ticker    String
  market    String   // "KR" | "US"
  type      String   // "PRICE_ABOVE" | "PRICE_BELOW" | "VOLUME_SPIKE" | "EARNINGS_DATE"
  threshold Float?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([ticker, market])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  ruleId    String?
  ticker    String?
  type      String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, read])
}
```

---

## 2. API Routes

| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| GET | `/api/user/alert-rules` | — | `AlertRule[]` |
| POST | `/api/user/alert-rules` | `{ ticker, market, type, threshold? }` | `AlertRule` |
| DELETE | `/api/user/alert-rules/[id]` | — | `{ success }` |
| PATCH | `/api/user/alert-rules/[id]` | `{ active }` | `AlertRule` |
| GET | `/api/user/notifications` | `?read=false` | `Notification[]` |
| PATCH | `/api/user/notifications` | `{ ids: string[] }` | `{ success }` |
| GET | `/api/notifications/stream` | SSE | `text/event-stream` |
| POST | `/api/cron/check-alerts` | — | `{ triggered: number }` |

**Route file pattern** (`src/app/api/user/alert-rules/route.ts`):

```ts
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

const createSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  type: z.enum(["PRICE_ABOVE", "PRICE_BELOW", "VOLUME_SPIKE", "EARNINGS_DATE"]),
  threshold: z.number().positive().optional(),
})
```

**SSE endpoint** (`src/app/api/notifications/stream/route.ts`):
- Returns `text/event-stream` with `Cache-Control: no-cache`
- Sends `data: { type, message, ticker }` on trigger
- Falls back to 30-second polling if SSE unsupported

---

## 3. Component Hierarchy

```
src/components/layout/Header.tsx
  └── NotificationBell.tsx           # Bell icon + unread badge
        └── NotificationCenter.tsx   # Dropdown panel (popover)
              ├── NotificationItem.tsx
              └── NotificationEmpty.tsx

src/components/notifications/
  ├── AlertRuleForm.tsx              # Create/edit alert rule form
  ├── AlertRuleList.tsx              # Manage existing rules
  └── AlertRuleCard.tsx              # Single rule display + toggle
```

### NotificationBell.tsx

```tsx
// Reads unread count via SWR polling every 30s
// Shows red badge when count > 0
// Click opens NotificationCenter popover
```

### NotificationCenter.tsx

```tsx
// Max height: 400px, scrollable
// "Mark all read" button at top
// Groups: Today / Earlier
// Links to /notifications for full history
```

### AlertRuleForm.tsx

```tsx
// Fields: ticker (autocomplete from watchlist), market, type, threshold
// Zod client-side validation mirrors server schema
// On submit: POST /api/user/alert-rules
```

---

## 4. Data Flow

```
[Cron: /api/cron/check-alerts]
  → fetch current prices for all active AlertRules
  → compare vs threshold
  → INSERT Notification rows on trigger
  → broadcast via SSE to connected clients

[Client]
  NotificationBell
    → SWR poll GET /api/user/notifications?read=false (30s interval)
    → if SSE supported: EventSource /api/notifications/stream (instant)
  NotificationCenter
    → on open: mark visible as read via PATCH /api/user/notifications
```

---

## 5. Watchlist Integration

- `AlertRuleForm` fetches `GET /api/user/watchlist` on mount
- Renders watchlist tickers as quick-select chips above ticker input
- Auto-fills market field when a watchlist item is selected

---

## 6. File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── user/
│   │   │   ├── alert-rules/route.ts
│   │   │   ├── alert-rules/[id]/route.ts
│   │   │   └── notifications/route.ts       # extend existing
│   │   ├── notifications/stream/route.ts
│   │   └── cron/check-alerts/route.ts
│   └── notifications/
│       ├── page.tsx                          # full history page
│       └── rules/page.tsx
├── components/
│   └── notifications/
│       ├── NotificationBell.tsx
│       ├── NotificationCenter.tsx
│       ├── NotificationItem.tsx
│       ├── AlertRuleForm.tsx
│       ├── AlertRuleList.tsx
│       └── AlertRuleCard.tsx
└── lib/
    └── notifications/
        └── alert-checker.ts                  # pure fn: checkAlertRules(rules, prices)
```

---

## 7. Implementation Order

1. Add `AlertRule` + `Notification` models to `prisma/schema.prisma`, run migration
2. Implement `GET/POST /api/user/alert-rules` with Zod + auth
3. Implement `DELETE/PATCH /api/user/alert-rules/[id]`
4. Extend existing `GET /api/user/notifications` (currently PUT-only)
5. Build `alert-checker.ts` pure function (unit-testable)
6. Implement `POST /api/cron/check-alerts` using checker
7. Implement SSE `/api/notifications/stream`
8. Build `NotificationBell` + `NotificationCenter` components
9. Build `AlertRuleForm` + `AlertRuleList` components
10. Add bell to `Header.tsx`, wire `/notifications/rules` page

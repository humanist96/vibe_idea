# us-flow Design Document

> **Summary**: 미국 기관 투자자 보유 현황(13F) 및 섹터별 자금 흐름을 시각화하는 /us-stocks/flow 페이지
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft
> **Planning Doc**: [us-flow.plan.md](../../01-plan/features/us-flow.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- KR `/flow` 페이지 패턴을 US로 확장 (컴포넌트 구조 및 CSS 변수 일관성 유지)
- Finnhub `/stock/institutional-ownership` 엔드포인트로 13F 기관 보유 데이터 제공
- 섹터별 기관 자금 흐름을 집계하여 스마트머니 방향성 시각화

### 1.2 Design Principles

- 관심종목(watchlist) 기반 데이터 로드 (KR `/flow`와 동일한 접근)
- 불변 패턴: `readonly` 인터페이스, spread 업데이트
- Zod 스키마로 Finnhub 응답 검증, API 라우트 쿼리 파라미터 검증

---

## 2. Architecture

### 2.1 Component Hierarchy

```
src/app/us-stocks/flow/
└── page.tsx                        (Server Component wrapper, metadata)
    └── USFlowClient                (Client Component, "use client")
        ├── InstitutionalHoldersTable   (보유 현황 테이블)
        └── SectorFlowChart             (섹터 자금 흐름 Bar Chart)
```

### 2.2 Data Flow

```
USFlowClient
  → useWatchlistStore (관심종목 tickers)
  → fetch /api/us-stocks/flow?tickers=AAPL,MSFT,...
      → GET /stock/institutional-ownership (Finnhub, 종목별)
      → 집계: 섹터별 변화량 합산
  → InstitutionalHoldersTable (종목별 상위 기관 목록)
  → SectorFlowChart (섹터별 유입/유출 BarChart)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| USFlowClient | useWatchlistStore | 관심종목 목록 |
| USFlowClient | /api/us-stocks/flow | 기관 보유 데이터 |
| SectorFlowChart | recharts BarChart | KR flow 차트와 동일 라이브러리 |
| API route | finnhub.ts fetchFinnhub | 기존 Finnhub 클라이언트 재사용 |

---

## 3. Data Model

### 3.1 Finnhub Types (신규 추가: finnhub.ts)

```typescript
export interface FinnhubInstitutionalHolder {
  readonly name: string
  readonly share: number          // 보유 주수
  readonly change: number         // 전분기 대비 변화
  readonly filingDate: string
}

export interface FinnhubInstitutionalOwnership {
  readonly symbol: string
  readonly ownership: readonly {
    readonly name: string
    readonly share: number
    readonly change: number
    readonly filingDate: string
  }[]
}
```

### 3.2 API Response Type

```typescript
// GET /api/us-stocks/flow response
interface USFlowResponse {
  readonly success: boolean
  readonly data: {
    readonly holdings: readonly TickerHolding[]
    readonly sectorFlow: readonly SectorFlow[]
  }
}

interface TickerHolding {
  readonly ticker: string
  readonly topHolders: readonly {
    readonly name: string
    readonly shares: number
    readonly change: number       // +/- 전분기 대비
    readonly changePercent: number
    readonly filingDate: string
  }[]
  readonly totalInstitutional: number
  readonly institutionalPercent: number
}

interface SectorFlow {
  readonly sector: string
  readonly netChange: number      // 섹터 내 기관 변화 합산
  readonly tickers: readonly string[]
}
```

### 3.3 Prisma (plan 문서 기준, 구현 시 선택)

`InstitutionalHolding` 모델은 캐싱 레이어로 선택적 사용. 초기 구현은 메모리 캐시(`cache.set`)만 사용하여 Finnhub 직접 호출.

---

## 4. API Specification

### 4.1 Endpoint

| Method | Path | Auth | Cache |
|--------|------|------|-------|
| GET | `/api/us-stocks/flow` | auth() 필수 | 4시간 (13F 분기 데이터) |

### 4.2 Request

```
GET /api/us-stocks/flow?tickers=AAPL,MSFT,NVDA
```

Zod 검증:
```typescript
const querySchema = z.object({
  tickers: z.string().transform(s => s.split(",").filter(Boolean)).pipe(
    z.array(z.string().min(1).max(10)).max(20)
  )
})
```

### 4.3 Response (200)

```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "ticker": "AAPL",
        "topHolders": [
          { "name": "Vanguard Group", "shares": 1320000000, "change": 5200000, "changePercent": 0.4, "filingDate": "2024-12-31" }
        ],
        "totalInstitutional": 5800000000,
        "institutionalPercent": 59.2
      }
    ],
    "sectorFlow": [
      { "sector": "Technology", "netChange": 45200000, "tickers": ["AAPL", "MSFT"] }
    ]
  }
}
```

**Error Responses**: 401 (미인증), 400 (잘못된 tickers), 429 (rate limit)

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌─────────────────────────────────────┐
│ 미국 투자자 동향 (h1)               │
│ 관심종목 기관 보유 현황             │
├──────────────────┬──────────────────┤
│ SectorFlowChart  │ 섹터 요약 (선택) │
├─────────────────────────────────────┤
│ InstitutionalHoldersTable           │
│ (ticker별 상위 기관, 변화량)        │
└─────────────────────────────────────┘
```

### 5.2 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `page.tsx` | `src/app/us-stocks/flow/` | Server wrapper, metadata |
| `USFlowClient` | `src/components/us-stocks/USFlowClient.tsx` | 데이터 fetch, 상태 관리 |
| `InstitutionalHoldersTable` | `src/components/us-stocks/InstitutionalHoldersTable.tsx` | 기관 보유 테이블 |
| `SectorFlowChart` | `src/components/us-stocks/SectorFlowChart.tsx` | 섹터 BarChart (recharts) |

### 5.3 Styling

- CSS 변수: `var(--color-text-primary)`, `var(--color-gain)`, `var(--color-loss)`, `var(--color-accent-500)`
- 변화량 양수: `var(--color-gain)` / 음수: `var(--color-loss)` (KR flow 동일 패턴)
- 로딩: `LoadingSkeleton` 컴포넌트 재사용
- 빈 상태: `EmptyWatchlist` 컴포넌트 재사용

---

## 6. Navigation 변경

### 6.1 nav-data.ts 수정

```typescript
// usCollapsibleSections "투자 데이터" 섹션에 추가
{ href: "/us-stocks/flow", label: "투자자 동향", icon: ArrowLeftRight }

// KR_TO_US 매핑 업데이트
"/flow": "/us-stocks/flow"  // 기존 "/us-stocks" → "/us-stocks/flow"
```

---

## 7. Error Handling

| Code | Cause | Handling |
|------|-------|----------|
| 401 | 미인증 | auth() redirect |
| 400 | 빈 tickers | "관심종목을 추가하세요" 빈 상태 |
| 429 | Finnhub rate limit | 캐시된 데이터 반환 또는 재시도 안내 |
| 500 | Finnhub 오류 | 개별 ticker 실패 무시, 나머지 반환 |

---

## 8. Test Plan

| Type | Target | Tool |
|------|--------|------|
| Unit | `SectorFlowChart` 집계 로직 | Vitest |
| Unit | Zod 쿼리 스키마 검증 | Vitest |
| Integration | GET /api/us-stocks/flow | next-test-api-route-handler |
| E2E | /us-stocks/flow 페이지 렌더 | Playwright |

---

## 9. Implementation Order

1. [ ] `src/lib/api/finnhub.ts`에 `getUSInstitutionalOwnership(symbol)` 함수 추가
2. [ ] `src/app/api/us-stocks/flow/route.ts` 작성 (Zod 검증, auth(), 병렬 fetch)
3. [ ] `src/components/us-stocks/InstitutionalHoldersTable.tsx` 작성
4. [ ] `src/components/us-stocks/SectorFlowChart.tsx` 작성 (recharts BarChart)
5. [ ] `src/components/us-stocks/USFlowClient.tsx` 작성 (조립)
6. [ ] `src/app/us-stocks/flow/page.tsx` 작성 (Server wrapper)
7. [ ] `src/lib/constants/nav-data.ts` 수정 (nav 항목 추가, KR_TO_US 매핑 업데이트)
8. [ ] Vitest 단위 테스트 작성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

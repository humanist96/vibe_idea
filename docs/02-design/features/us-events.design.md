# us-events Design Document

> **Summary**: 미국 기업 이벤트(실적/배당/분할/FDA/M&A)를 캘린더+목록으로 제공하고 AI 요약을 연동하는 /us-stocks/events 페이지
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft
> **Planning Doc**: [us-events.plan.md](../../01-plan/features/us-events.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- KR `/events` 페이지 패턴(필터 바 + 목록 테이블)을 US로 확장
- Finnhub `/calendar/earnings`, `/company-news`, `/calendar/ipo` 엔드포인트 통합
- 기존 `generateAIAnalysis` 함수로 주요 이벤트 AI 요약 on-demand 제공

### 1.2 Design Principles

- 이벤트 타입별 Badge 색상 체계 (KR events의 `CATEGORY_COLORS` 패턴 참조)
- 불변 패턴: `readonly` 인터페이스, spread 업데이트
- Zod 스키마로 쿼리 파라미터(날짜 범위, 이벤트 타입) 검증

---

## 2. Architecture

### 2.1 Component Hierarchy

```
src/app/us-stocks/events/
└── page.tsx                          (Server Component wrapper, metadata)
    └── USEventsClient                (Client Component, "use client")
        ├── EventTypeFilter           (타입/기간 필터 바)
        ├── EventCalendar             (월간 캘린더 뷰, 선택적)
        ├── EventList                 (날짜순 목록 테이블)
        └── EventDetailModal          (AI 요약 포함 상세 모달)
```

### 2.2 Data Flow

```
USEventsClient
  → state: period(7|30|90), eventType, selectedEvent
  → fetch /api/us-stocks/events?from=...&to=...&type=...
      → Finnhub /calendar/earnings (실적 발표)
      → Finnhub /calendar/ipo (IPO 이벤트)
      → 통합 정렬 (날짜순)
  → EventList 렌더링
  → 이벤트 클릭 → EventDetailModal
      → fetch /api/us-stocks/events/[eventId]/ai-summary (on-demand)
          → generateAIAnalysis(context) 호출
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| USEventsClient | /api/us-stocks/events | 이벤트 목록 |
| EventDetailModal | /api/us-stocks/events/[id]/ai-summary | AI 요약 생성 |
| AI summary route | generateAIAnalysis (기존) | AI 분석 재사용 |
| API route | getUSEarningsCalendar (finnhub.ts 기존) | 실적 캘린더 |
| API route | getUSIPOCalendar (finnhub.ts 기존) | IPO 캘린더 |

---

## 3. Data Model

### 3.1 Unified Event Type

```typescript
// src/types/us-events.ts
export type USEventType = "EARNINGS" | "DIVIDEND" | "SPLIT" | "FDA" | "IPO" | "OTHER"

export interface USEventItem {
  readonly id: string              // "{type}:{symbol}:{date}"
  readonly ticker: string
  readonly company: string
  readonly type: USEventType
  readonly title: string
  readonly eventDate: string       // "YYYY-MM-DD"
  readonly metadata: USEventMetadata
  readonly source: "finnhub"
}

export type USEventMetadata =
  | { readonly type: "EARNINGS"; readonly epsEstimate: number | null; readonly revenueEstimate: number | null; readonly hour: string }
  | { readonly type: "IPO"; readonly price: string; readonly exchange: string }
  | { readonly type: "OTHER" }
```

### 3.2 Prisma (선택적 캐시 레이어)

Plan 문서의 `UsEvent` 모델. 초기 구현은 메모리 캐시만 사용. AI 요약 저장이 필요한 시점에 Prisma 모델 추가.

---

## 4. API Specification

### 4.1 Endpoints

| Method | Path | Auth | Cache |
|--------|------|------|-------|
| GET | `/api/us-stocks/events` | auth() 필수 | 1시간 |
| POST | `/api/us-stocks/events/[eventId]/ai-summary` | auth() 필수 | 없음 (on-demand) |

### 4.2 GET /api/us-stocks/events

Zod 검증:
```typescript
const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(["ALL", "EARNINGS", "IPO", "DIVIDEND"]).default("ALL"),
  days: z.coerce.number().int().min(1).max(90).default(30)
})
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "EARNINGS:AAPL:2026-01-30",
      "ticker": "AAPL",
      "company": "Apple Inc.",
      "type": "EARNINGS",
      "title": "Q1 FY2026 실적 발표",
      "eventDate": "2026-01-30",
      "metadata": { "type": "EARNINGS", "epsEstimate": 2.35, "revenueEstimate": 124500000000, "hour": "amc" },
      "source": "finnhub"
    }
  ]
}
```

### 4.3 POST /api/us-stocks/events/[eventId]/ai-summary

Request: `{ "context": "AAPL Q1 FY2026 실적 발표, EPS 추정 2.35..." }`
Response: `{ "success": true, "data": { "summary": "..." } }`

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌─────────────────────────────────────┐
│ 미국 기업 이벤트 (h1)               │
│ 기간: [7일][30일][90일]             │
├─────────────────────────────────────┤
│ 타입 필터: [전체][실적][IPO][배당]  │
├─────────────────────────────────────┤
│ EventList (날짜 / 종목 / 제목 / 분류│
│   행 클릭 → EventDetailModal)       │
└─────────────────────────────────────┘
```

### 5.2 Event Type Badge Colors

| Type | Badge Variant | 한국어 |
|------|--------------|--------|
| EARNINGS | blue | 실적 발표 |
| IPO | green | IPO |
| DIVIDEND | yellow | 배당 |
| SPLIT | gray | 주식 분할 |
| FDA | red | FDA |
| OTHER | gray | 기타 |

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `page.tsx` | `src/app/us-stocks/events/` | Server wrapper |
| `USEventsClient` | `src/components/us-stocks/USEventsClient.tsx` | 상태, fetch |
| `EventTypeFilter` | `src/components/us-stocks/EventTypeFilter.tsx` | 기간/타입 필터 |
| `EventList` | `src/components/us-stocks/EventList.tsx` | 이벤트 테이블 |
| `EventDetailModal` | `src/components/us-stocks/EventDetailModal.tsx` | 상세 + AI 요약 |

---

## 6. Navigation 변경

### 6.1 nav-data.ts 수정

```typescript
// usCollapsibleSections "분석 도구" 섹션에 추가
{ href: "/us-stocks/events", label: "기업 이벤트", icon: Bell }

// KR_TO_US 매핑 업데이트
"/events": "/us-stocks/events"  // 기존 "/us-stocks" → "/us-stocks/events"
```

---

## 7. Error Handling

| Code | Cause | Handling |
|------|-------|----------|
| 401 | 미인증 | auth() redirect |
| 400 | 잘못된 날짜 형식 | Zod 에러 메시지 반환 |
| 429 | AI rate limit | "잠시 후 다시 시도" 안내 |
| 500 | Finnhub 오류 | 부분 데이터 반환 (earnings만 등) |

---

## 8. Test Plan

| Type | Target | Tool |
|------|--------|------|
| Unit | Zod 쿼리 스키마 검증 | Vitest |
| Unit | eventId 파싱 함수 | Vitest |
| Integration | GET /api/us-stocks/events | next-test-api-route-handler |
| E2E | /us-stocks/events 필터 + 모달 | Playwright |

---

## 9. Implementation Order

1. [ ] `src/types/us-events.ts` 작성 (USEventItem, USEventType 타입 정의)
2. [ ] `src/app/api/us-stocks/events/route.ts` 작성 (Zod 검증, auth(), Finnhub 통합)
3. [ ] `src/app/api/us-stocks/events/[eventId]/ai-summary/route.ts` 작성
4. [ ] `src/components/us-stocks/EventTypeFilter.tsx` 작성 (KR events 필터 참조)
5. [ ] `src/components/us-stocks/EventList.tsx` 작성 (KR events 테이블 참조)
6. [ ] `src/components/us-stocks/EventDetailModal.tsx` 작성 (AI 요약 포함)
7. [ ] `src/components/us-stocks/USEventsClient.tsx` 작성 (조립)
8. [ ] `src/app/us-stocks/events/page.tsx` 작성 (Server wrapper)
9. [ ] `src/lib/constants/nav-data.ts` 수정 (nav 항목 추가, KR_TO_US 매핑 업데이트)
10. [ ] Vitest 단위 테스트 작성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

# Design: 주간 보고서 강화

> Plan: `docs/01-plan/features/weekly-report-enhancement.plan.md`

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ ReportsList  │  │ WeeklyReport │  │ Weekly         │ │
│  │ (탭 추가)    │→ │ (메인 뷰)     │  │ SubComponents  │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Store Layer                                            │
│  ┌───────────────────────────────────┐                  │
│  │ weekly-report-history.ts (Zustand)│                  │
│  └───────────────────────────────────┘                  │
├─────────────────────────────────────────────────────────┤
│  API Layer                                              │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │ /api/reports/weekly   │  │ /api/reports/weekly     │  │
│  │ /generate (POST)     │  │ /[date] (GET)           │  │
│  └──────────────────────┘  └────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Lib Layer                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │
│  │ weekly-    │ │ weekly-    │ │ weekly-            │  │
│  │ collector  │→│ analyzer   │→│ prompts            │  │
│  └────────────┘ └────────────┘ └────────────────────┘  │
│  ┌────────────┐                                         │
│  │ weekly-    │                                         │
│  │ types      │                                         │
│  └────────────┘                                         │
└─────────────────────────────────────────────────────────┘
```

## 2. 타입 정의

### 2.1 `src/lib/report/weekly-types.ts`

```typescript
import type { MarketContextData, StockReportData, ConvictionScore, ActionItem, RiskAlert, AnalystDigest } from "./types"

// ── Phase 1: 주간 수집 데이터 ──────────────────────────

export interface WeeklyRawData {
  readonly weekStart: string           // "2026-03-09" (월요일)
  readonly weekEnd: string             // "2026-03-13" (금요일)
  readonly generatedAt: string
  readonly market: WeeklyMarketData
  readonly stocks: readonly WeeklyStockData[]
}

export interface WeeklyMarketData {
  readonly indices: readonly WeeklyIndexChange[]
  readonly sectorPerformance: readonly SectorWeeklyPerf[]
  readonly macroEvents: readonly string[]          // 주간 매크로 이벤트
  readonly fearGreedStart: number | null
  readonly fearGreedEnd: number | null
}

export interface WeeklyIndexChange {
  readonly name: string                // "KOSPI" | "KOSDAQ" | "USD/KRW"
  readonly weekOpen: number
  readonly weekClose: number
  readonly weekChange: number
  readonly weekChangePercent: number
  readonly weekHigh: number
  readonly weekLow: number
}

export interface SectorWeeklyPerf {
  readonly sector: string
  readonly changePercent: number
  readonly topStock: string
}

export interface WeeklyStockData {
  readonly ticker: string
  readonly name: string
  readonly weekOpen: number
  readonly weekClose: number
  readonly weekChange: number
  readonly weekChangePercent: number
  readonly weekHigh: number
  readonly weekLow: number
  readonly weekVolume: number                       // 주간 합산 거래량
  readonly weekForeignNet: number                   // 주간 합산 외국인 순매수
  readonly weekInstitutionNet: number               // 주간 합산 기관 순매수
  readonly consensusStart: ConsensusSnapshot | null
  readonly consensusEnd: ConsensusSnapshot | null
  readonly currentConviction: ConvictionScore | null // 최신 데일리에서 가져옴
  readonly technical: import("@/lib/analysis/technical").TechnicalIndicators | null
  readonly sentiment: import("@/lib/api/news-types").NewsSentiment | null
  readonly news: readonly import("@/lib/api/news-types").NewsArticle[]
}

export interface ConsensusSnapshot {
  readonly targetPrice: number | null
  readonly investmentOpinion: string | null
  readonly analystCount: number
}

// ── Phase 2: 주간 분석 결과 ────────────────────────────

export interface WeeklyAnalyzedData extends WeeklyRawData {
  readonly executiveSummary: string
  readonly stockAnalyses: readonly WeeklyStockAnalysis[]
  readonly portfolioInsight: string
  readonly nextWeekOutlook: NextWeekOutlook
  readonly weeklyHighlights: readonly string[]        // 주간 핵심 이벤트 3-5개
}

export interface WeeklyStockAnalysis {
  readonly ticker: string
  readonly weekSummary: string                        // 주간 동향 요약 (2-3문장)
  readonly conviction: ConvictionScore | null
  readonly actionItem: ActionItem | null
  readonly riskAlerts: readonly RiskAlert[]
  readonly analystDigest: AnalystDigest | null
  readonly consensusChange: ConsensusChange | null
}

export interface ConsensusChange {
  readonly targetPriceBefore: number | null
  readonly targetPriceAfter: number | null
  readonly targetPriceChange: number | null           // 변화율 (%)
  readonly opinionChange: string | null               // "상향" | "유지" | "하향"
}

export interface NextWeekOutlook {
  readonly events: readonly string[]                  // 다음 주 주요 일정
  readonly risks: readonly string[]                   // 주의 사항
  readonly strategy: string                           // AI 전략 제안
}

// ── 메타데이터 ─────────────────────────────────────────

export interface WeeklyReportMeta {
  readonly id: string                                 // "weekly-2026-03-09"
  readonly weekStart: string
  readonly weekEnd: string
  readonly generatedAt: string
  readonly stockCount: number
  readonly summary: string
  readonly tickers: readonly string[]
}
```

## 3. 데이터 수집기

### 3.1 `src/lib/report/weekly-collector.ts`

**책임**: 관심종목 + 시장 데이터의 주간(5영업일) 합산 데이터 수집

**로직**:
1. `getHistorical(ticker, "1mo")` 에서 최근 5영업일 추출
2. 5일 가격 데이터로 weekOpen/weekClose/weekHigh/weekLow 계산
3. `getInvestorFlow(ticker)` 에서 5일 합산 외국인/기관 순매수
4. `getConsensus(ticker)` 현재 컨센서스 (week-end snapshot)
5. `getMarketIndices()` + 히스토리로 주간 지수 변동
6. `getSectorPerformance()` 섹터별 주간 성과 (기존 API 재활용)
7. 뉴스: 5일간 주요 뉴스 (중복 제거, 최대 15건)
8. 기술적 지표: 최신 값 (금요일 기준)

**병렬 수집 패턴**: 기존 `collectStockData()` + `collectMarketContext()` 패턴 따름

```typescript
export async function collectWeeklyData(
  tickers: readonly string[],
  onProgress?: (p: ReportProgress) => void
): Promise<WeeklyRawData>
```

## 4. AI 분석기

### 4.1 `src/lib/report/weekly-analyzer.ts`

**순서**:
1. **종목별 주간 분석** (순차) — 주간 동향 요약 + 컨빅션 + 액션 아이템
2. **Executive Summary** (병렬) — 주간 시장 브리핑
3. **Portfolio Insight** (병렬) — 포트폴리오 주간 성과 평가
4. **Next Week Outlook** (병렬) — 다음 주 전망
5. **Weekly Highlights** (병렬) — 핵심 이벤트 추출

**리스크 알림**: 기존 `buildRiskAlerts()` 재활용 (최신 데이터 기준)

**컨센서스 변화**: `ConsensusChange` 계산 (주초 vs 주말 목표가 비교)

### 4.2 `src/lib/report/weekly-prompts.ts`

| 프롬프트 | 입력 데이터 | 출력 |
|----------|------------|------|
| `buildWeeklyStockPrompt()` | 주간 가격/수급/뉴스/컨센서스 | JSON: weekSummary, conviction, actionItem |
| `buildWeeklySummaryPrompt()` | 전체 종목 + 시장 | 텍스트: 2-3문장 요약 |
| `buildWeeklyOutlookPrompt()` | 시장 + 일정 | JSON: events, risks, strategy |
| `buildWeeklyHighlightsPrompt()` | 전체 데이터 | JSON: string[] (3-5개) |

## 5. API 엔드포인트

### 5.1 `POST /api/reports/weekly/generate`

```typescript
// Request
{ tickers: string[] }

// Response
{
  success: true,
  data: {
    meta: WeeklyReportMeta,
    report: WeeklyAnalyzedData
  }
}
```

- 캐시: `weekly:${sortedTickers}` 키, 2시간 TTL
- 최대 10종목

### 5.2 기존 `GET /api/reports/weekly` 유지

- 대시보드 카드용 간단 주간 브리핑 (변경 없음)

## 6. UI 컴포넌트

### 6.1 페이지 구조

```
/reports                  ← 기존 페이지에 "주간" 탭 추가
/reports/weekly/[date]    ← 주간 보고서 상세 (신규)
```

### 6.2 `src/app/reports/page.tsx` 수정

- 상단에 탭: `일간 | 주간`
- 주간 탭: 주간 보고서 목록 + "새 주간 보고서" 버튼
- 주간 보고서 생성 시 `/api/reports/weekly/generate` 호출

### 6.3 `src/components/reports/WeeklyReport.tsx` (메인)

```
┌────────────────────────────────────────────┐
│ 주간 투자 분석 보고서                        │
│ 2026.03.09 (월) ~ 2026.03.13 (금)          │
├────────────────────────────────────────────┤
│ [Quick Jump Chips] — 종목별 주간 등락률      │
├────────────────────────────────────────────┤
│ [Executive Summary] — 주간 브리핑            │
├────────────────────────────────────────────┤
│ [Weekly Highlights] — 핵심 이벤트 3-5개      │
├────────────────────────────────────────────┤
│ [Market Context]                            │
│  - 주간 지수 변동 바 차트                     │
│  - 섹터 히트맵 (주간 성과)                    │
│  - 공포탐욕 변동 (시작→끝)                    │
├────────────────────────────────────────────┤
│ [Watchlist Performance Table]               │
│  종목 | 주간등락 | 거래량 | 외국인 | 확신도 | 액션│
├────────────────────────────────────────────┤
│ [Stock Deep Dives] — 종목별 상세              │
│  - 주간 가격 차트 (5일 캔들)                  │
│  - 주간 수급 합산                             │
│  - 컨센서스 변화 (목표가 before→after)         │
│  - 컨빅션 스코어 + 액션 아이템                 │
│  - 리스크 알림 배지                           │
│  - 주요 뉴스 (주간 Top 5)                     │
├────────────────────────────────────────────┤
│ [Portfolio Insight] — 주간 포트폴리오 분석     │
├────────────────────────────────────────────┤
│ [Next Week Outlook]                         │
│  - 다음 주 주요 일정                          │
│  - 주의 사항                                 │
│  - AI 전략 제안                              │
├────────────────────────────────────────────┤
│ [Disclaimer]                                │
└────────────────────────────────────────────┘
```

### 6.4 서브 컴포넌트 (신규)

| 컴포넌트 | 파일 | 기능 |
|----------|------|------|
| `WeeklyHighlights` | `src/components/reports/WeeklyHighlights.tsx` | 핵심 이벤트 카드 리스트 |
| `WeeklyMarketContext` | `src/components/reports/WeeklyMarketContext.tsx` | 주간 지수/섹터/공포탐욕 |
| `WeeklyStockDeepDive` | `src/components/reports/WeeklyStockDeepDive.tsx` | 종목별 주간 상세 |
| `ConsensusChangeCard` | `src/components/reports/ConsensusChangeCard.tsx` | 컨센서스 변화 시각화 |
| `NextWeekOutlookCard` | `src/components/reports/NextWeekOutlookCard.tsx` | 다음 주 전망 |

### 6.5 재활용 컴포넌트 (기존)

| 컴포넌트 | 용도 |
|----------|------|
| `ConvictionScoreCard` | 종목별 확신도 |
| `ActionItemCard` | 액션 아이템 |
| `RiskAlertBadges` | 리스크 배지 |
| `AnalystDigestSection` | 애널리스트 다이제스트 |
| `PerformanceBar` | 등락률 비교 차트 |

## 7. 스토어

### 7.1 `src/store/weekly-report-history.ts`

```typescript
interface WeeklyReportHistoryState {
  readonly reports: readonly WeeklyReportMeta[]
  readonly reportData: Record<string, WeeklyAnalyzedData>
  readonly addReport: (meta: WeeklyReportMeta, data: WeeklyAnalyzedData) => void
  readonly getReport: (id: string) => WeeklyAnalyzedData | undefined
  readonly deleteReport: (id: string) => void
  readonly cleanupOld: () => void
}
```

- localStorage: `korea-stock-ai-weekly-reports`
- 최대 12주 보관
- 8주 초과 자동 정리

## 8. 구현 순서

| 순서 | 파일 | 의존성 |
|------|------|--------|
| 1 | `src/lib/report/weekly-types.ts` | types.ts |
| 2 | `src/lib/report/weekly-collector.ts` | weekly-types, 기존 API |
| 3 | `src/lib/report/weekly-prompts.ts` | weekly-types |
| 4 | `src/lib/report/weekly-analyzer.ts` | weekly-collector, weekly-prompts |
| 5 | `src/store/weekly-report-history.ts` | weekly-types |
| 6 | `src/app/api/reports/weekly/generate/route.ts` | weekly-collector, weekly-analyzer |
| 7 | `src/components/reports/Weekly*.tsx` (5개) | weekly-types, 기존 컴포넌트 |
| 8 | `src/components/reports/WeeklyReport.tsx` | 서브 컴포넌트 |
| 9 | `src/app/reports/weekly/[date]/page.tsx` | WeeklyReport |
| 10 | `src/app/reports/page.tsx` 수정 | 탭 UI, weekly store |

## 9. 에러 처리

- 주간 데이터 부족 (5영업일 미만): 가용 데이터로 축소 생성, UI에 "불완전 주간" 표시
- AI 분석 실패: 데이터 기반 fallback (가격 변동 + 수급 요약)
- 컨센서스 데이터 없음: consensusChange = null, 해당 섹션 숨김

## 10. 테스트 계획

| 대상 | 테스트 항목 |
|------|------------|
| `weekly-collector` | 5일 합산 계산, 빈 데이터 처리, 병렬 수집 |
| `weekly-analyzer` | 컨센서스 변화 계산, fallback 분석, 리스크 알림 |
| `weekly-report-history` | 저장/조회/삭제, 12주 제한, 자동 정리 |

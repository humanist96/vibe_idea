# InvestHub 데일리 분석 보고서 기획서

## 1. 개요

### 1.1 목적
관심종목(Watchlist)에 등록된 종목들에 대해 **"어제 왜 올랐는지/떨어졌는지"**를 데이터 기반으로 분석하여, 매일 아침 자동 생성되는 맞춤형 투자 리포트를 제공한다.

### 1.2 핵심 가치
- **개인화**: 사용자의 관심종목에 특화된 맞춤 보고서
- **데이터 기반**: AI 추론이 아닌 실제 API 데이터(가격·수급·뉴스·기술적 지표)에 근거한 분석
- **시각화 중심**: 표·차트·게이지를 최대한 활용하여 한눈에 파악 가능
- **액션 가능**: 단순 정보 나열이 아닌, 투자 의사결정에 도움되는 인사이트 제공

### 1.3 참고 프로젝트
[research_ax](https://github.com/humanist96/research_ax)의 파이프라인 아키텍처를 참고한다.
- 수집(Collection) → 분석(Analysis) → 보고서 생성(Report) 3단계 파이프라인
- Claude CLI 기반 AI 분석
- 마크다운 보고서 + 메타데이터 구조
- 배치 처리 패턴

---

## 2. 보고서 구조 (Report Structure)

### 2.1 보고서 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  📊 데일리 투자 분석 보고서                    2026-03-03   │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📋 Executive Summary (AI 생성 한줄 요약)             │   │
│  │ "어제 관심종목 5개 중 3개 상승, 외국인 순매수 집중"   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. 시장 컨텍스트                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │ KOSPI   │ │ KOSDAQ  │ │ USD/KRW │  인덱스 카드    │   │
│  │  │ 2,845   │ │ 921     │ │ 1,384   │               │   │
│  │  │ +1.2%   │ │ -0.3%   │ │ +0.1%   │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘               │   │
│  │  [공포-탐욕 게이지: 42 공포]                         │   │
│  │  [주요 매크로 변동 테이블]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. 관심종목 성과 총괄표                               │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 종목 │ 종가 │ 등락 │ 수급 │ AI점수│ 시그널 │  │   │
│  │  │──────┼──────┼──────┼──────┼───────┼────────│  │   │
│  │  │삼성  │85,200│+2.4% │외+▲  │ 7.2  │ 매수   │  │   │
│  │  │SK    │178K  │-1.1% │기-▼  │ 5.8  │ 보유   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  [등락률 바 차트 (수평)]                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. 종목별 심층 분석 (종목 수만큼 반복)                │   │
│  │                                                      │   │
│  │  ── 삼성전자 (005930) ─────────────────────────────  │   │
│  │                                                      │   │
│  │  3.1 가격 & 거래량                                   │   │
│  │  [캔들차트 5일 + 거래량 바 차트]                      │   │
│  │  [52주 고저 대비 현재 위치 프로그레스 바]              │   │
│  │                                                      │   │
│  │  3.2 등락 원인 분석 (AI)                              │   │
│  │  "어제 삼성전자가 +2.4% 상승한 주요 원인:"           │   │
│  │  ① 외국인 3거래일 연속 순매수 (1,200억원)            │   │
│  │  ② HBM4 수주 확대 뉴스                               │   │
│  │  ③ 반도체 업종 전반 강세 (+1.8%)                      │   │
│  │                                                      │   │
│  │  3.3 수급 분석                                        │   │
│  │  [외국인/기관/개인 5일 순매수 바 차트]                │   │
│  │  [외국인 보유비율 추이 라인차트]                      │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ 투자자 │ 어제 │ 5일 │ 20일      │                │   │
│  │  │ 외국인 │+320억│+1,200억│+3,800억 │                │   │
│  │  │ 기관   │-150억│-400억 │+500억    │                │   │
│  │  │ 개인   │-170억│-800억 │-4,300억  │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  3.4 기술적 분석                                      │   │
│  │  [RSI 게이지: 62]                                    │   │
│  │  [MACD 히스토그램 차트]                               │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ 지표    │ 값    │ 시그널          │                │   │
│  │  │ RSI(14) │ 62.3  │ 중립            │                │   │
│  │  │ MACD    │ +120  │ 골든크로스 임박  │                │   │
│  │  │ 현재가  │85,200 │ SMA20 위 ✓      │                │   │
│  │  │ BB위치  │ 68%   │ 상단 근접        │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  3.5 뉴스 & 이벤트                                    │   │
│  │  [감성 점수 도넛차트: 긍정 70% / 부정 20% / 중립 10%]│   │
│  │  • [뉴스제목1](link) - 출처 (날짜)                   │   │
│  │  • [뉴스제목2](link) - 출처 (날짜)                   │   │
│  │  • [공시: 분기 실적 발표] (날짜)                      │   │
│  │                                                      │   │
│  │  3.6 컨센서스 & 밸류에이션                             │   │
│  │  [목표가 vs 현재가 비교 바]                           │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ 목표가 │ 110,000원 (+29.1%)      │                │   │
│  │  │ 의견   │ 매수 (애널리스트 32명)   │                │   │
│  │  │ PER    │ 12.3x (업종 평균 15.2x) │                │   │
│  │  │ PBR    │ 1.4x                    │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  3.7 내부자 & 대량보유 변동                           │   │
│  │  (변동 있는 경우에만 표시)                            │   │
│  │  • 2026-03-02: 부사장 김OO 5,000주 매수              │   │
│  │                                                      │   │
│  │  ── 다음 종목 반복 ──                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. 포트폴리오 인사이트                                │   │
│  │  [관심종목 상관관계 히트맵]                            │   │
│  │  [섹터 분포 도넛차트]                                 │   │
│  │  [AI 종합 평가 레이더 차트]                           │   │
│  │  "포트폴리오 리스크 요인: 반도체 편중(60%)..."       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 5. 오늘의 주목 포인트                                 │   │
│  │  • 삼성전자: SMA200 돌파 시 강한 매수 시그널          │   │
│  │  • SK하이닉스: 외국인 순매도 전환 여부 주시           │   │
│  │  • 전체: FOMC 의사록 공개 (23:00)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ AI 분석은 투자 참고용이며 투자 권유가 아닙니다.        │
│  생성 시각: 2026-03-03 08:30 KST                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 섹션별 상세 명세

| # | 섹션 | 데이터 소스 | 시각화 요소 | 필수 여부 |
|---|------|------------|------------|----------|
| 1 | Executive Summary | AI 생성 (전체 데이터 종합) | 없음 (텍스트) | 필수 |
| 2 | 시장 컨텍스트 | `/api/market`, `/api/fear-greed`, `/api/macro`, `/api/macro/global` | 인덱스 카드 3개, 공포-탐욕 게이지, 매크로 변동 테이블 | 필수 |
| 3 | 관심종목 성과 총괄 | `/api/stocks/[ticker]` (전 종목) | 성과 비교 테이블, 등락률 수평 바 차트 | 필수 |
| 4 | 종목별 심층 분석 | 아래 세부 참조 | 아래 세부 참조 | 필수 |
| 4.1 | ├ 가격 & 거래량 | `/api/stocks/[ticker]/historical` | 5일 캔들차트 + 거래량 바, 52주 프로그레스 바 | 필수 |
| 4.2 | ├ 등락 원인 분석 | AI 생성 (모든 데이터 종합) | 번호 매긴 원인 리스트 | 필수 |
| 4.3 | ├ 수급 분석 | `/api/stocks/[ticker]/investor` | 5일 수급 바 차트, 외국인 보유비율 라인, 수급 요약 테이블 | 필수 |
| 4.4 | ├ 기술적 분석 | `technical.ts` (계산) | RSI 게이지, MACD 히스토그램, 기술 지표 테이블 | 필수 |
| 4.5 | ├ 뉴스 & 이벤트 | Naver News + Google News + DART Events | 감성 도넛차트, 뉴스 리스트, 공시 리스트 | 필수 |
| 4.6 | ├ 컨센서스 & 밸류에이션 | `/api/stocks/[ticker]/consensus` | 목표가 비교 바, 밸류에이션 테이블 | 필수 |
| 4.7 | └ 내부자 & 대량보유 | `/api/stocks/[ticker]/insider` | 변동 테이블 (조건부) | 조건부 |
| 5 | 포트폴리오 인사이트 | AI 생성 (전체 종목 교차 분석) | 섹터 도넛차트, AI 레이더차트 | 필수 |
| 6 | 오늘의 주목 포인트 | AI 생성 | 불릿 포인트 리스트 | 필수 |

---

## 3. 시스템 아키텍처

### 3.1 파이프라인 구조 (research_ax 패턴 참고)

```
┌─────────────────────────────────────────────────────────┐
│                    Daily Report Pipeline                  │
│                                                          │
│  Phase 1: COLLECTION (데이터 수집)                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Watchlist Tickers                                 │  │
│  │       │                                            │  │
│  │       ├──→ Quote API (가격·거래량)                  │  │
│  │       ├──→ Historical API (5일 OHLCV)              │  │
│  │       ├──→ Investor Flow API (수급 데이터)          │  │
│  │       ├──→ Consensus API (애널리스트)               │  │
│  │       ├──→ Insider API (내부자 거래)                │  │
│  │       ├──→ Block Holdings API (대량보유)            │  │
│  │       ├──→ News APIs (Naver + Google)              │  │
│  │       ├──→ Events API (공시)                       │  │
│  │       └──→ Technical Indicators (계산)              │  │
│  │                                                    │  │
│  │  Market Context                                    │  │
│  │       ├──→ Market Indices                          │  │
│  │       ├──→ Fear & Greed Index                      │  │
│  │       ├──→ ECOS Macro                              │  │
│  │       ├──→ FRED Global                             │  │
│  │       └──→ Top Gainers/Losers                      │  │
│  │                                                    │  │
│  │  Output: RawReportData (JSON)                      │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  Phase 2: ANALYSIS (AI 분석)                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Input: RawReportData                              │  │
│  │                                                    │  │
│  │  Step 1: 종목별 등락 원인 분석 (OpenAI)             │  │
│  │    - 가격 변동 + 수급 + 뉴스 + 기술적 지표 종합     │  │
│  │    - 상승/하락 원인 Top 3 도출                      │  │
│  │                                                    │  │
│  │  Step 2: Executive Summary 생성                     │  │
│  │    - 전체 관심종목 동향 한줄 요약                    │  │
│  │                                                    │  │
│  │  Step 3: 포트폴리오 인사이트 생성                   │  │
│  │    - 종목 간 상관관계, 섹터 편중, 리스크 분석        │  │
│  │                                                    │  │
│  │  Step 4: 오늘의 주목 포인트 생성                    │  │
│  │    - 기술적 시그널 + 예정 이벤트 기반               │  │
│  │                                                    │  │
│  │  Output: AnalyzedReportData (JSON)                 │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  Phase 3: REPORT (보고서 생성)                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Input: AnalyzedReportData                         │  │
│  │                                                    │  │
│  │  Step 1: 보고서 HTML/React 렌더링                   │  │
│  │    - 차트 컴포넌트 렌더                             │  │
│  │    - 테이블 생성                                    │  │
│  │    - 섹션별 레이아웃 조립                            │  │
│  │                                                    │  │
│  │  Step 2: 메타데이터 저장                             │  │
│  │    - 생성일시, 종목 수, 통계                         │  │
│  │                                                    │  │
│  │  Output: /reports/daily/[date] 페이지               │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름 (Type Definitions)

```typescript
// Phase 1 Output
interface RawReportData {
  readonly date: string                         // 보고서 기준일
  readonly generatedAt: string                  // 생성 시각
  readonly market: {
    readonly indices: MarketIndex[]             // KOSPI, KOSDAQ, USD/KRW
    readonly fearGreed: FearGreedData           // 공포-탐욕 지수
    readonly macroKr: MacroIndicator[]          // 한국 매크로
    readonly macroGlobal: GlobalMacroIndicator[] // 글로벌 매크로
    readonly topGainers: RankingStock[]         // 상승 TOP
    readonly topLosers: RankingStock[]          // 하락 TOP
  }
  readonly stocks: StockReportData[]            // 종목별 데이터
}

interface StockReportData {
  readonly ticker: string
  readonly name: string
  readonly quote: StockQuote                    // 현재 시세
  readonly historical: HistoricalData[]         // 최근 5일 OHLCV
  readonly investorFlow: InvestorFlowEntry[]    // 수급 데이터
  readonly consensus: ConsensusData | null      // 애널리스트 컨센서스
  readonly insider: InsiderActivity[]           // 내부자 거래
  readonly blockHoldings: BlockHolding[]        // 대량보유
  readonly news: NewsArticle[]                  // 뉴스
  readonly events: CorporateEvent[]             // 공시
  readonly technical: TechnicalIndicators       // 기술적 지표
  readonly sentiment: NewsSentiment             // 뉴스 감성
}

// Phase 2 Output
interface AnalyzedReportData extends RawReportData {
  readonly executiveSummary: string             // AI 한줄 요약
  readonly stockAnalyses: StockAnalysis[]       // 종목별 AI 분석
  readonly portfolioInsight: string             // 포트폴리오 인사이트
  readonly watchPoints: string[]               // 오늘의 주목 포인트
}

interface StockAnalysis {
  readonly ticker: string
  readonly moveReasons: MoveReason[]           // 등락 원인 Top 3
  readonly aiScore: AIScoreResult              // AI 점수
  readonly outlook: string                     // 단기 전망
}

interface MoveReason {
  readonly rank: number                        // 1, 2, 3
  readonly category: 'supply_demand' | 'news' | 'technical'
                   | 'sector' | 'macro' | 'event'
  readonly description: string                 // 원인 설명
  readonly impact: 'positive' | 'negative'     // 영향 방향
  readonly evidence: string                    // 근거 데이터
}
```

---

## 4. 파일 구조

```
src/
├── app/
│   ├── api/
│   │   └── reports/
│   │       ├── daily/
│   │       │   ├── route.ts                  # GET: 보고서 목록
│   │       │   └── generate/route.ts         # POST: 보고서 생성 트리거
│   │       └── [reportId]/
│   │           └── route.ts                  # GET: 특정 보고서 데이터
│   │
│   └── reports/
│       ├── page.tsx                          # 보고서 목록 페이지
│       └── daily/
│           └── [date]/
│               └── page.tsx                  # 데일리 보고서 뷰어 페이지
│
├── components/
│   └── reports/
│       ├── DailyReport.tsx                   # 보고서 메인 컨테이너
│       ├── ExecutiveSummary.tsx               # 요약 섹션
│       ├── MarketContext.tsx                  # 시장 컨텍스트 섹션
│       ├── WatchlistOverview.tsx              # 관심종목 총괄표
│       ├── StockDeepDive.tsx                  # 종목별 심층 분석 컨테이너
│       ├── PriceVolumeSection.tsx             # 가격 & 거래량 차트
│       ├── MoveReasonsSection.tsx             # 등락 원인 분석
│       ├── SupplyDemandSection.tsx            # 수급 분석 차트
│       ├── TechnicalSection.tsx               # 기술적 분석 차트
│       ├── NewsSentimentSection.tsx            # 뉴스 & 감성 분석
│       ├── ConsensusSection.tsx               # 컨센서스 & 밸류에이션
│       ├── InsiderSection.tsx                 # 내부자 변동 (조건부)
│       ├── PortfolioInsight.tsx               # 포트폴리오 인사이트
│       ├── WatchPoints.tsx                    # 오늘의 주목 포인트
│       └── charts/
│           ├── MiniCandlestick.tsx            # 5일 미니 캔들차트
│           ├── SupplyDemandBar.tsx            # 수급 바 차트
│           ├── SentimentDonut.tsx             # 감성 도넛차트
│           ├── TargetPriceBar.tsx             # 목표가 비교 바
│           ├── RsiGauge.tsx                   # RSI 게이지
│           ├── MacdHistogram.tsx              # MACD 히스토그램
│           ├── FiftyTwoWeekProgress.tsx       # 52주 고저 프로그레스
│           └── PerformanceBar.tsx             # 등락률 수평 바
│
├── lib/
│   └── report/
│       ├── collector.ts                      # Phase 1: 데이터 수집 오케스트레이터
│       ├── analyzer.ts                       # Phase 2: AI 분석 (OpenAI)
│       ├── builder.ts                        # Phase 3: 보고서 데이터 조립
│       ├── prompts.ts                        # AI 프롬프트 템플릿
│       └── types.ts                          # 보고서 전용 타입 정의
│
└── store/
    └── report-history.ts                     # 보고서 이력 Zustand 스토어
```

---

## 5. 시각화 상세 명세

### 5.1 사용할 차트 라이브러리
- **Recharts**: 바 차트, 라인 차트, 도넛 차트, 레이더 차트 (이미 의존성 존재)
- **lightweight-charts**: 캔들스틱 차트 (이미 의존성 존재)
- **커스텀 SVG**: 게이지(RSI, 공포-탐욕), 프로그레스 바

### 5.2 차트별 명세

| 차트 | 컴포넌트 | 라이브러리 | 데이터 소스 |
|------|---------|-----------|------------|
| 5일 캔들차트 + 거래량 | `MiniCandlestick` | lightweight-charts | historical API |
| 등락률 수평 바 차트 | `PerformanceBar` | Recharts BarChart | quote API |
| 수급 5일 바 차트 | `SupplyDemandBar` | Recharts BarChart | investor API |
| 외국인 보유비율 라인 | `SupplyDemandBar` (하위) | Recharts LineChart | investor API |
| RSI 게이지 | `RsiGauge` | 커스텀 SVG | technical 계산 |
| MACD 히스토그램 | `MacdHistogram` | Recharts BarChart | technical 계산 |
| 뉴스 감성 도넛 | `SentimentDonut` | Recharts PieChart | sentiment 계산 |
| 목표가 비교 바 | `TargetPriceBar` | 커스텀 SVG | consensus API |
| 52주 고저 프로그레스 | `FiftyTwoWeekProgress` | 커스텀 SVG | quote API |
| 섹터 분포 도넛 | `PortfolioInsight` (하위) | Recharts PieChart | quote API |
| AI 레이더 차트 | `PortfolioInsight` (하위) | Recharts RadarChart | AI score API |
| 공포-탐욕 게이지 | 기존 `FearGreedGauge` 재사용 | 커스텀 SVG | fear-greed API |

### 5.3 테이블 명세

| 테이블 | 위치 | 컬럼 |
|--------|------|------|
| 매크로 변동 | 시장 컨텍스트 | 지표명, 현재값, 전일대비, 변동률 |
| 관심종목 총괄 | 성과 총괄 | 종목, 종가, 전일대비, 등락률, 거래량, 수급, AI점수, 시그널 |
| 수급 요약 | 종목 수급 분석 | 투자자 유형, 어제, 5일 누적, 20일 누적 |
| 기술 지표 | 종목 기술 분석 | 지표명, 값, 시그널(매수/중립/매도) |
| 밸류에이션 | 종목 컨센서스 | PER, PBR, 배당수익률, 목표가, 투자의견 |
| 내부자 변동 | 종목 내부자 | 날짜, 이름, 직위, 유형, 수량 |

---

## 6. AI 프롬프트 설계

### 6.1 종목별 등락 원인 분석 프롬프트

```
당신은 한국 주식 시장 전문 애널리스트입니다.
아래 데이터를 바탕으로 {종목명}({ticker})의 어제({date}) 등락 원인을 분석하세요.

## 제공 데이터
- 가격: 종가 {price}원, 전일대비 {change}원 ({changePercent}%)
- 거래량: {volume}주 (20일 평균 대비 {volumeRatio}배)
- 외국인: 순매수 {foreignNet}주, 보유비율 {foreignRatio}%
- 기관: 순매수 {institutionNet}주
- 기술 지표: RSI {rsi}, MACD {macd}, SMA20 대비 {sma20diff}%
- 뉴스 감성: 긍정 {positive}건, 부정 {negative}건
- 뉴스 헤드라인: {headlines}
- 공시: {events}
- 시장: KOSPI {kospiChange}%, 업종 {sectorChange}%

## 출력 형식 (JSON)
{
  "reasons": [
    {
      "rank": 1,
      "category": "supply_demand | news | technical | sector | macro | event",
      "description": "원인 설명 (1문장)",
      "impact": "positive | negative",
      "evidence": "근거 데이터 (구체적 수치 포함)"
    }
  ],
  "outlook": "오늘 전망 (1-2문장)"
}

반드시 3개의 원인을 중요도 순으로 나열하세요.
반드시 제공된 데이터에 근거하여 분석하세요. 추측 금지.
```

### 6.2 Executive Summary 프롬프트

```
아래는 {date} 관심종목 {count}개의 일간 분석 데이터입니다.

{각 종목의 등락률, 수급, 주요 이벤트 요약}

한국 주식 시장 투자자를 위한 데일리 브리핑을 2-3문장으로 작성하세요.
- 전체 관심종목의 동향 요약
- 가장 주목할 만한 움직임
- 시장 맥락과의 연관성

간결하고 사실에 근거하여 작성하세요.
```

### 6.3 포트폴리오 인사이트 프롬프트

```
아래는 사용자의 관심종목 포트폴리오 데이터입니다.

{종목별: 섹터, 시가총액, AI점수, 등락률, 상관성}

포트폴리오 관점에서 분석하세요:
1. 섹터 분산도 평가
2. 리스크 집중 요인
3. 상관관계 기반 분산 효과
4. 개선 제안 (1가지)

3-4문장으로 간결하게 작성하세요.
```

---

## 7. API 설계

### 7.1 보고서 생성 API

```
POST /api/reports/daily/generate
```

**Request Body:**
```json
{
  "tickers": ["005930", "000660", "035420"],
  "date": "2026-03-02"
}
```

**Response (Streaming):**
```json
{
  "phase": "collecting",
  "progress": 30,
  "message": "수급 데이터 수집 중..."
}
// ... 중간 진행 상태 스트리밍 ...
{
  "phase": "complete",
  "reportId": "daily-2026-03-02",
  "url": "/reports/daily/2026-03-02"
}
```

### 7.2 보고서 조회 API

```
GET /api/reports/daily?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "daily-2026-03-02",
      "date": "2026-03-02",
      "generatedAt": "2026-03-03T08:30:00Z",
      "stockCount": 5,
      "summary": "관심종목 5개 중 3개 상승..."
    }
  ]
}
```

### 7.3 특정 보고서 데이터 API

```
GET /api/reports/[reportId]
```

**Response:**
```json
{
  "success": true,
  "data": { /* AnalyzedReportData 전체 */ }
}
```

---

## 8. 사용자 흐름 (UX)

### 8.1 보고서 접근 경로

```
방법 1: 사이드바 "데일리 보고서" 메뉴 클릭
  → /reports 보고서 목록 페이지
  → 날짜별 보고서 카드 클릭
  → /reports/daily/2026-03-02 보고서 뷰어

방법 2: 대시보드 "오늘의 보고서" 카드 클릭
  → 최신 보고서로 바로 이동

방법 3: AI 채팅에서 "보고서 생성해줘"
  → 채팅 내 보고서 링크 제공
```

### 8.2 보고서 생성 플로우

```
사용자: "보고서 생성" 버튼 클릭
  │
  ├─ 관심종목 0개 → EmptyWatchlist 안내
  │
  └─ 관심종목 1개+ → 생성 시작
       │
       ├─ Phase 1 진행바: "데이터 수집 중..." (0~40%)
       │   └─ 종목별 11개 API 병렬 호출
       │
       ├─ Phase 2 진행바: "AI 분석 중..." (40~80%)
       │   └─ OpenAI 호출 (종목별 + 종합)
       │
       ├─ Phase 3 진행바: "보고서 생성 중..." (80~100%)
       │   └─ 데이터 조립 + 저장
       │
       └─ 완료 → 보고서 뷰어로 자동 이동
```

### 8.3 보고서 뷰어 인터랙션

- **스크롤**: 섹션 간 부드러운 스크롤, 우측에 미니맵/목차 네비게이션
- **종목 점프**: 상단 종목 칩 클릭 시 해당 종목 섹션으로 스크롤
- **차트 인터랙션**: Recharts 툴팁, lightweight-charts 크로스헤어
- **종목 링크**: 종목명 클릭 시 `/stock/[ticker]` 상세 페이지로 이동
- **공유**: 보고서 URL 복사 버튼

---

## 9. 데이터 저장

### 9.1 저장 전략

research_ax의 파일시스템 기반 저장 패턴 대신, **Zustand persist (localStorage)** + **서버 캐시**를 혼합한다.

| 데이터 | 저장 위치 | 만료 |
|--------|----------|------|
| 보고서 목록 메타 | localStorage (Zustand persist) | 영구 |
| 보고서 전체 데이터 | localStorage (Zustand persist) | 최근 30일 보관, 이전 자동 삭제 |
| 수집 원본 데이터 | 서버 메모리 캐시 | 1시간 |

### 9.2 보고서 이력 스토어

```typescript
interface ReportHistoryState {
  readonly reports: readonly ReportMeta[]
  readonly reportData: Record<string, AnalyzedReportData>
  addReport: (meta: ReportMeta, data: AnalyzedReportData) => void
  getReport: (id: string) => AnalyzedReportData | null
  deleteReport: (id: string) => void
  cleanupOld: () => void  // 30일 이전 자동 삭제
}
```

---

## 10. 사이드바 네비게이션 추가

```
기존 메뉴:
  대시보드
  AI 어시스턴트
  스크리너
  종목 비교          ← 이번에 추가됨
  관심종목
  기업 이벤트

추가:
  📊 데일리 보고서    ← 신규 메뉴 (FileText 아이콘)
```

---

## 11. 구현 우선순위

### Phase 1: 코어 파이프라인 (4h)
1. `src/lib/report/types.ts` — 타입 정의
2. `src/lib/report/collector.ts` — 데이터 수집 오케스트레이터
3. `src/lib/report/prompts.ts` — AI 프롬프트 템플릿
4. `src/lib/report/analyzer.ts` — AI 분석 (OpenAI)
5. `src/lib/report/builder.ts` — 보고서 데이터 조립
6. `src/app/api/reports/` — API 라우트

### Phase 2: 시각화 컴포넌트 (4h)
7. 차트 컴포넌트 8개 (`charts/` 디렉토리)
8. 섹션 컴포넌트 10개 (보고서 각 섹션)
9. `DailyReport.tsx` — 메인 보고서 뷰어

### Phase 3: 페이지 & UX (2h)
10. `/reports/page.tsx` — 보고서 목록
11. `/reports/daily/[date]/page.tsx` — 보고서 뷰어
12. `report-history.ts` — Zustand 스토어
13. 사이드바 네비게이션 추가
14. 대시보드 보고서 카드 추가

### Phase 4: 검증 (1h)
15. TypeScript 타입 체크
16. 프로덕션 빌드 검증
17. 로컬 테스트
18. Vercel 배포

---

## 12. 기술적 제약 및 고려사항

### 12.1 API 호출 비용
- 종목 1개당 최대 11개 API 병렬 호출
- 관심종목 20개 시 최대 220회 API 호출 → **종목 수 제한 필요 (최대 10개)**
- OpenAI 호출: 종목당 1회 + 종합 3회 → 최대 13회

### 12.2 성능 최적화
- 모든 API 호출은 `Promise.all`로 병렬화
- 서버 메모리 캐시 활용 (중복 호출 방지)
- 차트 컴포넌트 `lazy` 로딩
- 보고서 데이터는 한 번 생성 후 localStorage에 캐시

### 12.3 에러 처리
- 개별 API 실패 시 해당 섹션만 "데이터 없음" 표시, 전체 보고서는 생성
- OpenAI 실패 시 AI 분석 섹션을 데이터 요약으로 대체
- 네트워크 오류 시 toast 알림 + 재시도 버튼

### 12.4 면책 조항
- 보고서 하단에 투자 면책 조항 필수 표시
- AI 분석의 한계 명시

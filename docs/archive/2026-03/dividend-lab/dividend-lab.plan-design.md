# 배당주 검색 & 포트폴리오 설계 기능 기획서

## 1. 개요

### 1.1 목적
투자자가 국내(KOSPI/KOSDAQ) 및 해외(US) 배당주를 체계적으로 검색하고,
다양한 배당 전략에 맞춰 포트폴리오를 조합한 후 예상 배당 수익을 시뮬레이션할 수 있는 통합 배당 투자 도구 제공.

### 1.2 핵심 가치
- **검색**: 고배당, 배당성장, 배당 안정성 등 다양한 전략별 배당주 탐색
- **설계**: 드래그앤드롭으로 배당 포트폴리오 조합 및 비중 조절
- **시뮬레이션**: 투자 금액 기준 월별/연간 예상 배당금 계산
- **인사이트**: AI 기반 배당 지속가능성 평가 및 리밸런싱 제안

---

## 2. 페이지 구조

```
/dividend-lab                          ← 배당 연구소 메인
  ├── 탭 1: 배당주 스크리너             ← 전략별 배당주 검색
  ├── 탭 2: 배당 포트폴리오 설계기       ← 종목 조합 & 시뮬레이션
  └── 탭 3: 배당 캘린더 & 모니터링       ← 배당락일/지급일 추적
```

---

## 3. 기능 상세

### 3.1 배당주 스크리너 (탭 1)

#### 3.1.1 전략 프리셋

| 전략 | 설명 | 필터 기준 |
|------|------|-----------|
| **고배당 (High Yield)** | 높은 배당수익률 우선 | 배당률 ≥ 4%, 시가총액 ≥ 1,000억 |
| **배당 성장 (Dividend Growth)** | 배당금 꾸준히 증가 | 최근 3년 연속 배당 증가, CAGR ≥ 5% |
| **배당 안전 (Dividend Safety)** | 배당 삭감 리스크 낮음 | 배당성향 ≤ 60%, FCF 커버리지 ≥ 1.5x |
| **배당 귀족 (Dividend Aristocrat)** | 장기 연속 배당 증가 | 10년+ 연속 증가 (KR), 25년+ (US) |
| **월배당 (Monthly Income)** | 매월 배당 수령 | 분기/월 배당 지급 종목 |
| **밸류+배당** | 저평가 배당주 | PER ≤ 12, PBR ≤ 1.0, 배당률 ≥ 3% |

#### 3.1.2 상세 필터

**공통 필터 (KR/US 동일)**
- 배당수익률: 범위 슬라이더 (0% ~ 15%)
- 배당성향(Payout Ratio): 범위 슬라이더 (0% ~ 100%+)
- 배당 연속 증가 연수: 최소값 선택 (0, 3, 5, 10, 15, 20, 25년)
- 배당 성장률(CAGR): 범위 슬라이더 (0% ~ 30%)
- 시가총액: 범위 슬라이더
- 섹터/업종: 멀티 선택 드롭다운
- 배당 지급 빈도: 연간 / 반기 / 분기 / 월

**재무 안전성 필터**
- 부채비율(D/E): 범위 슬라이더
- FCF 배당 커버리지: 최소값
- 영업이익 증가율: 최소값
- ROE: 최소값

**시장 필터**
- 시장: 국내전체 / KOSPI / KOSDAQ / US전체 / S&P500 / NASDAQ / 통합
- 정렬: 배당률 / 배당성장률 / 배당안전점수 / 시가총액 / AI점수

#### 3.1.3 결과 테이블 컬럼

| 컬럼 | 설명 |
|------|------|
| 종목명 | 이름 + 티커 |
| 현재가 | 실시간 가격 |
| 배당수익률 | 연간 배당률 % |
| 주당배당금 | DPS (원/USD) |
| 배당성향 | Payout Ratio % |
| 배당성장률 | 3년 CAGR % |
| 연속증가 | 연속 배당 증가 연수 |
| 배당 안전 점수 | AI 지속가능성 점수 (A+~F) |
| 배당락일 | 다음 배당락일 |
| + 버튼 | 포트폴리오 설계기로 추가 |

#### 3.1.4 종목 카드 (확장 뷰)

종목 행 클릭 시 아코디언 확장:
- **배당 이력 차트**: 최근 5~10년 주당배당금 추이 (바 차트)
- **배당률 추이**: 주가 대비 배당률 변동 (라인 차트)
- **배당 지급 달력**: 월별 배당 지급 시점 시각화
- **AI 지속가능성 요약**: 기존 sustainability API 활용

---

### 3.2 배당 포트폴리오 설계기 (탭 2) ★ 핵심 기능

#### 3.2.1 포트폴리오 구성

**투자 설정 패널**
- 총 투자금액 입력 (만원 단위)
- 투자 기간 설정 (1년 / 3년 / 5년 / 10년 / 20년)
- 배당 재투자 여부 (DRIP) ON/OFF
- 추가 적립금 (월/분기/연) 설정

**종목 추가 방식**
1. 스크리너에서 "+" 버튼으로 추가
2. 검색창에서 직접 종목 검색 후 추가
3. AI 추천: "고배당 5종목 추천", "월배당 포트폴리오 구성" 등

**비중 조절**
- 각 종목별 비중(%) 슬라이더
- 드래그앤드롭으로 순서/비중 조절
- 균등 배분 / 배당률 가중 / 시총 가중 자동 배분 버튼
- 비중 합계 실시간 표시 (100% 기준)

#### 3.2.2 배당 시뮬레이션 대시보드

**요약 카드 (상단)**

| 지표 | 설명 |
|------|------|
| 포트폴리오 평균 배당률 | 비중 가중 평균 |
| 연간 예상 배당금 | 총 투자금 × 가중 배당률 |
| 월평균 예상 배당금 | 연간 ÷ 12 |
| 배당 안전 등급 | 포트폴리오 전체 안전 점수 |
| 총 누적 배당금 (기간) | 투자기간 동안 받을 총 배당 |

**월별 배당 캘린더 뷰**
- 12개월 그리드에 각 종목의 배당 지급월 표시
- 월별 예상 수령액 표시
- 배당 공백월(배당 없는 달) 하이라이트 경고
- 목표: 매월 배당 수령 (공백 0개월 달성)

**배당 성장 시뮬레이션 차트**
- X축: 투자 기간 (년)
- Y축: 누적 배당금 / 연간 배당금
- 라인 1: 배당 재투자 시 (DRIP) → 복리 효과
- 라인 2: 배당 수령 시 → 단순 누적
- 라인 3: 추가 적립 + DRIP 시 → 최대 성장

**섹터 분산도**
- 도넛 차트: 섹터별 비중
- 국내/해외 비중 바 차트
- 집중 리스크 경고 (단일 섹터 > 40%)

#### 3.2.3 AI 인사이트

**배당 포트폴리오 진단**
```
"현재 포트폴리오 분석:
 - 평균 배당률 5.2%로 고배당 전략에 부합
 - 금융 섹터 편중(62%) → 분산 필요
 - 3종목 배당성향 80%+ → 배당 삭감 리스크 주의
 - 2월, 5월 배당 공백 → 월배당 종목 추가 권장"
```

**리밸런싱 제안**
- 배당 공백월 해소를 위한 종목 추천
- 섹터 분산을 위한 대체 종목 제안
- 배당 안전성 개선을 위한 교체 제안

**What-if 시나리오**
- "만약 A종목이 배당을 50% 삭감하면?" → 포트폴리오 영향 계산
- "금리 인상 시 배당주 가격 하락 시나리오" → 수익률 변동 시뮬

---

### 3.3 배당 캘린더 & 모니터링 (탭 3)

#### 3.3.1 배당 캘린더

- 월별 캘린더 뷰: 배당락일/기준일/지급일 표시
- 국내/해외 통합 표시 (색상 구분)
- 내 포트폴리오 종목 하이라이트
- 관심 종목 배당 알림 설정

#### 3.3.2 배당 모니터링 알림

| 알림 유형 | 설명 |
|-----------|------|
| 배당락일 D-7 알림 | 배당 받으려면 매수 필요 |
| 배당 변동 알림 | 배당금 증가/감소/취소 발표 |
| 배당 안전도 변동 | AI 점수 급락 시 경고 |
| 배당 공백월 알림 | 이번 달 배당 수령 없음 |

---

## 4. 데이터 모델

### 4.1 배당 포트폴리오 (DB)

```typescript
// Prisma Schema 추가
model DividendPortfolio {
  id          String   @id @default(cuid())
  userId      String
  name        String   // "고배당 포트폴리오", "월배당 포트폴리오" 등
  totalAmount Int      // 총 투자금 (만원)
  period      Int      // 투자 기간 (년)
  drip        Boolean  @default(false) // 배당 재투자 여부
  monthlyAdd  Int      @default(0)     // 월 추가 적립금 (만원)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  items       DividendPortfolioItem[]
}

model DividendPortfolioItem {
  id          String   @id @default(cuid())
  portfolioId String
  ticker      String
  market      String   // "KR" | "US"
  weight      Float    // 비중 (0~100)
  portfolio   DividendPortfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([portfolioId, ticker, market])
}
```

### 4.2 배당 스크리너 결과 타입

```typescript
interface DividendStock {
  ticker: string
  name: string
  nameKr: string
  market: "KR" | "US"
  sector: string
  currentPrice: number
  currency: "KRW" | "USD"

  // 배당 지표
  dividendYield: number           // 배당수익률 (%)
  dividendPerShare: number        // 주당배당금
  payoutRatio: number | null      // 배당성향 (%)
  dividendGrowthRate: number | null // 3년 CAGR (%)
  consecutiveYears: number        // 연속 배당 증가 연수
  frequency: "annual" | "semi" | "quarterly" | "monthly"
  exDividendDate: string | null   // 다음 배당락일
  paymentDate: string | null      // 다음 지급일
  paymentMonths: number[]         // 배당 지급 월 [3, 6, 9, 12]

  // 안전성 지표
  safetyScore: number             // AI 안전 점수 (0~100)
  safetyGrade: string             // A+ ~ F
  fcfCoverage: number | null      // FCF 커버리지
  debtToEquity: number | null     // 부채비율

  // 배당 이력
  dividendHistory: {
    year: number
    amount: number
    yield: number
  }[]
}
```

### 4.3 포트폴리오 시뮬레이션 결과 타입

```typescript
interface DividendSimulation {
  // 요약
  summary: {
    weightedYield: number          // 가중 평균 배당률
    annualDividend: number         // 연간 예상 배당금
    monthlyDividend: number        // 월 평균 배당금
    totalDividend: number          // 기간 내 총 배당금
    totalWithDrip: number          // DRIP 적용 시 총 배당금
    safetyGrade: string            // 포트폴리오 안전 등급
    diversificationScore: number   // 분산 점수 (0~100)
  }

  // 월별 배당 스케줄
  monthlySchedule: {
    month: number                  // 1~12
    stocks: {
      ticker: string
      name: string
      amount: number               // 해당 월 예상 배당금
    }[]
    totalAmount: number
  }[]

  // 연도별 성장 시뮬레이션
  yearlyProjection: {
    year: number
    investedAmount: number          // 누적 투자금
    portfolioValue: number          // 포트폴리오 가치
    annualDividend: number          // 해당 연도 배당금
    cumulativeDividend: number      // 누적 배당금
    yieldOnCost: number             // 투자 원금 대비 배당률
  }[]

  // 섹터 분산
  sectorAllocation: {
    sector: string
    weight: number
    count: number
  }[]

  // 리스크 분석
  risks: string[]
  recommendations: string[]
}
```

---

## 5. API 설계

### 5.1 배당 스크리너 API

```
POST /api/dividend-lab/screener
```

**Request Body:**
```json
{
  "market": "KR" | "US" | "ALL",
  "preset": "high-yield" | "growth" | "safety" | "aristocrat" | "monthly" | "value" | null,
  "filters": {
    "yieldMin": 0,
    "yieldMax": 15,
    "payoutRatioMax": 80,
    "consecutiveYearsMin": 5,
    "growthRateMin": 3,
    "marketCapMin": 1000,
    "sectors": ["금융", "에너지"],
    "frequency": ["quarterly", "monthly"],
    "debtToEquityMax": 200,
    "fcfCoverageMin": 1.5
  },
  "sort": "yield" | "growthRate" | "safetyScore" | "consecutiveYears" | "marketCap",
  "order": "desc" | "asc",
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": [DividendStock],
  "meta": { "total": 150, "page": 1, "limit": 20 }
}
```

### 5.2 배당 포트폴리오 CRUD API

```
GET    /api/dividend-lab/portfolio           ← 내 포트폴리오 목록
POST   /api/dividend-lab/portfolio           ← 새 포트폴리오 생성
PUT    /api/dividend-lab/portfolio/[id]      ← 포트폴리오 수정
DELETE /api/dividend-lab/portfolio/[id]      ← 포트폴리오 삭제
```

### 5.3 배당 시뮬레이션 API

```
POST /api/dividend-lab/simulate
```

**Request Body:**
```json
{
  "totalAmount": 5000,
  "period": 10,
  "drip": true,
  "monthlyAdd": 50,
  "items": [
    { "ticker": "005930", "market": "KR", "weight": 20 },
    { "ticker": "AAPL", "market": "US", "weight": 15 },
    { "ticker": "O", "market": "US", "weight": 15 },
    { "ticker": "069500", "market": "KR", "weight": 25 },
    { "ticker": "KO", "market": "US", "weight": 25 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": DividendSimulation
}
```

### 5.4 AI 배당 포트폴리오 진단 API

```
POST /api/dividend-lab/diagnosis
```

**Request:** 포트폴리오 구성 + 투자 목표
**Response:** AI 분석 결과 (진단, 리스크, 리밸런싱 제안)

### 5.5 AI 배당 종목 추천 API

```
POST /api/dividend-lab/recommend
```

**Request Body:**
```json
{
  "strategy": "monthly-income",
  "targetYield": 5,
  "budget": 3000,
  "existingTickers": ["005930", "AAPL"],
  "preferences": {
    "markets": ["KR", "US"],
    "riskTolerance": "moderate",
    "focusSectors": []
  }
}
```

**Response:** AI가 추천하는 종목 리스트 + 추천 비중 + 이유

### 5.6 배당 캘린더 API

```
GET /api/dividend-lab/calendar?month=2026-03&market=ALL&watchlistOnly=false
```

**Response:** 해당 월의 배당락일/기준일/지급일 이벤트 목록

---

## 6. UI/UX 설계

### 6.1 네비게이션

- **사이드바**: "배당 연구소" 메뉴 항목 추가 (차트 + 원화 아이콘)
- **URL**: `/dividend-lab`
- **탭 네비게이션**: 스크리너 | 포트폴리오 설계 | 캘린더

### 6.2 스크리너 화면 레이아웃

```
┌─────────────────────────────────────────────────┐
│  📊 배당주 스크리너                    KR│US│통합 │
├─────────────────────────────────────────────────┤
│ [고배당] [배당성장] [안전배당] [귀족] [월배당] [밸류] │  ← 프리셋 버튼
├──────────────┬──────────────────────────────────┤
│ 필터 패널     │  검색 결과 테이블                  │
│              │  ┌──┬──┬──┬──┬──┬──┬──┬──┬───┐  │
│ 배당률 ──●── │  │이름│가격│배당│성장│연속│안전│락일│ + │  │
│ 배당성향 ──●──│  ├──┼──┼──┼──┼──┼──┼──┼──┼───┤  │
│ 연속증가 ──●──│  │삼성│8만│2.1│5%│10년│A │3/15│ + │  │
│ 시가총액 ──●──│  │  배당 이력 차트 (확장)          │  │
│ 섹터    [▼]  │  ├──┼──┼──┼──┼──┼──┼──┼──┼───┤  │
│ 지급빈도 [▼]  │  │KO │$73│3.0│4%│61년│A+│4/1 │ + │  │
│              │  └──┴──┴──┴──┴──┴──┴──┴──┴───┘  │
│ [필터 초기화]  │          1 2 3 ... 8              │
└──────────────┴──────────────────────────────────┘
```

### 6.3 포트폴리오 설계기 화면 레이아웃

```
┌─────────────────────────────────────────────────┐
│  🎯 배당 포트폴리오 설계기          [저장] [불러오기] │
├─────────────────────────────────────────────────┤
│ 투자금: [5,000]만원  기간: [10]년  DRIP: [ON]     │
│ 월적립: [50]만원     배당성장 가정: [3]%/년         │
├─────────────────────────────────────────────────┤
│                                                 │
│  📌 포트폴리오 구성                [균등][가중][AI추천] │
│  ┌─────────────────────────────────────────┐    │
│  │ 삼성전자  KR  ████████░░ 20%   2.1%    │ ✕ │
│  │ AAPL     US  ██████░░░░ 15%   0.5%    │ ✕ │
│  │ O(Realty) US  ██████░░░░ 15%   5.8%    │ ✕ │
│  │ TIGER배당 KR  ██████████ 25%   3.5%    │ ✕ │
│  │ KO       US  ██████████ 25%   3.0%    │ ✕ │
│  └─────────────────────────────────────────┘    │
│  합계: 100%  |  [+ 종목 추가]                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  💰 배당 시뮬레이션 결과                            │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │가중배당률  │연간 배당금 │월평균 배당 │10년 총 배당│  │
│  │  3.18%   │ 159만원   │ 13.3만원  │ 2,847만원 │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│                                                 │
│  📅 월별 배당 수령 스케줄                           │
│  1월  2월  3월  4월  5월  6월  7월  8월 ...        │
│  ██   ░░   ██   ██   ░░   ██   ██   ░░         │
│  12만  0   25만  15만  0   25만  12만  0          │
│  ⚠️ 2월, 5월, 8월 배당 공백 → 월배당 종목 추가 권장   │
│                                                 │
│  📈 배당 성장 시뮬레이션 (10년)                     │
│  ▐                                         ╱   │
│  ▐                                    ╱╱╱      │
│  ▐                              ╱╱╱            │
│  ▐                        ╱╱╱                  │
│  ▐─────────────────╱╱╱─────── DRIP             │
│  ▐───────── ╱╱╱ ──────────── 단순 배당           │
│  └─────────────────────────────────────────     │
│   1년   3년   5년   7년   10년                    │
│                                                 │
│  🏷 섹터 분산    │  🤖 AI 진단                     │
│  ◐ 금융 35%     │  "고배당 전략 부합 (3.18%)       │
│  ◑ IT 20%      │   금융 섹터 편중 주의             │
│  ◔ 리츠 15%    │   2,5,8월 공백 해소 필요          │
│  ◕ 소비재 30%   │   O(Realty) 월배당으로 공백 감소"  │
└─────────────────────────────────────────────────┘
```

### 6.4 색상 & 스타일 가이드

- **고배당**: 빨간색 계열 (text-red-500)
- **배당 성장**: 초록색 계열 (text-green-500)
- **안전 배당**: 파란색 계열 (text-blue-500)
- **배당 공백월**: 회색 배경 + 경고 아이콘
- **배당 지급월**: 초록색 배경 하이라이트
- **KR 종목**: 기본 테마 색상
- **US 종목**: 보라색 계열 구분

---

## 7. 기술 구현 계획

### 7.1 데이터 소스

| 데이터 | 국내 (KR) | 해외 (US) |
|--------|-----------|-----------|
| 배당 이력 | DART API (기존 dart-dividend) | Twelve Data dividends API (기존) |
| 주가/시총 | Naver Finance (기존) | Twelve Data quote (기존) |
| 재무제표 | DART (기존) | Finnhub metrics (기존) |
| 배당 일정 | DART 공시 | Twelve Data + Finnhub |
| AI 분석 | OpenAI GPT-4o-mini (기존 sustainability) | 동일 |

### 7.2 파일 구조 (예상)

```
src/
├── app/
│   ├── dividend-lab/
│   │   ├── page.tsx                    # 메인 페이지 (탭 구조)
│   │   └── layout.tsx                  # 레이아웃
│   └── api/
│       └── dividend-lab/
│           ├── screener/route.ts       # 배당 스크리너
│           ├── portfolio/route.ts      # 포트폴리오 CRUD
│           ├── portfolio/[id]/route.ts # 개별 포트폴리오
│           ├── simulate/route.ts       # 시뮬레이션
│           ├── diagnosis/route.ts      # AI 진단
│           ├── recommend/route.ts      # AI 종목 추천
│           └── calendar/route.ts       # 배당 캘린더
├── components/
│   └── dividend-lab/
│       ├── DividendScreener.tsx         # 스크리너 컨테이너
│       ├── DividendFilterPanel.tsx      # 필터 패널
│       ├── DividendStockTable.tsx       # 결과 테이블
│       ├── DividendStockCard.tsx        # 종목 상세 카드
│       ├── DividendHistoryChart.tsx     # 배당 이력 차트
│       ├── PortfolioDesigner.tsx        # 포트폴리오 설계기
│       ├── PortfolioItemList.tsx        # 종목 리스트 (DnD)
│       ├── WeightSlider.tsx            # 비중 슬라이더
│       ├── SimulationDashboard.tsx      # 시뮬레이션 대시보드
│       ├── MonthlyDividendGrid.tsx      # 월별 배당 그리드
│       ├── DividendGrowthChart.tsx      # 성장 시뮬 차트
│       ├── SectorDiversification.tsx    # 섹터 분산 차트
│       ├── AIInsightPanel.tsx          # AI 인사이트
│       ├── DividendCalendar.tsx         # 배당 캘린더
│       └── PresetButtons.tsx           # 전략 프리셋 버튼
├── lib/
│   └── dividend/
│       ├── screener.ts                 # 스크리너 로직
│       ├── simulator.ts               # 시뮬레이션 계산
│       ├── dividend-data.ts            # 배당 데이터 통합
│       └── dividend-types.ts           # 타입 정의
└── store/
    └── dividend-portfolio.ts           # Zustand 스토어
```

### 7.3 구현 단계

**Phase 1: 배당 스크리너 (1주)**
1. 배당 데이터 통합 레이어 구축 (KR + US)
2. 스크리너 API 구현
3. 필터 패널 + 결과 테이블 UI
4. 전략 프리셋 구현

**Phase 2: 포트폴리오 설계기 (1주)**
1. 포트폴리오 CRUD API + DB 마이그레이션
2. 종목 추가/삭제/비중 조절 UI
3. 시뮬레이션 엔진 구현
4. 대시보드 카드 (요약, 월별, 성장 차트)

**Phase 3: AI 인사이트 (3~4일)**
1. 포트폴리오 진단 API (GPT 활용)
2. 종목 추천 API
3. 리밸런싱 제안 로직

**Phase 4: 캘린더 & 마무리 (3~4일)**
1. 통합 배당 캘린더
2. 사이드바 네비게이션 추가
3. 반응형(모바일) 대응
4. 성능 최적화 (캐싱, 로딩 상태)

---

## 8. 예시 시나리오

### 시나리오 1: "매월 50만원 배당 받고 싶다"

1. 스크리너에서 "월배당" 프리셋 선택 → 분기/월 배당 종목 필터링
2. O(Realty Income), STAG, MAIN 등 월배당 ETF/리츠 확인
3. 국내 고배당 ETF (TIGER 배당성장, KODEX 고배당) 추가
4. 포트폴리오 설계기에서 비중 조절
5. 월별 배당 그리드에서 매월 수령 확인
6. 투자금 조절 → "월 50만원 수령에 필요한 투자금: 약 1.2억원"
7. AI가 "현재 투자금으로 월 13만원 수령 가능, 목표 달성까지 X년 필요" 제안

### 시나리오 2: "안전하면서 배당 성장하는 포트폴리오"

1. 스크리너에서 "배당 안전" 프리셋 → 배당성향 60% 이하
2. "배당 성장" 필터 추가 → 3년 CAGR 5% 이상
3. KO, JNJ, PG 등 미국 배당 귀족 + 삼성전자, KT&G 등 국내
4. 설계기에서 10년 시뮬레이션 → DRIP ON
5. "10년 후 초기 투자 대비 배당률(YoC) 7.2% 전망"
6. AI: "안정적 포트폴리오, 배당 삭감 리스크 낮음"

### 시나리오 3: "고배당 + 성장형 혼합 전략"

1. 고배당 종목 50%: 배당률 5%+ (에너지, 금융, 리츠)
2. 성장형 종목 50%: 배당률 1~3% + 성장률 10%+ (IT, 헬스케어)
3. 설계기에서 두 그룹 비중 조절
4. 시뮬레이션: 초기 배당률 3.2% → 10년 후 YoC 6.5%
5. AI: "균형 잡힌 전략, 초기 수익 + 장기 성장 모두 확보"

---

## 9. 차별화 포인트

| 기능 | 기존 서비스 (증권사 등) | InvestHub 배당 연구소 |
|------|----------------------|---------------------|
| 배당 검색 | 단순 배당률 정렬 | 6가지 전략 프리셋 + 다차원 필터 |
| 국내+해외 | 별도 서비스 | 통합 스크리너 & 포트폴리오 |
| 포트폴리오 설계 | 없음 | 비중 조절 + 실시간 시뮬레이션 |
| 월별 배당 | 단순 캘린더 | 공백월 분석 + 해소 추천 |
| 시뮬레이션 | 단일 종목 | 포트폴리오 단위 + DRIP + 적립 |
| AI 분석 | 없음 | 진단/추천/리밸런싱/시나리오 |
| 배당 안전성 | 없음 | AI 지속가능성 점수 (A+~F) |

---

## 10. KPI & 성공 지표

| 지표 | 목표 |
|------|------|
| 배당 연구소 DAU | 전체 DAU의 20%+ |
| 포트폴리오 저장 수 | 사용자당 평균 2.5개+ |
| 시뮬레이션 실행 수 | 일 500회+ |
| 평균 체류 시간 | 5분+ (현재 대시보드 2분 대비) |
| AI 추천 클릭률 | 40%+ |

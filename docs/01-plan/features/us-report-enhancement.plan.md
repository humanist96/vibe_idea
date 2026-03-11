# Plan: 미국주식 보고서 강화

## 개요
한국주식 데일리 보고서에 추가된 6대 리치 기능(애널리스트 다이제스트, 컨빅션 스코어, 액션 아이템, 리스크 알림, 목표가 괴리율, 총괄표 강화)을 미국주식 보고서에도 동일하게 적용한다.

## 현재 상태
- API: `/api/us-stocks/reports/generate` — 미국주식 데일리 분석 생성
- UI: `USDailyReport.tsx` + 7개 서브 컴포넌트
- 데이터: Finnhub(quote, metrics, news), Twelve Data(statistics), FMP(company)
- **미비 항목**: 컨센서스 없음, 컨빅션 스코어 없음, 리스크 알림 없음, 액션 아이템 없음

## 목표
1. **US 컨센서스 데이터 수집** — Finnhub recommendation trends API 활용
2. **컨빅션 스코어** — 기술적/모멘텀/밸류에이션/애널리스트 4팩터 종합
3. **액션 아이템** — 종목별 행동 제안 + 조건부 근거
4. **리스크 알림 배지** — RSI, 거래량, 52주 고가 근접 등
5. **애널리스트 다이제스트** — AI 요약 + 목표가 괴리율
6. **총괄표 강화** — 확신도/액션 컬럼 추가

## 구현 범위

### Phase 1: 데이터 소스
- `src/lib/api/finnhub-consensus.ts` — Finnhub recommendation trends API
  - `/stock/recommendation?symbol=AAPL` → buy/hold/sell/strongBuy/strongSell counts
  - 목표가: Finnhub price target API (`/stock/price-target`)
- 캐시: 1시간 (ONE_HOUR)

### Phase 2: 타입 확장
- `src/lib/report/us-types.ts` — ConvictionScore, ActionItem, RiskAlert, AnalystDigest 추가
  - KR types에서 공유 타입으로 추출 or 동일 인터페이스 import

### Phase 3: 분석 로직
- `src/lib/report/us-analyzer.ts` 수정
  - `buildUSRiskAlerts()` — RSI, 52주 고점 근접, 거래량 급증
  - `buildUSAnalystDigest()` — Finnhub 추천/목표가 기반
  - AI 프롬프트에 컨센서스 데이터 피딩
  - 컨빅션 스코어, 액션 아이템 생성

### Phase 4: UI 컴포넌트
- KR 컴포넌트 재활용 (ConvictionScoreCard, ActionItemCard, RiskAlertBadges, AnalystDigestSection)
- `src/components/us-reports/USStockDeepDive.tsx` 수정 — 새 섹션 배치
- `src/components/us-reports/USWatchlistOverview.tsx` 수정 — 확신도/액션 컬럼

### Phase 5: 수집기
- `src/lib/report/us-collector.ts` 수정 — Finnhub consensus 데이터 수집 추가

## 의존성
- Finnhub API (기존 키 사용, recommendation + price-target endpoints)
- 기존 KR report 공유 컴포넌트
- OpenAI GPT-4o-mini

## 예상 파일 수
- 신규: 1~2개 (finnhub-consensus)
- 수정: 5~6개 (us-types, us-analyzer, us-collector, us-prompts, USStockDeepDive, USWatchlistOverview)

# 투자 전략 백테스팅 (Strategy Backtesting) Planning Document

> **Summary**: 사용자가 매수/매도 규칙을 정의하고 과거 데이터로 전략의 수익성을 시뮬레이션하는 기능
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

투자 전략을 실제 자금을 투입하기 전에 과거 데이터로 검증할 수 있도록 하여 사용자의 투자 의사결정 품질을 높인다.

### 1.2 Background

플랫폼에 기술적 분석, AI 스코어링, 섹터 분석 등 다양한 인사이트가 있지만 이를 조합한 전략이 과거에 실제로 통했는지 검증하는 수단이 없다. 백테스팅은 전략의 신뢰도를 높이고 플랫폼 차별화 포인트가 된다.

### 1.3 Related Documents

- 의존 기능: 기존 historical data API, 기술적 분석 lib
- 참고: `lib/analysis/technical.ts` (기존 기술 지표 계산 로직)

---

## 2. Scope

### 2.1 In Scope

- [ ] 전략 정의 UI: 매수/매도 조건 빌더 (지표 선택 + 임계값)
- [ ] 백테스트 실행: 1y/3y/5y 기간 선택, 과거 OHLCV 데이터로 시뮬레이션
- [ ] 결과 지표: 총수익률, 최대 낙폭(MDD), 샤프 비율, 승률, 거래 로그
- [ ] 차트 오버레이: 가격 차트 위에 매수/매도 시점 표시
- [ ] 사전 빌트인 전략 템플릿 (골든크로스, RSI 과매도 반등 등)

### 2.2 Out of Scope

- 포트폴리오 레벨 백테스팅 (단일 종목 한정, 다음 이터레이션)
- 옵션/선물 전략 지원
- 실시간 페이퍼 트레이딩 (가상 모의투자)
- 사용자 간 전략 공유 (소셜 트레이딩에서 별도 처리)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 전략 조건 빌더: AND/OR 논리로 기술 지표(MA, RSI, MACD, 볼린저밴드) 조합 | Must | Pending |
| FR-02 | 백테스트 실행: 종목 + 기간 선택 후 시뮬레이션 결과 반환 | Must | Pending |
| FR-03 | 결과 대시보드: 총수익, MDD, 샤프비율, 승률, 연환산수익 표시 | Must | Pending |
| FR-04 | 거래 로그: 각 매수/매도 날짜, 가격, 수익률 테이블 | Should | Pending |
| FR-05 | 차트 오버레이: 가격 차트에 매수(▲)/매도(▼) 마커 표시 | Should | Pending |
| FR-06 | 빌트인 전략 템플릿 5종 이상 | Should | Pending |
| FR-07 | 전략 저장 및 재사용 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 5년 백테스트 결과 < 10초 | 서버 응답 시간 측정 |
| Data | 1일봉 OHLCV 데이터 최소 5년 보유 | 데이터 범위 검증 |
| Accuracy | 수수료(0.015% 기준) 반영 계산 | 단위 테스트로 검증 |

---

## 4. Key Pages / Routes

| Route | Description |
|-------|-------------|
| `/backtest` | 백테스팅 메인 페이지 (전략 빌더 + 결과) |
| `/backtest/templates` | 사전 정의 전략 템플릿 목록 |
| `/backtest/[strategyId]` | 저장된 전략 결과 조회 |

---

## 5. Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/backtest/run` | 백테스트 실행 (전략 정의 + 종목 + 기간 입력) |
| GET | `/api/backtest/templates` | 사전 빌트인 전략 템플릿 목록 |
| GET | `/api/backtest/history` | 사용자 백테스트 실행 이력 |
| POST | `/api/user/strategies` | 전략 저장 |
| GET | `/api/user/strategies` | 저장된 전략 목록 |

---

## 6. Data Model Changes (Prisma)

```prisma
model Strategy {
  id         String   @id @default(cuid())
  userId     String
  name       String
  definition Json     // 매수/매도 조건 JSON 구조
  isTemplate Boolean  @default(false)
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  backtests  Backtest[]

  @@index([userId])
}

model Backtest {
  id          String   @id @default(cuid())
  userId      String
  strategyId  String?
  ticker      String
  market      String
  period      String   // "1y" | "3y" | "5y"
  result      Json     // { totalReturn, mdd, sharpe, winRate, trades[] }
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  strategy    Strategy? @relation(fields: [strategyId], references: [id])

  @@index([userId])
}
```

---

## 7. Dependencies on Existing Features

- **Historical Data API**: 과거 OHLCV 데이터 공급 (Finnhub / 자체 수집)
- **`lib/analysis/technical.ts`**: MA, RSI, MACD 등 기존 지표 계산 로직 재사용
- **Stock Detail Pages**: 백테스트 결과를 종목 상세 페이지에서 접근 가능하도록 연결

---

## 8. Success Metrics

- 백테스트 실행 후 전략 저장율 40% 이상
- 5년 기간 백테스트 응답 시간 p95 < 10초
- 월간 활성 사용자의 30% 이상이 백테스팅 기능 1회 이상 사용

---

## 9. Next Steps

1. [ ] Historical data 보유 범위 및 공급원 확인
2. [ ] 백테스팅 엔진 서버사이드 구현 방식 결정 (API Route vs Edge Function)
3. [ ] Design document 작성 (`backtest.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

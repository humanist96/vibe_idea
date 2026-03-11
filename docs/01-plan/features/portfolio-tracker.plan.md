# 포트폴리오 트래커 (Portfolio Tracker) Planning Document

> **Summary**: 보유 주식의 실시간 손익 계산, 자산 배분 시각화, 거래 내역 관리, 배당 수입 추적을 제공하는 종합 포트폴리오 관리 기능
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

기존 portfolio API(ticker/market/quantity/avgPrice)를 기반으로 실시간 시세 연동 손익 계산, 자산 배분 차트, 거래 이력 관리, 배당 추적 기능을 추가하여 사용자가 투자 현황을 한 곳에서 파악할 수 있도록 한다.

### 1.2 Background

현재 `api/user/portfolio`에 보유 종목 기본 정보(티커/시장/수량/평균단가)가 저장되지만 이를 시각화하거나 분석하는 UI가 없다. 사용자는 별도 스프레드시트에서 손익을 계산하고 있어 플랫폼 이탈 원인이 된다.

### 1.3 Related Documents

- 기존 API: `app/api/user/portfolio/route.ts` (PUT - 포트폴리오 배열 저장)
- 의존 기능: Watchlist, Dividend Lab, Stock Detail

---

## 2. Scope

### 2.1 In Scope

- [ ] 실시간 시세 기반 손익(P&L) 계산 (종목별/전체)
- [ ] 자산 배분 차트 (섹터별, KR/US 시장별)
- [ ] 수익률 차트 (일/주/월 수익률 vs 벤치마크 KOSPI/S&P500)
- [ ] 거래 내역 로그 (매수/매도 날짜/가격/수량)
- [ ] 배당 수입 추적 (예상 배당 + 실제 수령 기록)
- [ ] 포트폴리오 종목 추가/수정/삭제 UI 개선

### 2.2 Out of Scope

- 다중 포트폴리오 (계좌별 분리) - 다음 이터레이션
- 증권사 API 자동 연동 (HTS 연동)
- 세금 계산 기능 (양도세 등)
- 외환 환율 변동 손익 분리

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 종목별 실시간 현재가 조회 및 평가손익/수익률 계산 | Must | Pending |
| FR-02 | 포트폴리오 요약: 총 평가액, 총 손익, 총 수익률 | Must | Pending |
| FR-03 | 자산 배분 도넛 차트 (섹터별, 시장별) | Must | Pending |
| FR-04 | 거래 내역 CRUD (매수/매도 이벤트 기록) | Must | Pending |
| FR-05 | 수익률 시계열 차트 vs 벤치마크 | Should | Pending |
| FR-06 | 예상 연간 배당 수입 계산 (보유 수량 × 배당 단가) | Should | Pending |
| FR-07 | 배당 수령 기록 입력 및 이력 조회 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 포트폴리오 요약 로드 < 3초 (10종목 기준) | Lighthouse / 실측 |
| Data Freshness | 현재가 15분 이내 데이터 | API 타임스탬프 검증 |
| Security | 본인 포트폴리오만 접근 가능 | NextAuth session 검증 |

---

## 4. Key Pages / Routes

| Route | Description |
|-------|-------------|
| `/portfolio` | 포트폴리오 메인 (요약 + 종목 목록 + 차트) |
| `/portfolio/transactions` | 거래 내역 목록 및 추가 |
| `/portfolio/dividends` | 배당 수입 추적 |

---

## 5. Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/portfolio` | 포트폴리오 조회 (실시간 시세 포함) |
| PUT | `/api/user/portfolio` | 포트폴리오 종목 저장 (기존 endpoint 유지) |
| GET | `/api/user/portfolio/summary` | 총 평가액, 손익, 수익률 요약 |
| GET | `/api/user/transactions` | 거래 내역 조회 |
| POST | `/api/user/transactions` | 거래 내역 추가 |
| PUT | `/api/user/transactions/[id]` | 거래 내역 수정 |
| DELETE | `/api/user/transactions/[id]` | 거래 내역 삭제 |
| GET | `/api/user/dividends` | 배당 수령 이력 |
| POST | `/api/user/dividends` | 배당 수령 기록 추가 |

---

## 6. Data Model Changes (Prisma)

```prisma
// 기존 portfolio 필드(ticker, market, quantity, avgPrice)는 User.portfolio JSON으로 유지
// 아래는 신규 모델

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
  amount     Float    // 수령 금액
  currency   String   @default("KRW")
  receivedAt DateTime
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

---

## 7. Dependencies on Existing Features

- **`api/user/portfolio/route.ts`**: 기존 PUT 로직 유지, GET 추가로 확장
- **Dividend Lab**: 예상 배당 단가 데이터 재활용
- **Stock Detail / Quote API**: 현재가 실시간 조회
- **Watchlist**: 포트폴리오 종목을 watchlist에 자동 동기화 옵션

---

## 8. Success Metrics

- 포트폴리오 등록 사용자의 주간 방문 횟수 3회 이상
- 거래 내역 입력 기능 사용율 50% 이상 (포트폴리오 사용자 중)
- 포트폴리오 페이지 평균 체류 시간 2분 이상

---

## 9. Next Steps

1. [ ] 기존 `api/user/portfolio` 데이터 구조 마이그레이션 계획 수립
2. [ ] 실시간 시세 조회 비용 및 캐싱 전략 결정
3. [ ] Design document 작성 (`portfolio-tracker.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

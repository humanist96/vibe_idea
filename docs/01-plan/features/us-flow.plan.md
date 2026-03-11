# 미국 투자자 동향 (US Investor Flow) Planning Document

> **Summary**: 미국 주식 시장의 기관/개인 투자자 자금 흐름을 시각화하여 스마트머니 동향을 파악할 수 있는 기능
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

기존 KR 시장의 `/flow` 페이지 패턴을 미국 시장으로 확장하여 기관 투자자(13F 공시)와 섹터별 자금 흐름 데이터를 제공, 사용자가 스마트머니를 따라가는 투자 전략을 수립할 수 있도록 한다.

### 1.2 Background

US 주식 분석 기능(AI 스코어링, 스크리너 등)은 있지만 미국 기관 투자자 동향 데이터가 없어 글로벌 투자자 사용자들의 니즈를 충족하지 못하고 있다. SEC 13F 공시는 공개 데이터로 규제 없이 활용 가능하다.

### 1.3 Related Documents

- 참고 패턴: 기존 KR `/flow` 페이지 구현
- 데이터 소스: Finnhub institutional holdings API, SEC EDGAR 13F
- 의존 기능: US Stock Detail 페이지

---

## 2. Scope

### 2.1 In Scope

- [ ] 종목별 기관 투자자 보유 현황 (상위 10개 기관, 지분율)
- [ ] 기관 vs 개인 추정 자금 흐름 (Finnhub 데이터 기반)
- [ ] 섹터별 기관 자금 유입/유출 집계
- [ ] 분기별 13F 변화 추이 (전분기 대비 증감)
- [ ] US Stock Detail 페이지 내 기관 보유 섹션 추가

### 2.2 Out of Scope

- 실시간 기관 거래 데이터 (13F는 분기 후 45일 공시, 지연 있음)
- 헤지펀드 개별 전략 분석
- 옵션 포지션 추적 (별도 기능)
- 공매도 잔고 데이터 (다음 이터레이션)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 종목별 기관 보유 현황: 상위 기관, 보유 주수, 지분율, 전분기 대비 변화 | Must | Pending |
| FR-02 | 섹터별 기관 자금 흐름 집계: 유입/유출 상위 섹터 | Must | Pending |
| FR-03 | 13F 분기별 변화 차트: 기관 총 보유량 시계열 | Should | Pending |
| FR-04 | 기관 vs 개인 자금 흐름 추정 표시 | Should | Pending |
| FR-05 | US Stock Detail 내 "기관 보유" 탭 추가 | Must | Pending |
| FR-06 | 기관 신규 매수/대량 매도 종목 알림 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Data Freshness | 13F 데이터: 분기 공시 기준 최신 반영 | 데이터 타임스탬프 |
| Performance | 페이지 초기 로드 < 3초 | Lighthouse |
| API Rate Limit | Finnhub free tier 한도 내 캐싱 운영 | API 호출 모니터링 |

---

## 4. Key Pages / Routes

| Route | Description |
|-------|-------------|
| `/flow/us` | US 투자자 동향 메인 (섹터별 흐름 + 주목 종목) |
| `/flow/us/institutions` | 기관 투자자 목록 및 포트폴리오 변화 |
| `/stocks/us/[ticker]` | 기존 US 종목 상세에 기관 보유 탭 추가 |

---

## 5. Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/us/flow/sector` | 섹터별 기관 자금 흐름 집계 |
| GET | `/api/us/flow/institutional/[ticker]` | 종목별 기관 보유 현황 |
| GET | `/api/us/flow/institutional` | 주요 기관 투자자 목록 및 최근 변화 |
| GET | `/api/us/flow/changes` | 최근 분기 대비 기관 포지션 변화 상위 종목 |

---

## 6. Data Model Changes (Prisma)

```prisma
model InstitutionalHolding {
  id             String   @id @default(cuid())
  ticker         String
  market         String   @default("US")
  institutionName String
  sharesHeld     BigInt
  valueUsd       BigInt
  percentOfPort  Float
  changeInShares BigInt   // 전분기 대비 변화 (+/-)
  filingDate     DateTime // 13F 공시일
  period         String   // "2024Q4" 형식
  createdAt      DateTime @default(now())

  @@unique([ticker, institutionName, period])
  @@index([ticker, period])
  @@index([filingDate])
}
```

---

## 7. Dependencies on Existing Features

- **KR `/flow` 페이지**: UI 레이아웃 및 컴포넌트 패턴 재사용
- **US Stock Detail 페이지**: 기관 보유 탭 통합
- **Finnhub API 클라이언트**: 기존 설정 및 rate limit 관리 재사용
- **Ranking 페이지**: 기관 매수 상위 종목을 랭킹에 연결 가능

---

## 8. Success Metrics

- US 주식 분석 사용자의 flow 페이지 방문율 25% 이상
- 종목 상세에서 기관 보유 탭 클릭율 30% 이상
- 데이터 캐시 히트율 70% 이상 (API 비용 절감)

---

## 9. Next Steps

1. [ ] Finnhub institutional holdings API 데이터 품질 및 커버리지 검증
2. [ ] SEC EDGAR 13F 데이터 파싱 방식 결정 (직접 파싱 vs Finnhub 의존)
3. [ ] KR flow 페이지 컴포넌트 재사용 가능 부분 식별
4. [ ] Design document 작성 (`us-flow.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

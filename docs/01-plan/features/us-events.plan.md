# 미국 기업 이벤트 (US Corporate Events) Planning Document

> **Summary**: 미국 기업의 실적 발표, 배당, 주식 분할, FDA 승인, M&A 등 주요 이벤트를 캘린더/목록으로 제공하고 AI 요약을 통해 즉시 분석할 수 있는 기능
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

기존 KR 시장의 `/events` 페이지 패턴을 미국 시장으로 확장하여 미국 기업 이벤트를 통합 제공하고, 기존 `generateAIAnalysis` 함수로 주요 이벤트에 대한 AI 요약을 제공한다.

### 1.2 Background

미국 주식 분석 기능은 있지만 미국 기업 이벤트(특히 실적 발표 캘린더, FDA 이벤트 등 고영향 이벤트)를 한 곳에서 볼 수 없다. 이벤트 기반 투자를 하는 사용자들의 핵심 요구사항이다.

### 1.3 Related Documents

- 참고 패턴: 기존 KR `/events` 페이지 구현
- 데이터 소스: Finnhub earnings calendar, SEC EDGAR, company news
- 의존 기능: US Stock Detail, 기존 AI 분석 (`generateAIAnalysis`)

---

## 2. Scope

### 2.1 In Scope

- [ ] 미국 기업 이벤트 캘린더 뷰 (월간/주간)
- [ ] 이벤트 목록 뷰 (날짜순, 필터: 이벤트 타입/섹터/시가총액)
- [ ] 이벤트 타입: 실적 발표, 배당 ex-date, 주식 분할, FDA 결정, M&A 발표
- [ ] 주요 이벤트 AI 요약 (기존 `generateAIAnalysis` 재사용)
- [ ] US Stock Detail 페이지 내 이벤트 섹션 통합

### 2.2 Out of Scope

- 이벤트 알림 연동 (알림 시스템 기능에서 처리)
- 자체 FDA 파이프라인 데이터베이스 구축
- 실시간 이벤트 스트리밍 (공시 즉시 반영)
- 한국 상장 미국 ETF 이벤트

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 실적 발표 캘린더: 날짜별 발표 예정 기업 목록 (EPS 컨센서스 포함) | Must | Pending |
| FR-02 | 이벤트 목록: 타입/섹터 필터, 날짜 범위 선택 | Must | Pending |
| FR-03 | 이벤트 상세: 배경 설명, 예상 영향, AI 요약 | Must | Pending |
| FR-04 | 배당 이벤트: ex-date, 지급일, 배당금 표시 | Should | Pending |
| FR-05 | 주식 분할 이벤트: 분할 비율, 효력 발생일 | Should | Pending |
| FR-06 | FDA 이벤트: PDUFA 날짜, 대상 약품, 관련 기업 | Could | Pending |
| FR-07 | 이벤트 북마크/관심 등록 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Data Coverage | S&P 500 기업 실적 발표 캘린더 100% | 데이터 커버리지 검증 |
| Performance | 캘린더 뷰 로드 < 2초 | Lighthouse |
| AI Summary | AI 요약 생성 < 5초 | 응답 시간 측정 |

---

## 4. Key Pages / Routes

| Route | Description |
|-------|-------------|
| `/events/us` | US 기업 이벤트 메인 (캘린더 + 목록) |
| `/events/us/earnings` | 실적 발표 캘린더 전용 뷰 |
| `/events/us/[eventId]` | 이벤트 상세 및 AI 분석 |
| `/stocks/us/[ticker]` | 기존 US 종목 상세에 이벤트 섹션 추가 |

---

## 5. Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/us/events` | US 기업 이벤트 목록 (날짜범위, 타입 필터) |
| GET | `/api/us/events/earnings` | 실적 발표 캘린더 (날짜별 기업 목록) |
| GET | `/api/us/events/[eventId]` | 이벤트 상세 |
| POST | `/api/us/events/[eventId]/ai-summary` | AI 요약 생성 |
| GET | `/api/us/events/ticker/[ticker]` | 특정 종목 이벤트 목록 |

---

## 6. Data Model Changes (Prisma)

```prisma
model UsEvent {
  id          String   @id @default(cuid())
  ticker      String
  company     String
  type        String   // "EARNINGS" | "DIVIDEND" | "SPLIT" | "FDA" | "MA" | "OTHER"
  title       String
  description String?  @db.Text
  eventDate   DateTime
  metadata    Json?    // 타입별 추가 데이터 (EPS, 배당금, 분할비율 등)
  aiSummary   String?  @db.Text
  aiSummaryAt DateTime?
  source      String   // "finnhub" | "sec" | "manual"
  externalId  String?  // 외부 API ID (중복 방지)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([externalId, source])
  @@index([ticker, eventDate])
  @@index([type, eventDate])
  @@index([eventDate])
}
```

---

## 7. Dependencies on Existing Features

- **KR `/events` 페이지**: UI 레이아웃, 캘린더 컴포넌트, 필터 UI 재사용
- **`generateAIAnalysis`**: 기존 AI 분석 함수로 이벤트 AI 요약 생성
- **US Stock Detail 페이지**: 종목별 이벤트 섹션 통합
- **Notification System**: 이벤트 알림 연동 (알림 시스템 구현 후)
- **Finnhub API 클라이언트**: earnings calendar, company news 엔드포인트

---

## 8. Success Metrics

- 실적 발표 주간 이벤트 페이지 방문자 수 20% 증가
- 이벤트 상세 페이지에서 AI 요약 클릭율 40% 이상
- S&P 500 실적 발표 데이터 커버리지 95% 이상

---

## 9. Next Steps

1. [ ] Finnhub earnings calendar API 데이터 품질 검증 (과거 데이터 포함)
2. [ ] KR events 컴포넌트 추상화 및 재사용 범위 결정
3. [ ] FDA 이벤트 데이터 소스 조사 (별도 API 필요 여부)
4. [ ] Design document 작성 (`us-events.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

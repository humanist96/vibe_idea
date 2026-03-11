# 실시간 알림 시스템 (Notification System) Planning Document

> **Summary**: 주가 목표가, 거래량 급등, 실적 발표 등의 이벤트 발생 시 사용자에게 실시간으로 알림을 전달하는 시스템
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

사용자가 설정한 조건(목표 주가, 거래량 임계값, 실적 발표일)에 도달했을 때 즉시 알림을 받아 투자 의사결정 타이밍을 놓치지 않도록 한다.

### 1.2 Background

현재 watchlist, 섹터, 이벤트 등 다양한 데이터를 제공하지만 사용자가 직접 플랫폼을 방문해야만 변화를 확인할 수 있다. 알림 시스템이 없으면 시간에 민감한 투자 기회를 놓칠 수 있다.

### 1.3 Related Documents

- 기존 API: `app/api/user/notifications/route.ts` (PUT - 알림 배열 저장)
- 의존 기능: Watchlist, Events, Earnings 페이지

---

## 2. Scope

### 2.1 In Scope

- [ ] 알림 규칙 CRUD (목표가/거래량/실적발표 조건 설정)
- [ ] SSE(Server-Sent Events) 또는 폴링 기반 실시간 알림 전달
- [ ] 헤더 알림 센터 (읽지 않은 알림 뱃지 카운트)
- [ ] Watchlist 연동 (보유 종목에 대한 알림 자동 제안)
- [ ] 알림 히스토리 조회 및 읽음 처리

### 2.2 Out of Scope

- 모바일 푸시 알림 (FCM/APNs) - 웹앱 한정
- SMS/이메일 알림 - 다음 이터레이션
- 알림 그룹화/다이제스트 기능

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | AlertRule CRUD: 종목+조건(타입/임계값/활성여부) 등록/수정/삭제 | Must | Pending |
| FR-02 | 목표가 도달 알림: 현재가가 목표가 이상/이하 도달 시 트리거 | Must | Pending |
| FR-03 | 거래량 급등 알림: 평균 대비 N배 초과 시 트리거 | Should | Pending |
| FR-04 | 실적 발표일 알림: D-1, D-day 사전 알림 | Should | Pending |
| FR-05 | 헤더 알림 센터: 미읽음 뱃지, 드롭다운 목록, 전체 읽음 처리 | Must | Pending |
| FR-06 | Watchlist 종목에 대한 알림 규칙 자동 제안 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 알림 지연 < 30초 (폴링 기준) | 로그 타임스탬프 비교 |
| Scalability | 사용자당 최대 50개 알림 규칙 | DB constraint |
| Security | 본인 알림만 조회/수정 가능 | NextAuth session 검증 |

---

## 4. Key Pages / Routes

| Route | Description |
|-------|-------------|
| `/notifications` | 알림 센터 전체 페이지 (히스토리 + 규칙 관리) |
| `/notifications/rules` | 알림 규칙 목록 및 CRUD UI |
| Header component | 알림 뱃지 + 드롭다운 (전역 레이아웃) |

---

## 5. Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/notifications` | 알림 목록 조회 (읽음 여부 필터) |
| PUT | `/api/user/notifications` | 알림 읽음 처리 (기존 endpoint 확장) |
| GET | `/api/user/alert-rules` | 알림 규칙 목록 조회 |
| POST | `/api/user/alert-rules` | 알림 규칙 생성 |
| PUT | `/api/user/alert-rules/[id]` | 알림 규칙 수정 |
| DELETE | `/api/user/alert-rules/[id]` | 알림 규칙 삭제 |
| GET | `/api/notifications/stream` | SSE 스트림 엔드포인트 |
| POST | `/api/cron/check-alerts` | 알림 조건 체크 크론 (서버 내부) |

---

## 6. Data Model Changes (Prisma)

```prisma
model AlertRule {
  id        String   @id @default(cuid())
  userId    String
  ticker    String
  market    String   // "KR" | "US"
  type      String   // "PRICE_ABOVE" | "PRICE_BELOW" | "VOLUME_SPIKE" | "EARNINGS_DATE"
  threshold Float?   // 목표가 또는 배수
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([ticker, market])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  ruleId    String?  // 연결된 AlertRule (nullable: 시스템 알림)
  ticker    String?
  type      String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
}
```

---

## 7. Dependencies on Existing Features

- **Watchlist**: 보유 종목 목록을 알림 규칙 생성 시 자동 제안에 활용
- **Events / Earnings**: 실적 발표 일정 데이터를 알림 트리거 조건으로 활용
- **NextAuth**: 사용자 인증으로 알림 규칙 소유권 검증
- **기존 `api/user/notifications/route.ts`**: 기존 PUT 로직을 읽음 처리로 확장

---

## 8. Success Metrics

- 알림 규칙 생성 후 조건 도달 시 30초 이내 알림 전달
- 알림 기능 사용 사용자의 7일 재방문율 20% 이상 향상
- 알림 규칙 생성 완료율 70% 이상 (생성 시작 → 완료)

---

## 9. Next Steps

1. [ ] Design document 작성 (`notification.design.md`)
2. [ ] SSE vs 폴링 방식 기술 결정
3. [ ] 크론 실행 방식 결정 (Vercel Cron / 외부 스케줄러)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

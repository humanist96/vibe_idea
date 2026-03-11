# 소셜 트레이딩 (Social Trading) Planning Document

> **Summary**: 사용자가 투자 아이디어와 전략을 공유하고, 다른 투자자를 팔로우하며 인사이트를 교환하는 커뮤니티 기능
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

개인 투자자들이 검증된 전략과 아이디어를 공유하고 배울 수 있는 환경을 제공하여 플랫폼의 네트워크 효과를 창출하고 사용자 유지율을 높인다.

### 1.2 Background

플랫폼에 AI 스코어링, 백테스팅, 스크리너 등 강력한 분석 도구가 있지만 사용자 간 지식 공유 채널이 없다. 소셜 레이어 추가로 콘텐츠 생성 비용 없이 플랫폼 가치를 높일 수 있다.

### 1.3 Related Documents

- 의존 기능: Watchlist, Portfolio Tracker, Backtest
- 개인정보 보호: opt-in 방식, 익명화 필수

---

## 2. Scope

### 2.1 In Scope

- [ ] 공개 프로필 (익명화된 포트폴리오 성과 표시)
- [ ] 투자 아이디어 공유 (종목 + 근거 + 목표가 형식)
- [ ] 아이디어 좋아요/댓글 기능
- [ ] 리더보드 (수익률/샤프비율/팔로워 기준)
- [ ] 다른 사용자 팔로우 및 활동 피드
- [ ] 프라이버시 설정 (공개/비공개 opt-in)

### 2.2 Out of Scope

- 카피 트레이딩 (자동 따라 매매) - 규제 이슈로 제외
- 실명 인증 / KYC 기능
- DM(다이렉트 메시지) 기능
- 유료 구독 기반 신호 판매

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 공개 프로필 생성: 닉네임, 수익률 공개 여부 설정 | Must | Pending |
| FR-02 | 아이디어 CRUD: 종목/매수근거/목표가/기간 작성 및 수정/삭제 | Must | Pending |
| FR-03 | 좋아요/댓글: 아이디어에 반응 및 텍스트 댓글 | Must | Pending |
| FR-04 | 팔로우/언팔로우: 사용자 구독 및 활동 피드 | Must | Pending |
| FR-05 | 리더보드: 수익률/샤프비율/팔로워 수 기준 랭킹 | Should | Pending |
| FR-06 | 피드: 팔로우한 사용자의 최신 아이디어 타임라인 | Should | Pending |
| FR-07 | Watchlist를 아이디어로 변환하여 공유 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Privacy | 포트폴리오 공개 시 정확한 수량/금액 노출 금지, 수익률%만 표시 | 코드 리뷰 |
| Moderation | 부적절 콘텐츠 신고 기능 | 신고 수 모니터링 |
| Performance | 피드 로드 < 2초 (최신 20개 아이디어) | 실측 |

---

## 4. Key Pages / Routes

| Route | Description |
|-------|-------------|
| `/social` | 소셜 메인 피드 (팔로우 중인 아이디어) |
| `/social/ideas` | 전체 아이디어 탐색 (필터: 섹터/기간/수익률) |
| `/social/leaderboard` | 리더보드 |
| `/social/ideas/[id]` | 아이디어 상세 (댓글 포함) |
| `/social/ideas/new` | 아이디어 작성 |
| `/profile/[userId]` | 공개 프로필 페이지 |

---

## 5. Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/social/ideas` | 아이디어 목록 (페이지네이션, 필터) |
| POST | `/api/social/ideas` | 아이디어 생성 |
| PUT | `/api/social/ideas/[id]` | 아이디어 수정 |
| DELETE | `/api/social/ideas/[id]` | 아이디어 삭제 |
| POST | `/api/social/ideas/[id]/like` | 좋아요 토글 |
| GET | `/api/social/ideas/[id]/comments` | 댓글 목록 |
| POST | `/api/social/ideas/[id]/comments` | 댓글 작성 |
| DELETE | `/api/social/comments/[id]` | 댓글 삭제 |
| POST | `/api/social/follow/[userId]` | 팔로우/언팔로우 토글 |
| GET | `/api/social/leaderboard` | 리더보드 조회 |
| GET | `/api/social/feed` | 팔로우 피드 |

---

## 6. Data Model Changes (Prisma)

```prisma
model Idea {
  id          String        @id @default(cuid())
  userId      String
  ticker      String
  market      String
  direction   String        // "LONG" | "SHORT"
  title       String
  content     String        @db.Text
  targetPrice Float?
  horizon     String?       // "단기" | "중기" | "장기"
  isPublic    Boolean       @default(true)
  viewCount   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments    IdeaComment[]
  likes       IdeaLike[]

  @@index([userId])
  @@index([ticker, market])
  @@index([createdAt])
}

model IdeaComment {
  id        String   @id @default(cuid())
  ideaId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([ideaId])
}

model IdeaLike {
  ideaId    String
  userId    String
  createdAt DateTime @default(now())
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([ideaId, userId])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User     @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@index([followingId])
}
```

---

## 7. Dependencies on Existing Features

- **NextAuth**: 사용자 인증 및 프로필 기반
- **Portfolio Tracker**: 수익률 데이터를 공개 프로필에 익명화하여 노출
- **Watchlist**: 보유 종목을 아이디어 작성 시 자동 제안
- **Stock Detail**: 아이디어에서 종목 상세 링크 연결

---

## 8. Success Metrics

- 출시 3개월 내 아이디어 공유 참여율 20% 이상 (월간 활성 사용자 기준)
- 아이디어당 평균 좋아요 5개 이상
- 팔로우 기능 사용 사용자의 7일 재방문율 35% 이상

---

## 9. Next Steps

1. [ ] 개인정보 보호 정책 법무 검토 (수익률 공개 범위)
2. [ ] 콘텐츠 모더레이션 정책 수립
3. [ ] Design document 작성 (`social-trading.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

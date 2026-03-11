# 코드 품질 개선 (Code Quality Improvement) Planning Document

> **Summary**: 핵심 모듈(AI, API, 분석 lib)에 대한 테스트 커버리지 80% 달성 및 CI 파이프라인 구축을 통한 코드베이스 안정성 확보
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

신규 기능 추가 및 리팩토링 시 회귀 버그를 방지하고 배포 신뢰도를 높이기 위해 핵심 비즈니스 로직에 테스트 커버리지를 확보하고 CI 파이프라인을 구축한다.

### 1.1 주의사항

이 계획은 사용자 향 기능이 아닌 기술 개선 이니셔티브이다. 사용자에게 직접 노출되는 변경 없이 코드베이스 안정성과 개발 생산성을 향상시키는 것이 목표다.

### 1.2 Background

플랫폼이 빠르게 성장하면서 `lib/ai/`, `lib/api/`, `lib/analysis/` 등 핵심 모듈에 테스트가 없어 변경 시 side effect 파악이 어렵다. AI 응답 파싱, 기술적 분석 계산, API rate limiting 등 버그 발생 시 즉각적인 영향이 큰 모듈이 우선 대상이다.

### 1.3 Related Documents

- 글로벌 테스트 규칙: `~/.claude/rules/testing.md` (80% 커버리지 목표)
- 의존 기능: 모든 기능 (횡단 관심사)

---

## 2. Scope

### 2.1 In Scope

- [ ] Vitest + React Testing Library 설정
- [ ] `lib/ai/` 단위 테스트: scoring, fallback, parse-response, schema
- [ ] `lib/api/` 단위 테스트: rate-limit, validate-ticker, openai 클라이언트
- [ ] `lib/analysis/` 단위 테스트: technical, sentiment, fundamental
- [ ] 핵심 API 라우트 통합 테스트 (watchlist, portfolio, AI score)
- [ ] E2E 테스트: 로그인, watchlist 추가, AI 스코어 조회 (Playwright)
- [ ] GitHub Actions CI 파이프라인 구성

### 2.2 Out of Scope

- UI 컴포넌트 스냅샷 테스트 (1차 범위 외)
- 100% 커버리지 목표 (80%면 충분)
- 성능 테스트 / 부하 테스트
- 외부 API (Finnhub, OpenAI) mock 없이 실제 호출 테스트

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Vitest 설정: `vitest.config.ts`, 커버리지 리포터 구성 | Must | Pending |
| FR-02 | `lib/ai/parse-response` 단위 테스트: 정상/비정상 JSON 파싱 케이스 | Must | Pending |
| FR-03 | `lib/ai/scoring` 단위 테스트: 점수 계산 로직, 경계값 케이스 | Must | Pending |
| FR-04 | `lib/api/rate-limit` 단위 테스트: 요청 제한, 초기화, 동시성 | Must | Pending |
| FR-05 | `lib/analysis/technical` 단위 테스트: MA, RSI, MACD 계산 정확도 | Must | Pending |
| FR-06 | API 라우트 통합 테스트: watchlist CRUD, AI score 엔드포인트 | Should | Pending |
| FR-07 | Playwright E2E: 로그인 → watchlist 추가 → AI 스코어 조회 플로우 | Should | Pending |
| FR-08 | GitHub Actions CI: PR 시 테스트 자동 실행, 커버리지 리포트 | Must | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Coverage | 핵심 모듈(`lib/ai/`, `lib/api/`, `lib/analysis/`) 80% 이상 | Vitest --coverage |
| CI Speed | 전체 테스트 스위트 실행 < 5분 | GitHub Actions 로그 |
| Reliability | 플레이키 테스트 0개 (항상 결정적 결과) | CI 실패율 모니터링 |

---

## 4. Key Pages / Routes

해당 없음 - 기술 개선 이니셔티브, 사용자 향 페이지 변경 없음.

---

## 5. Key API Endpoints

해당 없음 - 기존 API 변경 없음. 테스트 대상 기존 엔드포인트:
- `POST /api/ai/score/[ticker]`
- `GET/POST/DELETE /api/user/watchlist`
- `GET/PUT /api/user/portfolio`

---

## 6. Data Model Changes (Prisma)

없음 - 데이터 모델 변경 없음.

---

## 7. Dependencies on Existing Features

- **모든 핵심 기능**: 테스트 대상 (breaking change 없음)
- **`lib/ai/`**: AI 스코어링, 파싱, fallback 로직
- **`lib/api/`**: rate limiting, ticker 검증, OpenAI 클라이언트
- **`lib/analysis/`**: 기술적/감성/펀더멘털 분석 계산

---

## 8. Priority Test Targets

| Module | Path | Test Focus | Priority |
|--------|------|------------|----------|
| AI 파싱 | `lib/ai/parse-response` | JSON 파싱 실패 케이스, fallback | Must |
| AI 스코어링 | `lib/ai/scoring` | 점수 계산 정확도, 경계값 | Must |
| AI 스키마 | `lib/ai/schema` | Zod 스키마 유효성 검증 | Must |
| Rate Limit | `lib/api/rate-limit` | 제한 로직, TTL 동작 | Must |
| Ticker 검증 | `lib/api/validate-ticker` | 유효/무효 티커 케이스 | Should |
| 기술적 분석 | `lib/analysis/technical` | MA/RSI/MACD 수치 검증 | Must |
| 감성 분석 | `lib/analysis/sentiment` | 점수 범위, 정규화 | Should |
| 펀더멘털 | `lib/analysis/fundamental` | PER/PBR 계산 정확도 | Should |

---

## 9. Success Metrics

- 핵심 모듈 테스트 커버리지 80% 이상 달성
- CI 파이프라인 PR마다 자동 실행 (초록불)
- 테스트 도입 이후 3개월간 회귀 버그 50% 감소
- 전체 테스트 스위트 실행 시간 5분 이내

---

## 10. Next Steps

1. [ ] `lib/ai/`, `lib/api/`, `lib/analysis/` 파일 구조 파악 및 테스트 가능성 평가
2. [ ] Vitest 설정 및 기존 Next.js 15 호환성 확인
3. [ ] 외부 의존성 Mock 전략 수립 (OpenAI, Finnhub)
4. [ ] Design document 작성 (`code-quality.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

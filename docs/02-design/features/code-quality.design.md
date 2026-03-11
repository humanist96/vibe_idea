# code-quality Design Document

> **Summary**: Vitest + Playwright 기반 테스트 인프라 구축 및 핵심 모듈 80% 커버리지 달성, GitHub Actions CI 파이프라인 구성
>
> **Project**: vibe_idea
> **Author**: Product Manager
> **Date**: 2026-03-11
> **Status**: Draft
> **Planning Doc**: [code-quality.plan.md](../../01-plan/features/code-quality.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Vitest 설정 최소화로 기존 Next.js 15 / TypeScript 환경과 호환
- 4단계 점진적 커버리지 확보: 순수 유틸 → 비즈니스 로직 → API 라우트 → E2E
- CI에서 PR마다 테스트 자동 실행 및 커버리지 리포트 코멘트

### 1.2 Design Principles

- 외부 의존성(OpenAI, Finnhub)은 vi.mock으로 격리
- 테스트 파일은 소스와 co-located (`__tests__/` 하위 디렉토리)
- 결정적 테스트만 허용 (플레이키 테스트 0)

---

## 2. Architecture

### 2.1 Test Infrastructure

```
vitest.config.ts          (루트, path aliases, coverage 설정)
playwright.config.ts      (E2E, baseURL, 브라우저 설정)
.github/workflows/
└── ci.yml                (PR 트리거, 4단계 job)

src/
├── lib/ai/__tests__/
│   ├── parse-response.test.ts
│   ├── score-schema.test.ts
│   ├── fallback-scoring.test.ts
│   └── scoring.test.ts
├── lib/api/__tests__/
│   ├── rate-limit.test.ts
│   └── validate-ticker.test.ts
├── lib/analysis/__tests__/
│   ├── technical.test.ts
│   ├── sentiment.test.ts
│   └── fundamental.test.ts
└── app/api/__tests__/
    ├── ai-score.test.ts
    └── us-stocks-ai-score.test.ts

e2e/
├── login.spec.ts
├── watchlist.spec.ts
└── ai-score.spec.ts
```

### 2.2 Mock Strategy

| 의존성 | Mock 방법 |
|--------|-----------|
| OpenAI SDK | `vi.mock("openai")` - 응답 fixture |
| Finnhub fetch | `vi.mock("@/lib/api/finnhub")` |
| Prisma Client | `vi.mock("@/lib/db")` - jest-mock-extended 패턴 |
| NextAuth auth() | `vi.mock("@/auth")` - 세션 fixture |

---

## 3. Configuration

### 3.1 vitest.config.ts

```typescript
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.d.ts", "src/lib/db/**"],
      thresholds: { lines: 80, functions: 80, branches: 75 }
    },
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
```

### 3.2 playwright.config.ts (핵심 설정)

```typescript
export default defineConfig({
  testDir: "./e2e",
  baseURL: "http://localhost:3000",
  use: { trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true }
})
```

---

## 4. Phase-by-Phase Test Targets

### Phase 1: 순수 유틸 (Coverage 목표: 90%+)

| 파일 | 테스트 케이스 | 포인트 |
|------|-------------|--------|
| `lib/ai/parse-response.ts` | 정상 JSON, 코드블록 감싼 JSON, 완전 깨진 응답 | fallback 반환 검증 |
| `lib/ai/score-schema.ts` | 유효 스키마 통과, 누락 필드, 범위 초과 | Zod 에러 메시지 |
| `lib/api/rate-limit.ts` | 허용/차단/TTL 만료/동시 호출 | `checkRateLimit` 반환값 |
| `lib/api/validate-ticker.ts` | 유효 티커, 특수문자, 빈 문자열 | boolean 반환 |

### Phase 2: 비즈니스 로직 (Coverage 목표: 80%+)

| 파일 | 테스트 케이스 | 포인트 |
|------|-------------|--------|
| `lib/ai/fallback-scoring.ts` | 데이터 있음/없음, 경계값 | fallback 점수 범위 0-100 |
| `lib/analysis/technical.ts` | MA(5/20/60), RSI 계산, MACD | 수치 정확도 (고정 fixture) |
| `lib/analysis/sentiment.ts` | 점수 범위, 정규화, 빈 입력 | -1~1 범위 보장 |
| `lib/analysis/fundamental.ts` | PER/PBR/ROE 계산, 0 division | NaN/Infinity 방어 |

### Phase 3: API 라우트 통합 (Coverage 목표: 70%+)

도구: `next-test-api-route-handler` (NTARH)

```typescript
// 예시: src/app/api/__tests__/ai-score.test.ts
import { testApiHandler } from "next-test-api-route-handler"
import * as handler from "@/app/api/ai/score/[ticker]/route"

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "u1" } }) }))

test("POST /api/ai/score/AAPL returns score", async () => {
  await testApiHandler({ appHandler: handler, params: { ticker: "AAPL" },
    test: async ({ fetch }) => {
      const res = await fetch({ method: "POST" })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    }
  })
})
```

대상: `api/ai/score/[ticker]`, `api/us-stocks/ai-score/[ticker]`

### Phase 4: E2E (Playwright)

| 파일 | 시나리오 |
|------|---------|
| `e2e/login.spec.ts` | 로그인 플로우, 미인증 리다이렉트 |
| `e2e/watchlist.spec.ts` | 종목 추가 → 목록 확인 → 삭제 CRUD |
| `e2e/ai-score.spec.ts` | US 종목 상세 → AI 스코어 버튼 → 점수 표시 |

---

## 5. CI Pipeline

### 5.1 .github/workflows/ci.yml 구조

```yaml
name: CI
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  integration:
    needs: unit
    runs-on: ubuntu-latest
    env: { DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}, FINNHUB_API_KEY: mock, OPENAI_API_KEY: mock }
    steps:
      - run: npm run test:integration

  e2e:
    needs: integration
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm run test:e2e
```

### 5.2 package.json 스크립트 추가

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 6. Error Handling in Tests

- 외부 API 오류 시뮬레이션: `vi.fn().mockRejectedValue(new Error("API error"))`
- 타임아웃: Vitest 기본 5초, E2E 30초
- 플레이키 방지: 날짜 의존 로직은 `vi.setSystemTime()` 고정

---

## 7. Implementation Order

1. [ ] `package.json`에 vitest, @vitest/coverage-v8, playwright 의존성 추가
2. [ ] `vitest.config.ts` 작성 (path aliases, coverage 설정)
3. [ ] `src/test/setup.ts` 작성 (전역 mock 설정)
4. [ ] Phase 1: `lib/ai/parse-response`, `lib/ai/score-schema`, `lib/api/rate-limit`, `lib/api/validate-ticker` 테스트 작성
5. [ ] Phase 2: `lib/ai/fallback-scoring`, `lib/analysis/technical`, `lib/analysis/sentiment`, `lib/analysis/fundamental` 테스트 작성
6. [ ] `next-test-api-route-handler` 설치 및 Phase 3 API 라우트 테스트 작성
7. [ ] `playwright.config.ts` 작성
8. [ ] Phase 4 E2E 테스트 작성 (`e2e/` 디렉토리)
9. [ ] `.github/workflows/ci.yml` 작성
10. [ ] GitHub Actions secrets 설정 확인 및 첫 CI 실행 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | Product Manager |

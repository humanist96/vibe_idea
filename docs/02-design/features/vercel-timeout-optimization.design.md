# Vercel Timeout Optimization — Design Document

> **Status**: Ready for Implementation
> **Date**: 2026-03-20
> **Depends on**: strategic-roadmap.plan.md (Phase 1)

---

## 1. 문제 정의

현재 보고서 생성 파이프라인은 Vercel Serverless 60초 타임아웃을 초과한다.

```
POST /api/reports/daily/generate (현재 흐름)
  ├── collectReportData()      [20-30초] 10종목 × 6-8 API
  ├── analyzeReportData()      [40-50초] 10건 GPT 순차 + 3건 GPT 병렬
  ├── buildReportMeta()        [<1초]
  └── prisma.report.upsert()   [<1초]
  총: 60-90초 → 타임아웃 발생
```

**핵심 병목**: `analyzeReportData()` 내 for-loop 순차 호출
- `src/lib/report/analyzer.ts:278-290` — 종목별 `analyzeStockMove()` 직렬 실행 (~4초/건 × 10건 = 40초)
- `src/lib/report/weekly-analyzer.ts:252-262` — 동일 패턴

---

## 2. 해결 전략 (2단계)

### Phase 1-A: AI 분석 병렬화 (즉시 적용)

```
현재 (직렬):     종목1[4s] → 종목2[4s] → ... → 종목10[4s] = 40초
개선 (5건 배치): [종목1|2|3|4|5] → [종목6|7|8|9|10]         = 8-10초
```

**효과**: 분석 시간 40초 → 10초 (75% 단축), 전체 30-40초로 타임아웃 내 완료

### Phase 1-B: 비동기 생성 + Polling (타임아웃 완전 해소)

```
POST /api/reports/daily/generate
  → 즉시 202 Accepted { reportId, status: "pending" }
  → Background: collect → analyze → save
  → Frontend: GET /api/reports/{id}/status (3초 polling)
  → 완료 시: status: "completed" + 보고서 데이터 로딩
```

---

## 3. Schema 변경

```prisma
model Report {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "daily" | "weekly"
  date        String
  tickers     Json
  stockCount  Int
  summary     String   @db.Text
  data        Json
+ status      String   @default("completed")  // "pending" | "collecting" | "analyzing" | "completed" | "failed"
+ progress    Int      @default(100)           // 0-100
+ errorMsg    String?                          // 실패 시 에러 메시지
  generatedAt DateTime @default(now())
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type, date])
  @@index([userId, type])
  @@index([userId, createdAt])
+ @@index([userId, status])
}
```

**기존 데이터 호환**: `status` 기본값 `"completed"`, `progress` 기본값 `100`이므로 기존 레코드 영향 없음.

---

## 4. 상세 설계

### 4.1 AI 병렬화 (`analyzer.ts` / `weekly-analyzer.ts`)

**변경 전** (`analyzer.ts:278-290`):
```typescript
// 순차 호출
for (let i = 0; i < raw.stocks.length; i++) {
  const analysis = await analyzeStockMove(stock, raw.market, raw.date)
  stockAnalyses.push(analysis)
}
```

**변경 후**:
```typescript
const BATCH_SIZE = 5

async function analyzeBatch<T>(
  items: readonly T[],
  fn: (item: T) => Promise<unknown>,
  batchSize: number,
  onBatchComplete?: (completed: number, total: number) => void
): Promise<unknown[]> {
  const results: unknown[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map((item) => fn(item))
    )
    for (const r of batchResults) {
      results.push(r.status === "fulfilled" ? r.value : null)
    }
    onBatchComplete?.(Math.min(i + batchSize, items.length), items.length)
  }
  return results
}

// 사용
const stockAnalyses = await analyzeBatch(
  raw.stocks,
  (stock) => analyzeStockMove(stock, raw.market, raw.date),
  BATCH_SIZE,
  (completed, total) => {
    const pct = 42 + Math.round((completed / total) * 20)
    onProgress?.({ phase: "analyzing", progress: pct, message: `${completed}/${total} 종목 분석 완료` })
  }
)
```

**적용 파일**:
| 파일 | 함수 | 변경 위치 |
|------|------|-----------|
| `src/lib/report/analyzer.ts` | `analyzeReportData()` | L278-290 for-loop → `analyzeBatch()` |
| `src/lib/report/weekly-analyzer.ts` | `analyzeWeeklyData()` | L252-262 for-loop → `analyzeBatch()` |

**`analyzeBatch` 유틸 위치**: `src/lib/report/batch-utils.ts` (새 파일)

### 4.2 비동기 생성 API

#### POST `/api/reports/daily/generate` (변경)

```typescript
// 1) 즉시 pending 레코드 생성
const report = await prisma.report.upsert({
  where: { userId_type_date: { userId, type: "daily", date: today } },
  update: { status: "pending", progress: 0, errorMsg: null },
  create: { userId, type: "daily", date: today, status: "pending", progress: 0, ... },
})

// 2) 202 Accepted 즉시 반환
res.status(202).json({ success: true, reportId: report.id, status: "pending" })

// 3) Background: waitUntil로 생성 진행 (Vercel의 after() 또는 waitUntil())
// 참고: Vercel Serverless에서는 응답 후 background 실행이 제한적
// → 대안: 별도 /api/reports/daily/process 엔드포인트 분리
```

**Vercel 제약 대응 — 2-step API 분리**:

응답 후 background 실행이 안정적이지 않으므로, 프론트엔드가 순차 호출:

```
Step 1: POST /api/reports/daily/generate  → pending 레코드 생성 (< 1초)
Step 2: POST /api/reports/daily/process   → 데이터 수집 + AI 분석 (< 40초)
        ├── collectReportData()  [20-30초]
        ├── analyzeReportData()  [8-10초, 병렬화 적용]
        └── DB update status: "completed"
```

Phase 1-A 병렬화만 적용하면 Step 2가 30-40초로 타임아웃 내 완료 가능.
병렬화만으로 충분하면 2-step 분리 없이 기존 단일 엔드포인트 유지 가능.

#### GET `/api/reports/[reportId]/status` (신규, Phase 1-B용)

```typescript
// 간단한 status/progress 조회
const report = await prisma.report.findFirst({
  where: { id: reportId, userId },
  select: { status: true, progress: true, errorMsg: true },
})
return NextResponse.json({ success: true, ...report })
```

### 4.3 프론트엔드 Polling (Phase 1-B)

`src/app/reports/page.tsx` 보고서 생성 버튼 클릭 시:

```typescript
// 1) generate 호출
const { reportId } = await fetch("/api/reports/daily/generate", { method: "POST", ... }).then(r => r.json())

// 2) polling으로 진행률 추적
const poll = setInterval(async () => {
  const { status, progress } = await fetch(`/api/reports/${reportId}/status`).then(r => r.json())
  setProgress(progress)
  if (status === "completed" || status === "failed") {
    clearInterval(poll)
    if (status === "completed") fetchReportDetail(reportId)
  }
}, 3000)
```

**UI**: 기존 로딩 스켈레톤 → 진행률 바 + 단계 메시지 표시

---

## 5. 구현 순서

### Phase 1-A: AI 병렬화 (즉시, 단독으로 타임아웃 해결 가능)

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | `analyzeBatch` 유틸 생성 | `src/lib/report/batch-utils.ts` (신규) |
| 2 | Daily analyzer 병렬화 적용 | `src/lib/report/analyzer.ts` |
| 3 | Weekly analyzer 병렬화 적용 | `src/lib/report/weekly-analyzer.ts` |
| 4 | 테스트: 10종목 보고서 생성 시간 측정 | 수동 테스트 |

**예상 효과**: 전체 생성 시간 60-90초 → 30-40초 (타임아웃 내)

### Phase 1-B: 비동기 + Polling (병렬화만으로 부족할 경우)

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | Prisma schema에 status/progress/errorMsg 필드 추가 | `prisma/schema.prisma` |
| 2 | DB migration 실행 | `npx prisma db push` |
| 3 | Generate route를 2-step으로 분리 | `src/app/api/reports/daily/generate/route.ts` |
| 4 | Process route 신규 생성 | `src/app/api/reports/daily/process/route.ts` (신규) |
| 5 | Status 조회 API | `src/app/api/reports/[reportId]/status/route.ts` (신규) |
| 6 | 프론트엔드 polling + 진행률 UI | `src/app/reports/page.tsx` |
| 7 | Weekly generate도 동일 적용 | `src/app/api/reports/weekly/generate/route.ts` |

---

## 6. 실행 전략 결정

**권장: Phase 1-A만 우선 적용**

- 병렬화로 분석 시간 40초 → 8-10초 단축
- 전체 30-40초로 Vercel 60초 타임아웃 내 완료
- 코드 변경 최소 (batch-utils.ts 1개 + 기존 2개 파일 수정)
- Phase 1-B는 종목 수 증가 등 추가 최적화 필요 시 적용

---

## 7. 리스크 및 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| OpenAI rate limit (5건 동시) | 낮음 | GPT-4o-mini는 분당 500+ RPM, 5건 동시 문제 없음 |
| 배치 내 1건 실패 | 중간 | `Promise.allSettled` 사용, 실패건만 fallback 분석 적용 |
| 병렬화 후에도 40초 초과 | 낮음 | Phase 1-B (비동기 분리) 즉시 적용 |
| DB 중간 상태 잔류 (pending) | 중간 | 30분 이상 pending인 레코드 자동 failed 처리 (cleanup) |

---

## 8. 성능 목표

| 지표 | 현재 | Phase 1-A 후 | Phase 1-B 후 |
|------|------|-------------|-------------|
| 보고서 생성 시간 | 60-90초 | 30-40초 | 사용자 대기 < 1초 |
| Vercel 타임아웃 | 초과 발생 | 안전 범위 | 완전 해소 |
| 사용자 경험 | 로딩 스피너 | 빠른 로딩 | 진행률 바 |

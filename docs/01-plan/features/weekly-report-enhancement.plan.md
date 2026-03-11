# Plan: 주간 보고서 강화

## 개요
현재 대시보드에 카드 형태로만 존재하는 주간 브리핑을 데일리 보고서 수준의 리치한 전용 페이지로 확장한다.

## 현재 상태
- API: `/api/reports/weekly` — OpenAI로 주간 브리핑 생성 (포트폴리오 기반)
- UI: `WeeklyBriefingCard.tsx` — 대시보드 내장 카드만 존재
- 데이터: 포트폴리오 데이터만 사용, 시장 컨텍스트 부족

## 목표
1. 전용 주간 보고서 페이지 (`/reports/weekly/[date]`) 생성
2. 주간 시장 요약 (주간 지수 변동, 섹터 성과, 매크로 이벤트 요약)
3. 종목별 주간 성과 + 주간 수급 흐름 합산
4. 애널리스트 컨센서스 변화 추적 (주간 목표가 변경 트렌드)
5. 컨빅션 스코어 주간 변동 추이
6. 다음 주 주요 일정 + AI 전망
7. 주간 보고서 히스토리 저장 (최근 12주)

## 구현 범위

### Phase 1: 데이터 수집 & 타입
- `src/lib/report/weekly-types.ts` — 주간 보고서 타입 정의
- `src/lib/report/weekly-collector.ts` — 주간 데이터 수집 (5일 합산)
- 기존 daily collector 재활용하여 5일치 데이터 집계

### Phase 2: AI 분석
- `src/lib/report/weekly-analyzer.ts` — 주간 종합 분석
- `src/lib/report/weekly-prompts.ts` — 주간 분석 프롬프트
- 주간 컨빅션 스코어, 액션 아이템, 리스크 알림 생성

### Phase 3: API
- `/api/reports/weekly/generate` — POST, 주간 보고서 생성
- `/api/reports/weekly/[date]` — GET, 저장된 보고서 조회

### Phase 4: UI
- `src/app/reports/weekly/page.tsx` — 주간 보고서 목록
- `src/app/reports/weekly/[date]/page.tsx` — 주간 보고서 상세
- `src/components/reports/WeeklyReport.tsx` — 메인 컴포넌트
- 서브 컴포넌트: WeeklyMarketSummary, WeeklyStockPerformance, WeeklyConsensusChanges, NextWeekOutlook

### Phase 5: 스토어
- `src/store/weekly-report-history.ts` — Zustand 히스토리 (최근 12주)

## 의존성
- 기존 daily report 인프라 (collector, analyzer, charts)
- naver-consensus API (주간 컨센서스 변화)
- OpenAI GPT-4o-mini

## 예상 파일 수
- 신규: 8~10개
- 수정: 2~3개 (네비게이션 추가)

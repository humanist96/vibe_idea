# Plan: AI 챗봇 고도화

## 개요
기존 AI 투자 상담 챗봇에 포트폴리오 연동, 종목 비교 분석, 보고서 요약, 시나리오 분석 등 고급 기능을 추가한다.

## 현재 상태
- 14개 인텐트 기반 오케스트레이터 (stock_analysis, macro, ranking, themes 등)
- GPT-4o / GPT-4o-mini 모델 선택
- 스트리밍 응답, 세션 히스토리 (20개)
- 워치리스트 연동, 컴플라이언스 필터링
- KR/US 시장 모드 지원

## 목표
1. **포트폴리오 연동 인텐트** — "내 포트폴리오 분석해줘", "내 수익률 보여줘"
2. **종목 비교 인텐트** — "삼성전자 vs SK하이닉스 비교해줘"
3. **보고서 요약 인텐트** — "오늘 데일리 보고서 요약해줘"
4. **시나리오 분석 인텐트** — "금리가 오르면 내 포트폴리오 어떻게 돼?"
5. **컨텍스트 유지 강화** — 이전 대화 맥락 활용 개선
6. **빠른 액션 버튼 확장** — 포트폴리오/비교 관련 퀵 액션 추가

## 구현 범위

### Phase 1: 신규 인텐트 추가
- `src/lib/chat/intents/portfolio-analysis.ts` — 포트폴리오 분석
- `src/lib/chat/intents/stock-comparison.ts` — 종목 비교
- `src/lib/chat/intents/report-summary.ts` — 보고서 요약
- `src/lib/chat/intents/scenario-analysis.ts` — 시나리오 분석

### Phase 2: 오케스트레이터 확장
- `src/lib/chat/orchestrator.ts` 수정 — 4개 인텐트 라우팅 추가
- `src/lib/chat/data-fetcher.ts` 수정 — 포트폴리오/보고서 데이터 페칭

### Phase 3: UI 개선
- `src/components/chat/QuickActions.tsx` 수정 — 새 퀵 액션 버튼
- `src/components/chat/ChatMessage.tsx` 수정 — 비교 테이블, 차트 인라인 렌더링

### Phase 4: 컨텍스트 관리
- 최근 5개 메시지 → 10개로 확장
- 종목 컨텍스트 자동 추적 (대화 중 언급된 종목 기억)

## 의존성
- 기존 chat 인프라 (orchestrator, data-fetcher, compliance)
- portfolio store (Zustand)
- report-history store
- OpenAI GPT-4o

## 예상 파일 수
- 신규: 4~5개
- 수정: 4~5개

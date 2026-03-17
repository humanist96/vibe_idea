/**
 * 컨텍스트 트래커 — 대화 중 언급된 종목을 추적한다.
 *
 * stock-registry를 활용하여 메시지 내 종목명/티커를 감지하고
 * 시스템 프롬프트에 주입할 힌트 문자열을 생성한다.
 */

import {
  ensureLoaded,
  searchStocks,
} from "@/lib/data/stock-registry"
import type { Intent } from "./orchestrator"

// ── Types ──────────────────────────────────────────────────────

export interface ChatContext {
  readonly mentionedTickers: readonly string[]
  readonly lastAnalyzedTicker: string | null
  readonly intentHistory: readonly Intent[]
}

// ── Ticker Extraction ──────────────────────────────────────────

/**
 * 최근 N개 메시지에서 언급된 종목 티커를 추출한다.
 * stock-registry를 활용하여 종목명 -> 티커 매핑.
 */
export async function extractMentionedTickers(
  messages: readonly { readonly role: string; readonly content: string }[],
  limit = 5
): Promise<readonly string[]> {
  await ensureLoaded()

  const tickers = new Set<string>()
  const recentMessages = messages.slice(-10)

  for (const msg of recentMessages) {
    // 6자리 숫자 티커 추출
    const sixDigit = msg.content.match(/\d{6}/g) ?? []
    for (const ticker of sixDigit) {
      tickers.add(ticker)
    }

    // 2~10글자 한글 단어에서 종목명 검색 시도
    const words = msg.content
      .replace(/[?？!！.。,，\s]+/g, " ")
      .trim()
      .split(" ")
      .filter((w) => /^[가-힣A-Z]{2,10}$/.test(w))

    for (const word of words) {
      const results = searchStocks(word)
      if (results.length === 1) {
        tickers.add(results[0].ticker)
      } else if (results.length > 0 && results[0].name === word) {
        tickers.add(results[0].ticker)
      }
    }

    if (tickers.size >= limit) break
  }

  return [...tickers].slice(0, limit)
}

/**
 * 추출된 종목 컨텍스트를 시스템 프롬프트에 주입할 문자열로 변환
 */
export function buildTickerContextHint(
  tickers: readonly string[]
): string {
  if (tickers.length === 0) return ""
  return `\n[대화 맥락: 최근 언급 종목 — ${tickers.join(", ")}]`
}

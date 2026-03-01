import "server-only"

import { fetchDartCorpCodes } from "./dart-zip-client"
import { resolveCorpCode as fallbackResolve } from "@/lib/api/dart-corp-codes"

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
const RETRY_INTERVAL = 10 * 60 * 1000 // 10 min retry on failure

interface RegistryState {
  mapping: Map<string, string>
  loadedAt: number
  failedAt: number
  loading: Promise<void> | null
}

const state: RegistryState = {
  mapping: new Map(),
  loadedAt: 0,
  failedAt: 0,
  loading: null,
}

async function loadFromDart(): Promise<void> {
  const mapping = await fetchDartCorpCodes()

  if (mapping.size > 0) {
    state.mapping = mapping
    state.loadedAt = Date.now()
    state.failedAt = 0
    console.log(`[CorpCode] loaded ${mapping.size} entries from DART ZIP`)
  } else {
    state.failedAt = Date.now()
    console.error("[CorpCode] DART ZIP returned empty mapping, using fallback only")
  }
}

function shouldReload(): boolean {
  const now = Date.now()

  // Successfully loaded and still fresh
  if (state.mapping.size > 0 && now - state.loadedAt < SEVEN_DAYS) {
    return false
  }

  // Failed recently — wait before retrying
  if (state.failedAt > 0 && now - state.failedAt < RETRY_INTERVAL) {
    return false
  }

  return true
}

export async function ensureLoaded(): Promise<void> {
  if (!shouldReload()) return

  if (state.loading) {
    await state.loading
    return
  }

  state.loading = loadFromDart().finally(() => {
    state.loading = null
  })
  await state.loading
}

export function resolve(stockCode: string): string | null {
  // Dynamic mapping from DART ZIP
  const dynamic = state.mapping.get(stockCode)
  if (dynamic) return dynamic

  // Fallback to hardcoded mappings
  return fallbackResolve(stockCode)
}

import "server-only"

import { fetchDartCorpCodes } from "./dart-zip-client"
import { resolveCorpCode as fallbackResolve } from "@/lib/api/dart-corp-codes"

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

interface RegistryState {
  mapping: Map<string, string>
  loadedAt: number
  loading: Promise<void> | null
}

const state: RegistryState = {
  mapping: new Map(),
  loadedAt: 0,
  loading: null,
}

async function loadFromDart(): Promise<void> {
  const mapping = await fetchDartCorpCodes()

  if (mapping.size > 0) {
    state.mapping = mapping
    state.loadedAt = Date.now()
  }
}

export async function ensureLoaded(): Promise<void> {
  const now = Date.now()
  if (state.mapping.size > 0 && now - state.loadedAt < SEVEN_DAYS) {
    return
  }

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

  // Fallback to hardcoded 89 mappings
  return fallbackResolve(stockCode)
}

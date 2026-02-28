"use client"

import { useInsiderPolling } from "@/hooks/use-insider-polling"

export function InsiderPollingProvider() {
  useInsiderPolling()
  return null
}

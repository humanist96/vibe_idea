"use client"

import { useAlertPolling } from "@/hooks/use-insider-polling"

export function InsiderPollingProvider() {
  useAlertPolling()
  return null
}

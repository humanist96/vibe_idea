"use client"

import { SessionProvider } from "next-auth/react"

interface AuthProviderProps {
  readonly children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}

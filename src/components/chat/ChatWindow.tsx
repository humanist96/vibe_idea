"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Bot, RotateCcw, History, Trash2 } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { QuickActions } from "./QuickActions"
import { useWatchlistStore } from "@/store/watchlist"
import { usePortfolioStore } from "@/store/portfolio"
import { useReportHistoryStore } from "@/store/report-history"
import { useChatHistoryStore } from "@/store/chat-history"
import { useMarketMode } from "@/store/market-mode"
import type { ChatMessage as ChatMsg } from "@/store/chat-history"
import type { ReportSummaryPayload } from "@/lib/chat/intents/report-summary"
import { cn } from "@/lib/utils/cn"

interface Message {
  readonly id: string
  readonly role: "user" | "assistant"
  readonly content: string
}

export function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tickers = useWatchlistStore((s) => s.tickers)
  const portfolioItems = usePortfolioStore((s) => s.items)
  const { reports, getReport, fetchReports } = useReportHistoryStore()
  const marketMode = useMarketMode((s) => s.mode)

  useEffect(() => {
    if (reports.length === 0) fetchReports()
  }, [reports.length, fetchReports])
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // 보고서 요약 직렬화 헬퍼
  const getLatestReportSummary = useCallback((): ReportSummaryPayload | null => {
    if (reports.length === 0) return null
    const latest = reports[0]
    const data = getReport(latest.id)
    if (!data) return null
    return {
      meta: latest,
      executiveSummary: data.executiveSummary,
      portfolioInsight: data.portfolioInsight,
      watchPoints: data.watchPoints,
      stockSummaries: data.stockAnalyses.map((a) => ({
        ticker: a.ticker,
        name: data.stocks.find((s) => s.ticker === a.ticker)?.name ?? a.ticker,
        outlook: a.outlook,
        riskLevel: a.riskAlerts[0]?.level ?? "none",
      })),
    }
  }, [reports, getReport])

  const {
    sessions,
    activeSessionId,
    createSession,
    setActiveSession,
    addMessage: addToHistory,
    updateMessage: updateInHistory,
    deleteSession,
    getActiveSession,
  } = useChatHistoryStore()

  // Load messages from active session on mount / session change
  useEffect(() => {
    const session = getActiveSession()
    if (session) {
      setMessages(session.messages.map((m) => ({ ...m })))
    }
  }, [activeSessionId, getActiveSession])

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  const handleSend = useCallback(
    async (message: string) => {
      if (isStreaming) return

      let sessionId = activeSessionId
      if (!sessionId) {
        sessionId = createSession()
      }

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)
      addToHistory(sessionId, userMsg as ChatMsg)
      setIsStreaming(true)

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            watchlistTickers: tickers,
            portfolioItems: [...portfolioItems],
            marketMode,
            latestReportSummary: getLatestReportSummary(),
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const contentType = res.headers.get("content-type")

        // Compliance blocked response (JSON)
        if (contentType?.includes("application/json")) {
          const json = await res.json()
          if (json.blocked) {
            const blockedMsg: Message = {
              id: `blocked-${Date.now()}`,
              role: "assistant",
              content: json.message,
            }
            setMessages((prev) => [...prev, blockedMsg])
            addToHistory(sessionId!, blockedMsg as ChatMsg)
            return
          }
        }

        // Streaming response
        if (!res.body) {
          throw new Error("No response body")
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        const assistantId = `assistant-${Date.now()}`
        let accumulated = ""

        const emptyAssistant: Message = { id: assistantId, role: "assistant", content: "" }
        setMessages((prev) => [...prev, emptyAssistant])
        addToHistory(sessionId!, emptyAssistant as ChatMsg)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          )
        }

        // Save final accumulated content
        updateInHistory(sessionId!, assistantId, accumulated)
      } catch {
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "죄송합니다. 응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        }
        setMessages((prev) => [...prev, errorMsg])
        addToHistory(sessionId!, errorMsg as ChatMsg)
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, messages, tickers, portfolioItems, marketMode, activeSessionId, createSession, addToHistory, updateInHistory, getLatestReportSummary]
  )

  const handleQuickAction = useCallback(
    (message: string) => {
      handleSend(message)
    },
    [handleSend]
  )

  const handleReset = useCallback(() => {
    setMessages([])
    setActiveSession(null)
  }, [setActiveSession])

  const handleLoadSession = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId)
      setShowHistory(false)
    },
    [setActiveSession]
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <EmptyState onQuickAction={handleQuickAction} marketMode={marketMode} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message, i) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={
                  isStreaming &&
                  i === messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}
            {isStreaming &&
              messages[messages.length - 1]?.role === "user" && (
                <ThinkingIndicator />
              )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {!isEmpty && (
            <div className="flex items-center justify-between">
              <QuickActions onSelect={handleQuickAction} marketMode={marketMode} />
              <div className="flex items-center gap-2">
                {sessions.length > 0 && (
                  <button
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    <History size={12} />
                    이전 대화
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <RotateCcw size={12} />
                  새 대화
                </button>
              </div>
            </div>
          )}
          {isEmpty && sessions.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                <History size={12} />
                이전 대화 ({sessions.length})
              </button>
            </div>
          )}

          {/* History panel */}
          {showHistory && (
            <div className="glass-card max-h-48 overflow-y-auto rounded-xl p-2">
              {sessions.slice(0, 20).map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                    session.id === activeSessionId
                      ? "bg-[var(--color-accent-400)]/10"
                      : "hover:bg-[var(--color-surface-50)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleLoadSession(session.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      {new Date(session.updatedAt).toLocaleDateString("ko-KR")} · {session.messages.length}개 메시지
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    className="ml-2 shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-gain)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <ChatInput onSend={handleSend} disabled={isStreaming} />
          <p className="text-center text-[10px] text-[var(--color-text-tertiary)]">
            AI 분석은 투자 참고용이며 투자 권유가 아닙니다. 투자 손실의 책임은
            투자자 본인에게 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  onQuickAction,
  marketMode,
}: {
  readonly onQuickAction: (message: string) => void
  readonly marketMode: "kr" | "us"
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-20 animate-fade-up">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-300)] to-[var(--color-accent-500)] text-white shadow-lg">
        <Bot size={32} />
      </div>
      <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
        InvestHub AI
      </h2>
      <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)]">
        {marketMode === "us"
          ? "미국 주식 시장 AI 투자정보 어시스턴트입니다."
          : "한국 주식 시장 AI 투자정보 어시스턴트입니다."}
        <br />
        종목 분석, 시장 동향, 투자 교육 등을 도와드립니다.
      </p>
      <QuickActions onSelect={onQuickAction} marketMode={marketMode} />
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-up">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-200)] text-[var(--color-text-secondary)]">
        <Bot size={16} />
      </div>
      <div className="glass-card rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--color-accent-400)] animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-[var(--color-accent-400)] animate-pulse [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-[var(--color-accent-400)] animate-pulse [animation-delay:300ms]" />
          <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">
            분석 중...
          </span>
        </div>
      </div>
    </div>
  )
}

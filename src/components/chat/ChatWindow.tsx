"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Bot, RotateCcw } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { QuickActions } from "./QuickActions"
import { useWatchlistStore } from "@/store/watchlist"

interface Message {
  readonly id: string
  readonly role: "user" | "assistant"
  readonly content: string
}

export function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tickers = useWatchlistStore((s) => s.tickers)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  const handleSend = useCallback(
    async (message: string) => {
      if (isStreaming) return

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)
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
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const contentType = res.headers.get("content-type")

        // 컴플라이언스 차단 응답 (JSON)
        if (contentType?.includes("application/json")) {
          const json = await res.json()
          if (json.blocked) {
            setMessages((prev) => [
              ...prev,
              {
                id: `blocked-${Date.now()}`,
                role: "assistant",
                content: json.message,
              },
            ])
            return
          }
        }

        // 스트리밍 응답 처리
        if (!res.body) {
          throw new Error("No response body")
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        const assistantId = `assistant-${Date.now()}`
        let accumulated = ""

        // 빈 assistant 메시지 추가
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ])

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
      } catch (error) {
        console.error("Chat error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "죄송합니다. 응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          },
        ])
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, messages, tickers]
  )

  const handleQuickAction = useCallback(
    (message: string) => {
      handleSend(message)
    },
    [handleSend]
  )

  const handleReset = useCallback(() => {
    setMessages([])
  }, [])

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <EmptyState onQuickAction={handleQuickAction} />
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
              <QuickActions onSelect={handleQuickAction} />
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                <RotateCcw size={12} />
                새 대화
              </button>
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
}: {
  readonly onQuickAction: (message: string) => void
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
        한국 주식 시장 AI 투자정보 어시스턴트입니다.
        <br />
        종목 분석, 시장 동향, 투자 교육 등을 도와드립니다.
      </p>
      <QuickActions onSelect={onQuickAction} />
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

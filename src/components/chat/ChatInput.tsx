"use client"

import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import { SendHorizontal } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ChatInputProps {
  readonly onSend: (message: string) => void
  readonly disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-0)] px-4 py-2 shadow-sm transition-colors focus-within:border-[var(--color-accent-400)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="메시지를 입력하세요..."
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent text-sm leading-relaxed",
          "placeholder:text-[var(--color-text-tertiary)]",
          "focus:outline-none",
          "disabled:opacity-50"
        )}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
          value.trim() && !disabled
            ? "bg-[var(--color-accent-400)] text-white hover:bg-[var(--color-accent-500)]"
            : "text-[var(--color-text-tertiary)]"
        )}
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  )
}

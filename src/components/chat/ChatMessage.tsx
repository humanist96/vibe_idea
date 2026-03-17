"use client"

import { cn } from "@/lib/utils/cn"
import { Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

interface ChatMessageProps {
  readonly role: "user" | "assistant"
  readonly content: string
  readonly isStreaming?: boolean
}

const markdownComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-[var(--color-border-default)]">
      <table className="w-full text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--color-surface-50)]" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : ""
    const isNumeric = /^[+\-\d,.%x]+$/.test(text.trim())
    return (
      <td
        className={cn(
          "border-t border-[var(--color-border-subtle)] px-3 py-2",
          isNumeric ? "text-right font-mono text-xs" : ""
        )}
        {...props}
      >
        {children}
      </td>
    )
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-3 border-l-3 border-[var(--color-accent-400)] bg-[var(--color-surface-50)] px-4 py-2 text-xs text-[var(--color-text-secondary)]"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="rounded bg-[var(--color-surface-100)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent-500)]"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={cn("block text-xs", className)} {...props}>
        {children}
      </code>
    )
  },
  ul: ({ children, ...props }) => (
    <ul className="my-2 ml-4 list-disc space-y-1 text-sm" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-2 ml-4 list-decimal space-y-1 text-sm" {...props}>
      {children}
    </ol>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mt-4 mb-2 text-sm font-bold text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-1.5 text-sm leading-relaxed" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--color-text-primary)]" {...props}>
      {children}
    </strong>
  ),
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-[var(--color-accent-400)] text-white"
            : "bg-[var(--color-surface-200)] text-[var(--color-text-secondary)]"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-[var(--color-accent-400)] text-white rounded-tr-md"
            : "glass-card rounded-tl-md"
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="prose-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-[var(--color-accent-400)]" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

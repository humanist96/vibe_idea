"use client"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body style={{ padding: 40, fontFamily: "monospace", background: "#111", color: "#eee" }}>
        <h1 style={{ color: "#f87171" }}>Client Error</h1>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#222", padding: 16, borderRadius: 8 }}>
          {error.message}
        </pre>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#888", marginTop: 8 }}>
          {error.stack}
        </pre>
      </body>
    </html>
  )
}

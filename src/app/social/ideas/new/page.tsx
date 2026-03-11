import type { Metadata } from "next"
import { IdeaForm } from "@/components/social/IdeaForm"

export const metadata: Metadata = {
  title: "새 아이디어 - InvestHub",
  description: "투자 아이디어를 공유하세요.",
}

export default function NewIdeaPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          새 아이디어
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          투자 아이디어를 공유하세요
        </p>
      </div>

      <IdeaForm />
    </div>
  )
}

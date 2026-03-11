import { Metadata } from "next"
import { USEventsClient } from "@/components/us-stocks/USEventsClient"

export const metadata: Metadata = {
  title: "미국 기업 이벤트 | Vibe Idea",
  description: "미국 기업 실적 발표, IPO 등 주요 이벤트 캘린더",
}

export default function USEventsPage() {
  return <USEventsClient />
}

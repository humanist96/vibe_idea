import { ChatWindow } from "@/components/chat/ChatWindow"

export const metadata = {
  title: "AI 어시스턴트 | InvestHub",
  description: "한국 주식 AI 투자정보 어시스턴트",
}

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatWindow />
    </div>
  )
}

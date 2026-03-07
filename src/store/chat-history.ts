import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ChatMessage {
  readonly id: string
  readonly role: "user" | "assistant"
  readonly content: string
}

export interface ChatSession {
  readonly id: string
  readonly title: string
  readonly messages: readonly ChatMessage[]
  readonly createdAt: number
  readonly updatedAt: number
}

interface ChatHistoryState {
  readonly sessions: readonly ChatSession[]
  readonly activeSessionId: string | null
  createSession: () => string
  setActiveSession: (id: string | null) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, content: string) => void
  deleteSession: (id: string) => void
  clearAll: () => void
  getActiveSession: () => ChatSession | null
}

const MAX_SESSIONS = 50

function generateTitle(messages: readonly ChatMessage[]): string {
  const userMsg = messages.find((m) => m.role === "user")
  if (!userMsg) return "새 대화"
  const text = userMsg.content.slice(0, 40)
  return text.length < userMsg.content.length ? `${text}...` : text
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: () => {
        const id = `chat-${Date.now()}`
        const session: ChatSession = {
          id,
          title: "새 대화",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, MAX_SESSIONS),
          activeSessionId: id,
        }))
        return id
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s
            const messages = [...s.messages, message]
            return {
              ...s,
              messages,
              title: messages.length <= 2 ? generateTitle(messages) : s.title,
              updatedAt: Date.now(),
            }
          }),
        })),

      updateMessage: (sessionId, messageId, content) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m
              ),
              updatedAt: Date.now(),
            }
          }),
        })),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId:
            state.activeSessionId === id ? null : state.activeSessionId,
        })),

      clearAll: () => set({ sessions: [], activeSessionId: null }),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find((s) => s.id === activeSessionId) ?? null
      },
    }),
    {
      name: "korea-stock-ai-chat-history",
    }
  )
)

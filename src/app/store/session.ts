import { create } from 'zustand'
import { ensureSession } from '@/lib/tauri'
import type { SessionInfo, ChatMessage, Problem, Grade, VizPayload } from '@/lib/types'

interface SessionState {
  sessions: Record<string, SessionInfo>
  // Learn-mode message history per session
  messages: Record<string, ChatMessage[]>
  // Practice state per session
  currentProblem: Record<string, Problem | null>
  currentGrade: Record<string, Grade | null>
  problemSetProgress: Record<string, { correct: number; total: number }>
  // Pending viz chip per session
  pendingViz: Record<string, VizPayload | null>
  // Status
  claudeVersion: string | null
  claudeConnected: boolean

  ensureSession(topicId: string): Promise<SessionInfo>
  appendTutorChunk(sessionId: string, chunk: string, done: boolean): void
  appendUserMessage(sessionId: string, content: string): void
  setProblem(sessionId: string, problem: Problem): void
  setGrade(sessionId: string, grade: Grade): void
  clearGrade(sessionId: string): void
  /** Attach a viz chip to the last tutor message in this session. */
  attachVizToLastMessage(sessionId: string, viz: VizPayload): void
  setPendingViz(sessionId: string, viz: VizPayload | null): void
  setClaudeStatus(connected: boolean, version?: string): void
}

function newMessageId() {
  return Math.random().toString(36).slice(2)
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: {},
  messages: {},
  currentProblem: {},
  currentGrade: {},
  problemSetProgress: {},
  pendingViz: {},
  claudeVersion: null,
  claudeConnected: false,

  async ensureSession(topicId) {
    const info = await ensureSession(topicId)
    set((s) => ({
      sessions: { ...s.sessions, [info.id]: info },
      messages: s.messages[info.id] ? s.messages : { ...s.messages, [info.id]: [] },
    }))
    return info
  },

  appendTutorChunk(sessionId, chunk, done) {
    set((s) => {
      const msgs = s.messages[sessionId] ?? []
      const last = msgs[msgs.length - 1]
      if (last?.role === 'tutor' && last.isStreaming) {
        const updated = { ...last, content: last.content + chunk, isStreaming: !done }
        return { messages: { ...s.messages, [sessionId]: [...msgs.slice(0, -1), updated] } }
      }
      const newMsg: ChatMessage = {
        id: newMessageId(),
        role: 'tutor',
        content: chunk,
        isStreaming: !done,
      }
      return { messages: { ...s.messages, [sessionId]: [...msgs, newMsg] } }
    })
  },

  appendUserMessage(sessionId, content) {
    const newMsg: ChatMessage = { id: newMessageId(), role: 'user', content }
    set((s) => ({
      messages: {
        ...s.messages,
        [sessionId]: [...(s.messages[sessionId] ?? []), newMsg],
      },
    }))
  },

  setProblem(sessionId, problem) {
    set((s) => ({ currentProblem: { ...s.currentProblem, [sessionId]: problem } }))
  },

  setGrade(sessionId, grade) {
    set((s) => ({ currentGrade: { ...s.currentGrade, [sessionId]: grade } }))
  },

  clearGrade(sessionId) {
    set((s) => ({ currentGrade: { ...s.currentGrade, [sessionId]: null } }))
  },

  attachVizToLastMessage(sessionId, viz) {
    set((s) => {
      const msgs = s.messages[sessionId] ?? []
      if (msgs.length === 0) return {}
      const lastIdx = msgs.length - 1
      const updated = [...msgs]
      updated[lastIdx] = { ...updated[lastIdx], vizPayload: viz }
      return { messages: { ...s.messages, [sessionId]: updated } }
    })
  },

  setPendingViz(sessionId, viz) {
    set((s) => ({ pendingViz: { ...s.pendingViz, [sessionId]: viz } }))
  },

  setClaudeStatus(connected, version) {
    set({ claudeConnected: connected, claudeVersion: version ?? null })
  },
}))

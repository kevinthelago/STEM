import type { MasteryLevel } from '@/theme'

// ── Curriculum ──────────────────────────────────────────────────────────────

export interface Subject {
  id: string
  title: string
  topicCount: number
  mastery: number // aggregate 0–100
}

export interface Topic {
  id: string
  subjectId: string
  title: string
  prerequisites: string[] // topic ids
  masteryLevel: MasteryLevel
  masteryScore: number // 0–100
  isCapstone: boolean
}

// ── Session ──────────────────────────────────────────────────────────────────

export interface SessionInfo {
  id: string
  topicId: string
  isActive: boolean
  turnCount: number
}

// ── Learn mode ───────────────────────────────────────────────────────────────

export type MessageRole = 'tutor' | 'user'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  isStreaming?: boolean
  vizPayload?: VizPayload
}

export interface VizPayload {
  sessionId: string
  type: string
  params?: Record<string, unknown>
  label: string
}

export interface ExplainCheckPrompt {
  question: string
}

// ── Practice mode ────────────────────────────────────────────────────────────

export type ProblemKind = 'numeric' | 'derived' | 'multistep' | 'proof'
export type Difficulty = 'easy' | 'intermediate' | 'hard'
export type GradeResult = 'correct' | 'partial' | 'wrong'

export interface Problem {
  id: string
  sessionId: string
  topicId: string
  kind: ProblemKind
  difficulty: Difficulty
  statement: string
  hint?: string
}

export interface Grade {
  sessionId: string
  problemId: string
  result: GradeResult
  submittedAnswer: string
  whereWrong?: string
  hint?: string
  hintLevel: number
  maxHints: number
  solution?: string
  masteryDelta?: number
}

export interface MasteryUpdate {
  topicId: string
  score: number
  level: MasteryLevel
  delta: number
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  topicId: string | null
  content: string
  createdAt: number
  updatedAt: number
}

export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>

// ── Settings ─────────────────────────────────────────────────────────────────

export interface MasteryWeights {
  problemAccuracy: number
  explainGrade: number
  capstone: number
  retention: number
}

export interface AppSettings {
  claudePath: string
  masteryWeights: MasteryWeights
  dataDir: string
  theme: 'dark'
}

export interface ClaudeProbeResult {
  found: boolean
  path: string | null
  version: string | null
}

// ── Review / spaced rep ──────────────────────────────────────────────────────

export interface ReviewItem {
  topicId: string
  topicTitle: string
  subjectTitle: string
  dueAt: number
  lastScore: number
}

// ── Navigation / app state ───────────────────────────────────────────────────

export type AppMode = 'learn' | 'practice' | 'visualize' | 'research'

export type ActiveView =
  | { type: 'mode'; mode: AppMode; topicId: string; subjectId: string }
  | { type: 'notes'; topicId?: string }
  | { type: 'dashboard' }
  | { type: 'review' }
  | { type: 'settings' }

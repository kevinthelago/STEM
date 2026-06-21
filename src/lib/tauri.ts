/**
 * Typed wrappers around Tauri commands and events.
 * The frontend only calls these; Rust handles all actual work.
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type {
  Subject,
  Topic,
  SessionInfo,
  Problem,
  Grade,
  MasteryUpdate,
  VizPayload,
  Note,
  NoteInput,
  AppSettings,
  ClaudeProbeResult,
  ReviewItem,
  Difficulty,
} from './types'

// ── Curriculum ────────────────────────────────────────────────────────────────

export function listSubjects(): Promise<Subject[]> {
  return invoke('list_subjects')
}

export function listTopics(subjectId: string): Promise<Topic[]> {
  return invoke('list_topics', { subjectId })
}

// ── Session ───────────────────────────────────────────────────────────────────

export function ensureSession(topicId: string): Promise<SessionInfo> {
  return invoke('ensure_session', { topicId })
}

// ── Learn ─────────────────────────────────────────────────────────────────────

export function sendLearnMessage(sessionId: string, message: string): Promise<void> {
  return invoke('send_learn_message', { sessionId, message })
}

export function requestExplainCheck(sessionId: string): Promise<void> {
  return invoke('request_explain_check', { sessionId })
}

export function submitExplainAnswer(sessionId: string, explanation: string): Promise<void> {
  return invoke('submit_explain_answer', { sessionId, explanation })
}

// ── Practice ──────────────────────────────────────────────────────────────────

export function generateProblem(sessionId: string, difficulty: Difficulty): Promise<void> {
  return invoke('generate_problem', { sessionId, difficulty })
}

export function submitAnswer(sessionId: string, problemId: string, answer: string): Promise<void> {
  return invoke('submit_answer', { sessionId, problemId, answer })
}

export function requestHint(sessionId: string, problemId: string): Promise<void> {
  return invoke('request_hint', { sessionId, problemId })
}

export function revealSolution(sessionId: string, problemId: string): Promise<void> {
  return invoke('reveal_solution', { sessionId, problemId })
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export function getNotes(topicId: string | null): Promise<Note[]> {
  return invoke('get_notes', { topicId })
}

export function saveNote(note: NoteInput): Promise<Note> {
  return invoke('save_note', { note })
}

export function deleteNote(noteId: string): Promise<void> {
  return invoke('delete_note', { noteId })
}

export function searchNotes(query: string): Promise<Note[]> {
  return invoke('search_notes', { query })
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): Promise<AppSettings> {
  return invoke('get_settings')
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return invoke('save_settings', { settings })
}

export function claudeProbe(): Promise<ClaudeProbeResult> {
  return invoke('claude_probe')
}

// ── Review ────────────────────────────────────────────────────────────────────

export function getReviewDue(): Promise<ReviewItem[]> {
  return invoke('get_review_due')
}

// ── PTY history ───────────────────────────────────────────────────────────────

export function getPtyHistory(sessionId: string): Promise<string> {
  return invoke('get_pty_history', { sessionId })
}

// ── Events ────────────────────────────────────────────────────────────────────

export type PtyOutputPayload = { sessionId: string; data: string }
export type TutorChunkPayload = { sessionId: string; chunk: string; done: boolean }

export function onPtyOutput(
  handler: (payload: PtyOutputPayload) => void,
): Promise<() => void> {
  return listen<PtyOutputPayload>('pty-output', (e) => handler(e.payload))
}

export function onTutorChunk(
  handler: (payload: TutorChunkPayload) => void,
): Promise<() => void> {
  return listen<TutorChunkPayload>('tutor-chunk', (e) => handler(e.payload))
}

export function onParsedProblem(
  handler: (problem: Problem) => void,
): Promise<() => void> {
  return listen<Problem>('parsed-problem', (e) => handler(e.payload))
}

export function onParsedGrade(
  handler: (grade: Grade) => void,
): Promise<() => void> {
  return listen<Grade>('parsed-grade', (e) => handler(e.payload))
}

export function onParsedMastery(
  handler: (update: MasteryUpdate) => void,
): Promise<() => void> {
  return listen<MasteryUpdate>('parsed-mastery', (e) => handler(e.payload))
}

export function onParsedViz(
  handler: (viz: VizPayload) => void,
): Promise<() => void> {
  return listen<VizPayload>('parsed-viz', (e) => handler(e.payload))
}

import { create } from 'zustand'
import { listSubjects, listTopics } from '@/lib/tauri'
import type { Subject, Topic } from '@/lib/types'

interface CurriculumState {
  subjects: Subject[]
  topicsBySubject: Record<string, Topic[]>
  expandedSubjects: Set<string>
  activeTopicId: string | null
  loading: boolean
  error: string | null

  load(): Promise<void>
  loadTopics(subjectId: string): Promise<void>
  toggleSubject(subjectId: string): void
  setActiveTopic(topicId: string | null): void
  updateTopicMastery(topicId: string, score: number): void
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  subjects: [],
  topicsBySubject: {},
  expandedSubjects: new Set(),
  activeTopicId: null,
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const subjects = await listSubjects()
      set({ subjects, loading: false })
      // expand first subject by default
      if (subjects.length > 0) {
        const first = subjects[0]
        set({ expandedSubjects: new Set([first.id]) })
        await get().loadTopics(first.id)
      }
    } catch (err) {
      set({ error: String(err), loading: false })
    }
  },

  async loadTopics(subjectId) {
    try {
      const topics = await listTopics(subjectId)
      set((s) => ({
        topicsBySubject: { ...s.topicsBySubject, [subjectId]: topics },
      }))
    } catch (err) {
      console.error('Failed to load topics for', subjectId, err)
    }
  },

  toggleSubject(subjectId) {
    set((s) => {
      const next = new Set(s.expandedSubjects)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        next.add(subjectId)
        // load topics on expand if not loaded
        if (!s.topicsBySubject[subjectId]) {
          get().loadTopics(subjectId)
        }
      }
      return { expandedSubjects: next }
    })
  },

  setActiveTopic(topicId) {
    set({ activeTopicId: topicId })
  },

  updateTopicMastery(topicId, score) {
    set((s) => {
      const updated: Record<string, Topic[]> = {}
      for (const [sid, topics] of Object.entries(s.topicsBySubject)) {
        updated[sid] = topics.map((t) => {
          if (t.id !== topicId) return t
          const level =
            score >= 85 ? 'mastered' : score >= 60 ? 'proficient' : score > 0 ? 'learning' : 'unstarted'
          return { ...t, masteryScore: score, masteryLevel: level }
        })
      }
      return { topicsBySubject: updated }
    })
  },
}))

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCurriculumStore } from './curriculum'
import * as tauri from '@/lib/tauri'
import type { Subject, Topic } from '@/lib/types'

const MOCK_SUBJECTS: Subject[] = [
  { id: 'linalg', title: 'Linear Algebra', topicCount: 8, mastery: 61 },
  { id: 'calculus', title: 'Calculus', topicCount: 5, mastery: 23 },
]

const MOCK_TOPICS: Topic[] = [
  {
    id: 'linalg/vectors',
    subjectId: 'linalg',
    title: 'Vectors & Spaces',
    prerequisites: [],
    masteryLevel: 'mastered',
    masteryScore: 92,
    isCapstone: false,
  },
  {
    id: 'linalg/eigenvectors',
    subjectId: 'linalg',
    title: 'Eigenvectors & Eigenvalues',
    prerequisites: ['linalg/matrix-transforms'],
    masteryLevel: 'learning',
    masteryScore: 41,
    isCapstone: false,
  },
]

describe('useCurriculumStore', () => {
  beforeEach(() => {
    useCurriculumStore.setState({
      subjects: [],
      topicsBySubject: {},
      expandedSubjects: new Set(),
      activeTopicId: null,
      loading: false,
      error: null,
    })
    vi.resetAllMocks()
  })

  it('loads subjects and expands the first one', async () => {
    vi.spyOn(tauri, 'listSubjects').mockResolvedValue(MOCK_SUBJECTS)
    vi.spyOn(tauri, 'listTopics').mockResolvedValue(MOCK_TOPICS)

    await useCurriculumStore.getState().load()

    const state = useCurriculumStore.getState()
    expect(state.subjects).toHaveLength(2)
    expect(state.expandedSubjects.has('linalg')).toBe(true)
    expect(state.topicsBySubject['linalg']).toHaveLength(2)
  })

  it('toggleSubject collapses an expanded subject', async () => {
    useCurriculumStore.setState({
      subjects: MOCK_SUBJECTS,
      topicsBySubject: { linalg: MOCK_TOPICS },
      expandedSubjects: new Set(['linalg']),
      activeTopicId: null,
      loading: false,
      error: null,
    })

    useCurriculumStore.getState().toggleSubject('linalg')
    expect(useCurriculumStore.getState().expandedSubjects.has('linalg')).toBe(false)
  })

  it('setActiveTopic updates the active topic id', () => {
    useCurriculumStore.setState({
      subjects: MOCK_SUBJECTS,
      topicsBySubject: { linalg: MOCK_TOPICS },
      expandedSubjects: new Set(),
      activeTopicId: null,
      loading: false,
      error: null,
    })

    useCurriculumStore.getState().setActiveTopic('linalg/eigenvectors')
    expect(useCurriculumStore.getState().activeTopicId).toBe('linalg/eigenvectors')
  })

  it('updateTopicMastery recalculates mastery level', () => {
    useCurriculumStore.setState({
      subjects: MOCK_SUBJECTS,
      topicsBySubject: { linalg: MOCK_TOPICS },
      expandedSubjects: new Set(),
      activeTopicId: null,
      loading: false,
      error: null,
    })

    useCurriculumStore.getState().updateTopicMastery('linalg/eigenvectors', 90)
    const updated = useCurriculumStore
      .getState()
      .topicsBySubject['linalg']!.find((t) => t.id === 'linalg/eigenvectors')!
    expect(updated.masteryScore).toBe(90)
    expect(updated.masteryLevel).toBe('mastered')
  })
})

import { describe, it, expect } from 'vitest'
import type { Topic, Problem, Grade, AppSettings } from './types'
import type { MasteryLevel } from '@/theme'

describe('types', () => {
  it('Topic has required mastery fields', () => {
    const topic: Topic = {
      id: 'linalg/eigenvectors',
      subjectId: 'linalg',
      title: 'Eigenvectors & Eigenvalues',
      prerequisites: ['linalg/matrix-transforms'],
      masteryLevel: 'learning',
      masteryScore: 41,
      isCapstone: false,
    }
    expect(topic.masteryLevel).toBe('learning')
    expect(topic.masteryScore).toBe(41)
  })

  it('Problem has all required fields', () => {
    const problem: Problem = {
      id: 'prob-1',
      sessionId: 'sess-1',
      topicId: 'linalg/eigenvectors',
      kind: 'numeric',
      difficulty: 'intermediate',
      statement: 'Find $\\lambda$ for $A$.',
    }
    expect(problem.kind).toBe('numeric')
  })

  it('Grade result is one of correct/partial/wrong', () => {
    const grade: Grade = {
      sessionId: 'sess-1',
      problemId: 'prob-1',
      result: 'wrong',
      submittedAnswer: '2',
      whereWrong: 'That is a diagonal entry, not an eigenvalue.',
      hintLevel: 1,
      maxHints: 3,
    }
    expect(grade.result).toBe('wrong')
    expect(grade.hintLevel).toBe(1)
  })

  it('MasteryLevel covers all four states', () => {
    const levels: MasteryLevel[] = ['unstarted', 'learning', 'proficient', 'mastered']
    expect(levels).toHaveLength(4)
  })

  it('AppSettings has correct defaults shape', () => {
    const settings: AppSettings = {
      claudePath: '/usr/local/bin/claude',
      masteryWeights: {
        problemAccuracy: 0.4,
        explainGrade: 0.3,
        capstone: 0.2,
        retention: 0.1,
      },
      dataDir: '~/.stem',
      theme: 'dark',
    }
    const total = Object.values(settings.masteryWeights).reduce((s, v) => s + v, 0)
    expect(Math.abs(total - 1.0)).toBeLessThan(0.001)
  })
})

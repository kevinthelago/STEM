import { useEffect, useState } from 'react'
import { surface, border, accent, text, font } from '@/theme'
import { useSessionStore, useCurriculumStore } from '@/app/store'
import { generateProblem } from '@/lib/tauri'
import { ProblemCard } from './ProblemCard'
import { GradePanel } from './GradePanel'
import type { Difficulty } from '@/lib/types'

const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'hard']

interface PracticeModeProps {
  topicId: string
}

export function PracticeMode({ topicId }: PracticeModeProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [generating, setGenerating] = useState(false)
  const [attemptNum, setAttemptNum] = useState(1)
  const [problemNum, setProblemNum] = useState(1)

  const { ensureSession, currentProblem, currentGrade, clearGrade } = useSessionStore()
  const { topicsBySubject } = useCurriculumStore()

  const topic = Object.values(topicsBySubject).flat().find((t) => t.id === topicId)

  useEffect(() => {
    ensureSession(topicId).then((s) => {
      setSessionId(s.id)
    })
  }, [topicId, ensureSession])

  const problem = sessionId ? currentProblem[sessionId] : null
  const grade = sessionId ? currentGrade[sessionId] : null
  async function handleGenerate() {
    if (!sessionId) return
    setGenerating(true)
    clearGrade(sessionId)
    try {
      await generateProblem(sessionId, difficulty)
      setProblemNum((n) => n + 1)
      setAttemptNum(1)
    } finally {
      setGenerating(false)
    }
  }

  function handleTryAgain() {
    if (!sessionId) return
    clearGrade(sessionId)
    setAttemptNum((n) => n + 1)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: surface.panel }}>
      {/* Mode header */}
      <div
        style={{
          height: '54px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 28px',
          borderBottom: `1px solid ${surface.raised}`,
        }}
      >
        <span style={{ fontSize: '14.5px', fontWeight: 600, color: text.primary }}>
          {topic?.title ?? topicId}
        </span>
        {grade?.masteryDelta !== undefined && (
          <span style={{ fontSize: '11px', color: grade.masteryDelta >= 0 ? '#43b888' : '#e0625f' }}>
            {grade.masteryDelta >= 0 ? '▲' : '▼'} {Math.abs(grade.masteryDelta)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11.5px', color: text.dimmed }}>
          Problem {problemNum} · attempt {attemptNum}
        </span>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            fontFamily: font.mono,
            fontSize: '11px',
            color: text.placeholder,
            padding: '4px 9px',
            border: `1px solid ${border.subtle}`,
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          ⌘N new problem
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Difficulty selector */}
          {!problem && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                paddingTop: '40px',
              }}
            >
              <span style={{ fontSize: '13px', color: text.placeholder }}>
                Choose difficulty and generate a problem
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: font.ui,
                      cursor: 'pointer',
                      background: difficulty === d ? accent.tint : surface.raised,
                      border: difficulty === d ? `1px solid ${accent.border}` : `1px solid ${border.subtle}`,
                      color: difficulty === d ? accent.text : text.muted,
                      fontWeight: difficulty === d ? 600 : 400,
                      transition: 'all 0.1s',
                    }}
                  >
                    {d[0].toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !sessionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 24px',
                  height: '44px',
                  borderRadius: '9px',
                  background: accent.primary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: surface.panel,
                  fontFamily: font.ui,
                  opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? 'Generating…' : 'Generate problem'}
              </button>
            </div>
          )}

          {/* Problem card */}
          {problem && sessionId && (
            <ProblemCard
              problem={problem}
              sessionId={sessionId}
              answered={!!grade}
              gradeResult={grade?.result}
            />
          )}

          {/* Grade panel */}
          {grade && sessionId && (
            <GradePanel
              grade={grade}
              onTryAgain={handleTryAgain}
              onNextProblem={handleGenerate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { surface, border, accent, text, font, grade as gradeColors } from '@/theme'
import { Button } from '@/lib/components/Button'
import { submitAnswer } from '@/lib/tauri'
import type { Problem, GradeResult } from '@/lib/types'

interface ProblemCardProps {
  problem: Problem
  sessionId: string
  answered: boolean
  gradeResult?: GradeResult
}

const DIFFICULTY_DOTS: Record<string, number> = { easy: 1, intermediate: 2, hard: 3 }
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#43b888',
  intermediate: '#d2934a',
  hard: '#e0625f',
}

export function ProblemCard({ problem, sessionId, answered, gradeResult }: ProblemCardProps) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    try {
      await submitAnswer(sessionId, problem.id, answer)
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const difficultyDots = DIFFICULTY_DOTS[problem.difficulty] ?? 1
  const difficultyColor = DIFFICULTY_COLOR[problem.difficulty] ?? '#9aa0ad'

  const borderColor = gradeResult
    ? gradeResult === 'correct'
      ? gradeColors.correct
      : gradeResult === 'partial'
        ? gradeColors.partial
        : gradeColors.wrong
    : border.outer

  return (
    <div
      style={{
        background: '#15171d',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          borderBottom: `1px solid #20232b`,
          background: '#16181e',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accent.primary,
            fontWeight: 600,
          }}
        >
          {problem.kind}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: i <= difficultyDots ? difficultyColor : 'transparent',
                border: i <= difficultyDots ? 'none' : `1px solid #3a3e48`,
              }}
            />
          ))}
          <span style={{ fontSize: '11px', color: text.muted, marginLeft: '3px' }}>
            {problem.difficulty[0].toUpperCase() + problem.difficulty.slice(1)}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: font.mono, fontSize: '11px', color: text.placeholder }}>
          {problem.topicId}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '22px 20px' }}>
        <div
          style={{ fontSize: '15px', lineHeight: 1.7, color: '#d7dae2', marginBottom: '18px' }}
        >
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {problem.statement}
          </ReactMarkdown>
        </div>

        {/* Answer input */}
        {!answered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: surface.panel,
                border: `1.5px solid ${border.subtle}`,
                borderRadius: '9px',
                padding: '0 14px',
                height: '46px',
                minWidth: '200px',
              }}
            >
              <span style={{ fontFamily: font.mono, fontSize: '11px', color: text.disabled }}>
                ans =
              </span>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="…"
                style={{
                  flex: 1,
                  fontFamily: font.mono,
                  fontSize: '18px',
                  color: text.primary,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              style={{ height: '46px', borderRadius: '9px' }}
            >
              Submit
              <span style={{ fontFamily: font.mono, fontSize: '10px', color: 'rgba(14,15,19,0.6)' }}>
                ⌘↵
              </span>
            </Button>
            <span style={{ fontSize: '12px', color: text.placeholder }}>
              exact value or to 3 d.p.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

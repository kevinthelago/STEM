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
  /** The answer that was submitted (used to highlight the correct/wrong choice row). */
  submittedAnswer?: string
}

const DIFFICULTY_DOTS: Record<string, number> = { easy: 1, intermediate: 2, hard: 3 }
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#43b888',
  intermediate: '#d2934a',
  hard: '#e0625f',
}

// Parse "A) …\nB) …\nC) …\nD) …" blocks from a markdown statement.
// Returns options array if found, otherwise null (treat as non-choice).
function parseChoiceOptions(statement: string): { label: string; text: string }[] | null {
  const lines = statement.split('\n')
  const opts: { label: string; text: string }[] = []
  for (const line of lines) {
    const m = line.match(/^([A-D])\)\s+(.+)$/)
    if (m) opts.push({ label: m[1], text: m[2] })
  }
  return opts.length >= 2 ? opts : null
}

// Statement without the option lines (for prose display above the choices).
function statementProse(statement: string): string {
  return statement
    .split('\n')
    .filter((l) => !/^[A-D]\)\s+/.test(l))
    .join('\n')
    .trim()
}

export function ProblemCard({ problem, sessionId, answered, gradeResult, submittedAnswer }: ProblemCardProps) {
  const difficultyDots = DIFFICULTY_DOTS[problem.difficulty] ?? 1
  const difficultyColor = DIFFICULTY_COLOR[problem.difficulty] ?? '#9aa0ad'

  const borderColor = gradeResult
    ? gradeResult === 'correct'
      ? gradeColors.correct
      : gradeResult === 'partial'
        ? gradeColors.partial
        : gradeColors.wrong
    : border.outer

  // Route to the right card body based on kind
  const isMultiChoice =
    problem.kind === 'derived' && parseChoiceOptions(problem.statement) !== null
  const isCode = problem.kind === 'multistep'

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
        {isMultiChoice ? (
          <MultiChoiceBody
            problem={problem}
            sessionId={sessionId}
            answered={answered}
            gradeResult={gradeResult}
            submittedAnswer={submittedAnswer}
          />
        ) : isCode ? (
          <CodeBody
            problem={problem}
            sessionId={sessionId}
            answered={answered}
            gradeResult={gradeResult}
          />
        ) : (
          <NumericBody
            problem={problem}
            sessionId={sessionId}
            answered={answered}
            gradeResult={gradeResult}
          />
        )}
      </div>
    </div>
  )
}

// ── Numeric card ─────────────────────────────────────────────────────────────

function NumericBody({
  problem,
  sessionId,
  answered,
  gradeResult,
}: {
  problem: Problem
  sessionId: string
  answered: boolean
  gradeResult?: GradeResult
}) {
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

  return (
    <>
      <div
        style={{ fontSize: '15px', lineHeight: 1.7, color: '#d7dae2', marginBottom: '18px' }}
      >
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {problem.statement}
        </ReactMarkdown>
      </div>

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

      {answered && gradeResult === 'correct' && (
        <div style={{ fontSize: '13px', color: gradeColors.correct }}>✓ correct</div>
      )}
    </>
  )
}

// ── Multiple-choice card ──────────────────────────────────────────────────────

function MultiChoiceBody({
  problem,
  sessionId,
  answered,
  gradeResult,
  submittedAnswer,
}: {
  problem: Problem
  sessionId: string
  answered: boolean
  gradeResult?: GradeResult
  submittedAnswer?: string
}) {
  const [selected, setSelected] = useState<string | null>(submittedAnswer ?? null)
  const [submitting, setSubmitting] = useState(false)

  const options = parseChoiceOptions(problem.statement) ?? []
  const prose = statementProse(problem.statement)

  async function handleSelect(label: string) {
    if (answered || submitting) return
    setSelected(label)
  }

  async function handleSubmit() {
    if (!selected || submitting || answered) return
    setSubmitting(true)
    try {
      await submitAnswer(sessionId, problem.id, selected)
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

  return (
    <div onKeyDown={handleKeyDown}>
      {prose && (
        <div
          style={{ fontSize: '15px', lineHeight: 1.7, color: '#d7dae2', marginBottom: '18px' }}
        >
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {prose}
          </ReactMarkdown>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {options.map((opt) => {
          const isSelected = selected === opt.label
          const isCorrect = answered && gradeResult === 'correct' && isSelected
          const isWrong = answered && gradeResult === 'wrong' && isSelected

          let borderCol = border.subtle
          if (isCorrect) borderCol = gradeColors.correct
          else if (isWrong) borderCol = gradeColors.wrong
          else if (isSelected && !answered) borderCol = accent.border

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                background: isCorrect
                  ? gradeColors.correctBg
                  : isWrong
                    ? gradeColors.wrongBg
                    : isSelected
                      ? accent.tint
                      : surface.raised,
                border: `1.5px solid ${borderCol}`,
                borderRadius: '8px',
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  flexShrink: 0,
                  borderRadius: '5px',
                  background: isSelected ? (isCorrect ? gradeColors.correct : isWrong ? gradeColors.wrong : accent.primary) : surface.panel,
                  border: isSelected ? 'none' : `1px solid ${border.subtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: font.mono,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isSelected ? '#0e0f13' : text.muted,
                }}
              >
                {opt.label}
              </span>
              <span style={{ fontSize: '14px', lineHeight: 1.5, color: text.secondary, flex: 1 }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {opt.text}
                </ReactMarkdown>
              </span>
              {isCorrect && (
                <span
                  style={{
                    fontSize: '11.5px',
                    color: gradeColors.correct,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ✓ correct
                </span>
              )}
            </button>
          )
        })}
      </div>

      {!answered && (
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!selected || submitting}
          style={{ height: '42px', borderRadius: '9px' }}
        >
          Submit answer
          <span style={{ fontFamily: font.mono, fontSize: '10px', color: 'rgba(14,15,19,0.6)' }}>
            ⌘↵
          </span>
        </Button>
      )}
    </div>
  )
}

// ── Code card ─────────────────────────────────────────────────────────────────

function CodeBody({
  problem,
  sessionId,
  answered,
  gradeResult,
}: {
  problem: Problem
  sessionId: string
  answered: boolean
  gradeResult?: GradeResult
}) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const lineCount = code ? code.split('\n').length : 1

  async function handleRun() {
    if (!code.trim() || submitting || answered) return
    setSubmitting(true)
    try {
      await submitAnswer(sessionId, problem.id, code)
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
    // Allow tab to insert spaces instead of focusing next element
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const next = code.slice(0, start) + '    ' + code.slice(end)
      setCode(next)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4
      })
    }
  }

  return (
    <>
      <div
        style={{ fontSize: '15px', lineHeight: 1.7, color: '#d7dae2', marginBottom: '18px' }}
      >
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {problem.statement}
        </ReactMarkdown>
      </div>

      {/* Code editor */}
      <div
        style={{
          background: surface.canvas,
          border: `1.5px solid ${answered && gradeResult === 'correct' ? gradeColors.correct : answered && gradeResult === 'wrong' ? gradeColors.wrong : border.card}`,
          borderRadius: '9px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}
      >
        {/* Editor toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            borderBottom: `1px solid #1e2027`,
            background: '#0e0f13',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: text.placeholder,
            }}
          >
            python
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: font.mono, fontSize: '10px', color: text.disabled }}>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {/* Editor area */}
        <div style={{ display: 'flex' }}>
          {/* Line numbers */}
          <div
            style={{
              padding: '14px 10px',
              background: '#0a0b0e',
              borderRight: `1px solid #1a1c22`,
              userSelect: 'none',
              fontFamily: font.mono,
              fontSize: '12px',
              color: text.disabled,
              lineHeight: 1.7,
              minWidth: '36px',
              textAlign: 'right',
            }}
          >
            {Array.from({ length: Math.max(lineCount, 4) }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="# Write your solution here…"
            spellCheck={false}
            disabled={answered}
            style={{
              flex: 1,
              padding: '14px 14px',
              fontFamily: font.mono,
              fontSize: '13px',
              color: '#c9cdd8',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.7,
              minHeight: `${Math.max(lineCount, 4) * 22}px`,
            }}
          />
        </div>
      </div>

      {!answered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="primary"
            onClick={handleRun}
            disabled={!code.trim() || submitting}
            style={{ height: '42px', borderRadius: '9px' }}
          >
            {submitting ? 'Running…' : 'Run & grade'}
            <span style={{ fontFamily: font.mono, fontSize: '10px', color: 'rgba(14,15,19,0.6)' }}>
              ⌘↵
            </span>
          </Button>
        </div>
      )}

      {answered && gradeResult === 'correct' && (
        <div style={{ fontSize: '13px', color: gradeColors.correct }}>✓ all tests passed</div>
      )}
    </>
  )
}

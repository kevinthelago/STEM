import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { surface, border, text, font, grade as gradeColors } from '@/theme'
import { Button } from '@/lib/components/Button'
import type { Grade } from '@/lib/types'

interface GradePanelProps {
  grade: Grade
  onTryAgain(): void
  onNextProblem(): void
  onRevealSolution?(): void
  onRequestHint?(): void
}

export function GradePanel({ grade, onTryAgain, onNextProblem, onRevealSolution, onRequestHint }: GradePanelProps) {
  const isCorrect = grade.result === 'correct'
  const isPartial = grade.result === 'partial'
  const isWrong = grade.result === 'wrong'

  const headerBg = isCorrect
    ? gradeColors.correctBg
    : isPartial
      ? gradeColors.partialBg
      : gradeColors.wrongBg

  const headerBorder = isCorrect
    ? gradeColors.correct
    : isPartial
      ? gradeColors.partial
      : gradeColors.wrongInnerBorder

  const outerBorder = isWrong ? gradeColors.wrongBorder : isPartial ? '#3a3020' : '#273a30'

  const icon = isCorrect ? '✓' : isWrong ? '×' : '~'
  const iconColor = isCorrect ? gradeColors.correct : isPartial ? gradeColors.partial : gradeColors.wrong
  const iconBg = isCorrect
    ? 'rgba(67,184,136,0.16)'
    : isPartial
      ? 'rgba(210,147,74,0.16)'
      : 'rgba(224,98,95,0.16)'

  const titleColor = isCorrect ? '#8ae0c4' : isPartial ? '#e8b07a' : '#e89c9a'
  const titleText = isCorrect
    ? 'Correct!'
    : isPartial
      ? `Partially correct — you entered "${grade.submittedAnswer}"`
      : `Not quite — you entered "${grade.submittedAnswer}"`

  return (
    <div
      style={{
        background: '#15171d',
        border: `1px solid ${outerBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '13px 20px',
          borderBottom: `1px solid ${headerBorder}`,
          background: headerBg,
        }}
      >
        <span
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: titleColor }}>
          {titleText}
        </span>
        <div style={{ flex: 1 }} />
        {!isCorrect && (
          <span style={{ fontSize: '11px', color: text.placeholder }}>
            no mastery penalty · hints don't cost
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Where wrong */}
        {grade.whereWrong && (
          <div>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: text.dimmed,
                marginBottom: '7px',
              }}
            >
              Where it went wrong
            </div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: text.secondary }}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {grade.whereWrong}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Hint */}
        {grade.hint && (
          <div
            style={{
              background: '#121319',
              border: `1px solid ${border.subtle}`,
              borderRadius: '9px',
              padding: '13px 15px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: gradeColors.partial,
                  fontWeight: 600,
                }}
              >
                Hint {grade.hintLevel} of {grade.maxHints}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: grade.maxHints }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: '16px',
                      height: '3px',
                      borderRadius: '2px',
                      background: i < grade.hintLevel ? gradeColors.partial : surface.track,
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: text.secondary }}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {grade.hint}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Solution reveal */}
        {grade.solution && (
          <div>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: text.dimmed,
                marginBottom: '7px',
              }}
            >
              Solution
            </div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: text.secondary }}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {grade.solution}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isCorrect && (
            <Button variant="primary" onClick={onTryAgain} style={{ gap: '8px' }}>
              Try again
              <span style={{ fontFamily: font.mono, fontSize: '10px', color: 'rgba(14,15,19,0.6)' }}>
                ⌘↵
              </span>
            </Button>
          )}
          <Button variant="secondary" onClick={onNextProblem}>
            Next problem
          </Button>
          <div style={{ flex: 1 }} />
          {!isCorrect && onRequestHint && grade.hintLevel < grade.maxHints && !grade.solution && (
            <Button variant="ghost" onClick={onRequestHint}>
              {grade.hintLevel === 0 ? 'Get hint' : 'Next hint'}
            </Button>
          )}
          {!isCorrect && !grade.solution && onRevealSolution && (
            <Button variant="ghost" onClick={onRevealSolution}>
              Reveal solution
            </Button>
          )}
        </div>

        {/* Mastery delta */}
        {grade.masteryDelta !== undefined && (
          <div style={{ fontSize: '11px', color: text.placeholder }}>
            Mastery{' '}
            <span
              style={{
                color: grade.masteryDelta >= 0 ? gradeColors.correct : gradeColors.wrong,
              }}
            >
              {grade.masteryDelta >= 0 ? '+' : ''}
              {grade.masteryDelta}
            </span>{' '}
            points
          </div>
        )}
      </div>
    </div>
  )
}

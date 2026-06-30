import { useState } from 'react'
import { useReviewStore } from './reviewStore'
import type { ReviewOutcome } from './sm2'
import { surface, border, text, accent, grade, font, radius } from '@/theme'

type SimplifiedOutcome = 'forgot' | 'hard' | 'good' | 'easy'

const SIMPLIFIED_QUALITY: Record<SimplifiedOutcome, { quality: number; outcome: ReviewOutcome }> = {
  forgot: { quality: 1, outcome: 'incorrect' },
  hard:   { quality: 3, outcome: 'hesitant' },
  good:   { quality: 4, outcome: 'correct' },
  easy:   { quality: 5, outcome: 'perfect' },
}

const GRADE_STYLES: Record<SimplifiedOutcome, { color: string; bg: string; border: string }> = {
  forgot: { color: grade.wrong, bg: grade.wrongBg, border: grade.wrongBorder },
  hard:   { color: grade.partial, bg: grade.partialBg, border: 'rgba(210,147,74,0.22)' },
  good:   { color: grade.correct, bg: grade.correctBg, border: 'rgba(67,184,136,0.22)' },
  easy:   { color: accent.text, bg: accent.tint, border: 'rgba(154,124,255,0.24)' },
}

const GRADE_LABELS: Record<SimplifiedOutcome, string> = {
  forgot: 'Forgot',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

interface ReviewSessionProps {
  totalItems: number
  onComplete?: () => void
}

export function ReviewSession({ totalItems, onComplete }: ReviewSessionProps) {
  const { currentItem, sessionResults, submitResult, endSession } = useReviewStore()
  const [userResponse, setUserResponse] = useState('')
  const [phase, setPhase] = useState<'prompt' | 'grade'>('prompt')
  const [submitting, setSubmitting] = useState(false)

  const reviewedCount = sessionResults.length
  const lapseCount = sessionResults.filter((r) => r.quality < 3).length

  if (!currentItem && reviewedCount > 0) {
    const avgQuality =
      sessionResults.reduce((s, r) => s + r.quality, 0) / sessionResults.length

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          fontFamily: font.ui,
          background: surface.base,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(67,184,136,0.12)',
            border: '1px solid rgba(67,184,136,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          ✓
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: text.primary, marginBottom: 4 }}>
            Session complete!
          </div>
          <div style={{ fontSize: 13, color: text.muted }}>
            You reviewed all items in this session.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '16px 28px',
            background: surface.raised,
            border: `1px solid ${border.card}`,
            borderRadius: radius.xl,
          }}
        >
          {[
            { value: reviewedCount, label: 'Reviewed' },
            { value: avgQuality.toFixed(1), label: 'Avg quality' },
            { value: lapseCount, label: 'Lapses' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: text.primary,
                  fontFamily: font.mono,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 11, color: text.muted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            endSession()
            onComplete?.()
          }}
          style={{
            padding: '8px 24px',
            borderRadius: radius.md,
            border: 'none',
            background: accent.primary,
            color: surface.panel,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: font.ui,
          }}
        >
          Done
        </button>
      </div>
    )
  }

  if (!currentItem) return null

  const handleReveal = () => setPhase('grade')

  const handleGrade = async (simplified: SimplifiedOutcome) => {
    const { quality, outcome } = SIMPLIFIED_QUALITY[simplified]
    setSubmitting(true)
    await submitResult(quality, outcome)
    setUserResponse('')
    setPhase('prompt')
    setSubmitting(false)
  }

  const prompt =
    currentItem.kind === 'explain'
      ? `Can you explain: ${currentItem.topic_name}?`
      : `Recall a problem involving: ${currentItem.topic_name}`

  const progressPct = Math.round((reviewedCount / totalItems) * 100)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 24px',
        gap: 20,
        fontFamily: font.ui,
        background: surface.base,
        overflowY: 'auto',
      }}
    >
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            fontSize: 11,
            color: text.placeholder,
            fontFamily: font.mono,
          }}
        >
          <span>{reviewedCount + 1} of {totalItems}</span>
          <span>{progressPct}%</span>
        </div>
        <div
          style={{
            height: 3,
            background: surface.track,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: accent.primary,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: surface.panel,
          border: `1px solid ${border.card}`,
          borderRadius: radius['2xl'],
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Subject / topic */}
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: text.placeholder,
              fontFamily: font.mono,
              marginBottom: 4,
            }}
          >
            {currentItem.subject}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: text.primary,
            }}
          >
            {currentItem.topic_name}
          </h2>
        </div>

        {/* Prompt */}
        <div
          style={{
            fontSize: 14,
            color: text.secondary,
            lineHeight: 1.65,
            padding: '12px 16px',
            background: surface.overlay,
            border: `1px solid ${border.inner}`,
            borderRadius: radius.lg,
          }}
        >
          {prompt}
        </div>

        {phase === 'prompt' && (
          <>
            <textarea
              placeholder="Write your answer or explanation here…"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: surface.input,
                border: `1px solid ${border.subtle}`,
                borderRadius: radius.lg,
                color: text.primary,
                fontSize: 13,
                fontFamily: font.ui,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={handleReveal}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 20px',
                borderRadius: radius.md,
                border: `1px solid ${accent.border}`,
                background: accent.activeBg,
                color: accent.text,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: font.ui,
              }}
            >
              Show grading
            </button>
          </>
        )}

        {phase === 'grade' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {userResponse && (
              <div
                style={{
                  padding: '10px 14px',
                  background: surface.overlay,
                  border: `1px solid ${border.inner}`,
                  borderRadius: radius.lg,
                  fontSize: 13,
                  color: text.secondary,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                {userResponse}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                color: text.muted,
                fontFamily: font.mono,
              }}
            >
              How did it go?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['forgot', 'hard', 'good', 'easy'] as SimplifiedOutcome[]).map((o) => {
                const s = GRADE_STYLES[o]
                return (
                  <button
                    key={o}
                    onClick={() => handleGrade(o)}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: radius.md,
                      border: `1px solid ${s.border}`,
                      background: s.bg,
                      color: s.color,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontFamily: font.ui,
                      opacity: submitting ? 0.5 : 1,
                    }}
                  >
                    {GRADE_LABELS[o]}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Streak hint */}
      {reviewedCount > 0 && (
        <div
          style={{
            fontSize: 11,
            color: text.placeholder,
            fontFamily: font.mono,
          }}
        >
          Last:{' '}
          <span
            style={{
              color:
                sessionResults[sessionResults.length - 1].quality >= 3
                  ? grade.correct
                  : grade.wrong,
            }}
          >
            {sessionResults[sessionResults.length - 1].quality >= 3 ? '✓' : '✗'}
          </span>
        </div>
      )}
    </div>
  )
}

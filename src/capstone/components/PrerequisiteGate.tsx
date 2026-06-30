import { MATH_PREREQUISITES } from '../milestones'
import { surface, border, text, accent, mastery as masteryTokens, font, radius } from '@/theme'

interface PrerequisiteGateProps {
  prerequisiteMastery: Record<string, number>
  onStudyCalculus?: () => void
  onStudyLinearAlgebra?: () => void
}

const TOPIC_LABELS: Record<string, string> = {
  derivatives: 'Derivatives & Calculus',
  linear_algebra_basics: 'Linear Algebra Basics',
}

export function PrerequisiteGate({
  prerequisiteMastery,
  onStudyCalculus,
  onStudyLinearAlgebra,
}: PrerequisiteGateProps) {
  const missing = Object.entries(MATH_PREREQUISITES).filter(
    ([topicId, required]) => (prerequisiteMastery[topicId] ?? 0) < required
  )

  const actionFor = (topicId: string): (() => void) | undefined => {
    if (topicId === 'derivatives') return onStudyCalculus
    if (topicId === 'linear_algebra_basics') return onStudyLinearAlgebra
    return undefined
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 32px',
        gap: 16,
        maxWidth: 480,
        margin: '0 auto',
        fontFamily: font.ui,
      }}
    >
      {/* Lock icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(160,106,58,0.12)',
          border: '1px solid rgba(160,106,58,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        🔒
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 600,
          color: text.primary,
          textAlign: 'center',
        }}
      >
        Math Prerequisites Required
      </h2>
      <p
        style={{
          margin: 0,
          color: text.muted,
          textAlign: 'center',
          lineHeight: 1.65,
          fontSize: 13,
        }}
      >
        The Neural-Net Capstone requires foundational math skills. Complete the following topics to
        unlock it:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 8 }}>
        {missing.map(([topicId, required]) => {
          const current = prerequisiteMastery[topicId] ?? 0
          const pct = Math.min(100, Math.round((current / required) * 100))
          const action = actionFor(topicId)

          return (
            <div
              key={topicId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '14px 18px',
                borderRadius: radius.xl,
                background: surface.raised,
                border: `1px solid ${border.card}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 13, color: text.secondary }}>
                  {TOPIC_LABELS[topicId] ?? topicId}
                </span>
                <span style={{ fontSize: 12, color: text.placeholder, fontFamily: font.mono }}>
                  {current.toFixed(0)} / {required}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: surface.track,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: masteryTokens.learning,
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                  }}
                  role="progressbar"
                  aria-valuenow={current}
                  aria-valuemin={0}
                  aria-valuemax={required}
                />
              </div>
              {action && (
                <button
                  onClick={action}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 14px',
                    borderRadius: radius.md,
                    border: `1px solid ${accent.border}`,
                    background: accent.activeBg,
                    color: accent.text,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: font.ui,
                  }}
                >
                  Study {topicId === 'derivatives' ? 'Calculus' : 'Linear Algebra'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

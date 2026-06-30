import { useState } from 'react'
import type { Milestone } from '../milestones'
import type { CapstoneProgress } from '../api'
import { surface, border, text, accent, mastery as masteryTokens, grade, font, radius } from '@/theme'

interface MilestoneCardProps {
  milestone: Milestone
  status: CapstoneProgress['status']
  completedAt?: string | null
  completionNotes?: string | null
  onBegin?: () => void
  onMarkComplete?: (notes: string) => void
}

const STATUS_CONFIG = {
  locked: {
    label: 'Locked',
    color: text.disabled,
    bg: 'transparent',
    border: border.inner,
  },
  unlocked: {
    label: 'Ready',
    color: masteryTokens.proficient,
    bg: 'rgba(79,147,224,0.08)',
    border: 'rgba(79,147,224,0.24)',
  },
  in_progress: {
    label: 'In progress',
    color: masteryTokens.learning,
    bg: 'rgba(210,147,74,0.08)',
    border: 'rgba(210,147,74,0.24)',
  },
  complete: {
    label: 'Complete',
    color: mastery => masteryTokens.mastered,
    bg: 'rgba(67,184,136,0.08)',
    border: 'rgba(67,184,136,0.24)',
  },
} as const

function statusColor(status: CapstoneProgress['status']): string {
  if (status === 'locked') return text.disabled
  if (status === 'unlocked') return masteryTokens.proficient
  if (status === 'in_progress') return masteryTokens.learning
  return masteryTokens.mastered
}

function statusLabel(status: CapstoneProgress['status']): string {
  if (status === 'locked') return 'Locked'
  if (status === 'unlocked') return 'Ready'
  if (status === 'in_progress') return 'In progress'
  return 'Complete'
}

export function MilestoneCard({
  milestone,
  status,
  completedAt,
  completionNotes,
  onBegin,
  onMarkComplete,
}: MilestoneCardProps) {
  const [checkedObjectives, setCheckedObjectives] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const toggleObjective = (i: number) => {
    setCheckedObjectives((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const sColor = statusColor(status)

  return (
    <div
      aria-label={`Milestone: ${milestone.title}`}
      style={{
        borderRadius: radius.xl,
        border: `1px solid ${status === 'complete' ? 'rgba(67,184,136,0.24)' : border.card}`,
        background: status === 'locked' ? surface.overlay : surface.raised,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        opacity: status === 'locked' ? 0.65 : 1,
        fontFamily: font.ui,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: text.primary }}>
            {milestone.title}
          </span>
          <span
            style={{
              padding: '2px 9px',
              borderRadius: radius.pill,
              fontSize: 11,
              fontWeight: 600,
              color: sColor,
              background: `${sColor}18`,
              border: `1px solid ${sColor}36`,
              whiteSpace: 'nowrap',
              fontFamily: font.mono,
            }}
          >
            {statusLabel(status)}
          </span>
        </div>
        <p style={{ margin: 0, color: text.muted, fontSize: 13, lineHeight: 1.6 }}>
          {milestone.description}
        </p>
      </div>

      {/* Locked note */}
      {status === 'locked' && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            color: text.placeholder,
            fontSize: 12,
          }}
        >
          <span>🔒</span>
          <span>
            Complete{' '}
            {milestone.prerequisites
              .map((p, i) => (
                <strong key={p} style={{ color: text.dimmed }}>
                  {p}
                </strong>
              ))
              .reduce(
                (acc: React.ReactNode[], el, i) =>
                  i === 0 ? [el] : [...acc, ' and ', el],
                []
              )}{' '}
            to unlock this milestone.
          </span>
        </div>
      )}

      {/* Active content */}
      {(status === 'unlocked' || status === 'in_progress') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Objectives */}
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: text.placeholder,
                fontFamily: font.mono,
                marginBottom: 8,
              }}
            >
              Objectives
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {milestone.objectives.map((obj, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkedObjectives.has(i)}
                    onChange={() => toggleObjective(i)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: accent.primary }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: checkedObjectives.has(i) ? text.placeholder : text.secondary,
                      textDecoration: checkedObjectives.has(i) ? 'line-through' : 'none',
                      lineHeight: 1.5,
                    }}
                  >
                    {obj}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* References */}
          {milestone.references.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: text.placeholder,
                  fontFamily: font.mono,
                  marginBottom: 6,
                }}
              >
                References
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {milestone.references.map((ref, i) => (
                  <span key={i} style={{ fontSize: 12, color: text.muted, lineHeight: 1.5 }}>
                    📖 {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {status === 'unlocked' && onBegin && (
            <button
              onClick={onBegin}
              style={{
                alignSelf: 'flex-start',
                padding: '7px 18px',
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
              Begin milestone
            </button>
          )}

          {status === 'in_progress' && onMarkComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {showNotes ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about what you built or learned (optional)…"
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setShowNotes(false)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: radius.md,
                        border: `1px solid ${border.card}`,
                        background: surface.overlay,
                        color: text.muted,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: font.ui,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onMarkComplete(notes)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: radius.md,
                        border: '1px solid rgba(67,184,136,0.3)',
                        background: 'rgba(67,184,136,0.1)',
                        color: grade.correct,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: font.ui,
                      }}
                    >
                      Mark complete
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowNotes(true)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '7px 18px',
                    borderRadius: radius.md,
                    border: '1px solid rgba(67,184,136,0.3)',
                    background: 'rgba(67,184,136,0.1)',
                    color: grade.correct,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: font.ui,
                  }}
                >
                  Mark complete ✓
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completed section */}
      {status === 'complete' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 500,
              color: masteryTokens.mastered,
            }}
          >
            ✅ Completed
            {completedAt && (
              <span style={{ fontSize: 11, color: text.placeholder, fontFamily: font.mono, fontWeight: 400 }}>
                {new Date(completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {completionNotes && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: text.muted,
                fontStyle: 'italic',
                lineHeight: 1.55,
              }}
            >
              {completionNotes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

import { surface, border, text, accent, font, radius } from '@/theme'
import type { Topic } from '../api'

interface StudyNextProps {
  topic: Topic | null
  mastery: number
  onStart?: (topic: Topic) => void
}

export function StudyNext({ topic, mastery, onStart }: StudyNextProps) {
  if (!topic) {
    return (
      <div
        style={{
          border: `1px dashed ${border.card}`,
          borderRadius: radius.xl,
          padding: 20,
          textAlign: 'center',
          color: text.placeholder,
          fontSize: 13,
          fontFamily: font.ui,
        }}
      >
        No recommendations yet — complete more topics to unlock suggestions.
      </div>
    )
  }

  const hint =
    mastery < 30
      ? 'This topic needs significant work — start here to build foundations.'
      : mastery < 60
      ? 'You have some familiarity — review and practice to solidify understanding.'
      : 'Almost there — a focused review session should push you over 70.'

  return (
    <div
      style={{
        border: `1px solid ${accent.border}`,
        borderRadius: radius.xl,
        padding: '18px 20px',
        background: accent.activeBg,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: accent.text,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: font.mono,
        }}
      >
        Study next
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: text.primary, fontFamily: font.ui }}>
        {topic.name}
      </div>
      <div style={{ fontSize: 12, color: text.muted, fontFamily: font.ui }}>
        {topic.subject} · current mastery{' '}
        <span style={{ fontFamily: font.mono, color: accent.text }}>{mastery}/100</span>
      </div>
      <div style={{ fontSize: 12, color: text.dimmed, lineHeight: 1.6, fontFamily: font.ui }}>
        {hint}
      </div>
      {onStart && (
        <button
          onClick={() => onStart(topic)}
          style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            padding: '7px 16px',
            background: accent.primary,
            color: surface.panel,
            border: 'none',
            borderRadius: radius.md,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: font.ui,
          }}
        >
          Start studying
        </button>
      )}
    </div>
  )
}

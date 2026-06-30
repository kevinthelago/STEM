import { surface, border, text, accent, mastery as masteryTokens, font, radius } from '@/theme'
import type { MasteryLevel } from '@/theme'
import type { Topic } from '../api'

interface TopicCardProps {
  topic: Topic
  mastery: number
  onClick?: () => void
}

function masteryLevel(score: number): MasteryLevel {
  if (score >= 80) return 'mastered'
  if (score >= 50) return 'proficient'
  if (score > 0) return 'learning'
  return 'unstarted'
}

export function TopicCard({ topic, mastery: score, onClick }: TopicCardProps) {
  const level = masteryLevel(score)
  const dotColor = masteryTokens[level]
  const pct = score

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: `1px solid ${border.card}`,
        borderRadius: radius.xl,
        background: surface.raised,
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.12s',
        fontFamily: font.ui,
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLButtonElement).style.borderColor = accent.border
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLButtonElement).style.borderColor = border.card
      }}
    >
      {/* Mastery dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: text.secondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {topic.name}
        </div>
        <div style={{ fontSize: 11, color: text.placeholder, marginTop: 1 }}>
          {topic.subject}
        </div>
      </div>
      {/* Score */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span style={{ fontFamily: font.mono, fontSize: 11, color: dotColor }}>
          {score}
        </span>
        <div
          style={{
            width: 40,
            height: 3,
            borderRadius: 2,
            background: surface.track,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: dotColor,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </button>
  )
}

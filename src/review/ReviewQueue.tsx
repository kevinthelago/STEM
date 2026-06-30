import { useEffect } from 'react'
import { useReviewStore } from './reviewStore'
import { surface, border, text, accent, mastery as masteryTokens, font, radius } from '@/theme'

function formatDueStatus(dueAt: string): string {
  const due = new Date(dueAt)
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  if (diffMs <= 0) return 'due now'
  const days = Math.floor(diffMs / 86_400_000)
  if (days > 0) return `${days}d past due`
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours > 0) return `${hours}h past due`
  return 'just past due'
}

interface ReviewQueueProps {
  onStartSession?: () => void
}

export function ReviewQueue({ onStartSession }: ReviewQueueProps) {
  const { dueItems, overdueCount, isLoading, error, loadQueue, startSession } =
    useReviewStore()

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const handleStart = () => {
    startSession()
    onStartSession?.()
  }

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: text.muted,
          fontSize: 13,
          fontFamily: font.ui,
        }}
      >
        Loading reviews…
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: font.ui,
        }}
      >
        <div style={{ color: '#e0625f', fontSize: 13 }}>
          Failed to load review queue: {error}
        </div>
        <button
          onClick={loadQueue}
          style={{
            padding: '7px 16px',
            borderRadius: radius.md,
            border: `1px solid ${border.card}`,
            background: surface.raised,
            color: text.secondary,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: font.ui,
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (dueItems.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: font.ui,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `rgba(67,184,136,0.12)`,
            border: `1px solid rgba(67,184,136,0.28)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: text.primary }}>
          All caught up!
        </div>
        <div style={{ fontSize: 13, color: text.muted, textAlign: 'center', maxWidth: 300 }}>
          No reviews due right now. Keep studying and check back later.
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 28px',
        gap: 16,
        fontFamily: font.ui,
        background: surface.base,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: text.primary, margin: '0 0 2px' }}>
            Review Queue
          </h1>
          <div style={{ fontSize: 12, color: text.placeholder, display: 'flex', gap: 10 }}>
            <span style={{ fontFamily: font.mono, color: accent.text }}>
              {dueItems.length} item{dueItems.length !== 1 ? 's' : ''} due
            </span>
            {overdueCount > 0 && (
              <span style={{ color: '#e0625f', fontFamily: font.mono }}>
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={dueItems.length === 0}
          style={{
            padding: '8px 20px',
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
          Start review session
        </button>
      </div>

      {/* Queue list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {dueItems.map((item) => {
          const overdue = new Date(item.due_at) < new Date()
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                border: `1px solid ${border.card}`,
                borderRadius: radius.xl,
                background: surface.raised,
              }}
            >
              {/* Kind dot */}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background:
                    item.kind === 'problem'
                      ? masteryTokens.proficient
                      : masteryTokens.learning,
                  flexShrink: 0,
                }}
              />
              {/* Topic info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.topic_name}
                </div>
                <div style={{ fontSize: 11, color: text.placeholder, marginTop: 1 }}>
                  {item.subject}
                </div>
              </div>
              {/* Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: text.dimmed,
                    background: surface.overlay,
                    padding: '2px 7px',
                    borderRadius: radius.pill,
                    fontFamily: font.mono,
                  }}
                >
                  {item.kind === 'problem' ? 'problem' : 'explain'}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: font.mono,
                    color: overdue ? '#e0625f' : text.placeholder,
                  }}
                >
                  {formatDueStatus(item.due_at)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

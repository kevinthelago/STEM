import { surface, border, accent, text, font } from '@/theme'
import { Badge } from '@/lib/components/Badge'
import { useNavStore, useCurriculumStore } from './store'
import type { AppMode } from '@/lib/types'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'practice', label: 'Practice' },
  { id: 'visualize', label: 'Visualize' },
  { id: 'research', label: 'Research' },
]

export function TopBar() {
  const { view, navigateTo, setMode, reviewDueCount } = useNavStore()
  const { subjects, topicsBySubject, activeTopicId } = useCurriculumStore()

  // Find active topic/subject for breadcrumb
  const activeTopic = activeTopicId
    ? Object.values(topicsBySubject)
        .flat()
        .find((t) => t.id === activeTopicId)
    : null
  const activeSubject = activeTopic
    ? subjects.find((s) => s.id === activeTopic.subjectId)
    : null

  const currentMode = view.type === 'mode' ? view.mode : null

  return (
    <header
      style={{
        height: '46px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: surface.overlay,
        borderBottom: `1px solid ${border.inner}`,
        gap: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            background: accent.primary,
            flexShrink: 0,
          }}
        />
        <span
          style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.03em', color: text.primary }}
        >
          STEM
        </span>
      </div>

      {/* Breadcrumb */}
      {activeTopic && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '0 14px',
            borderLeft: `1px solid ${border.subtle}`,
            height: '24px',
          }}
        >
          <span style={{ fontSize: '12px', color: text.placeholder }}>
            {activeSubject?.title ?? ''}
          </span>
          <span style={{ fontSize: '11px', color: '#3a3e48' }}>/</span>
          <span style={{ fontSize: '12px', color: text.secondary, fontWeight: 500 }}>
            {activeTopic.title}
          </span>
        </div>
      )}

      {/* Mode switcher */}
      {activeTopic && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            marginLeft: '18px',
            background: surface.panel,
            border: `1px solid ${border.subtle}`,
            borderRadius: '7px',
            padding: '2px',
          }}
        >
          {MODES.map(({ id, label }) => {
            const active = currentMode === id
            return (
              <button
                key={id}
                onClick={() => {
                  if (view.type === 'mode') {
                    setMode(id)
                  } else if (activeTopicId) {
                    const subject = subjects.find((s) =>
                      (topicsBySubject[s.id] ?? []).some((t) => t.id === activeTopicId),
                    )
                    navigateTo({
                      type: 'mode',
                      mode: id,
                      topicId: activeTopicId,
                      subjectId: subject?.id ?? '',
                    })
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 13px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontFamily: font.ui,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.1s',
                  background: active ? accent.tint : 'transparent',
                  boxShadow: active ? `inset 0 0 0 1px ${accent.border}` : 'none',
                  color: active ? accent.text : text.muted,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {active && (
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: accent.primary,
                    }}
                  />
                )}
                {label}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Right nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { label: 'Dashboard', view: { type: 'dashboard' } as const },
          { label: 'Notes', view: { type: 'notes' } as const },
          { label: 'Settings', view: { type: 'settings' } as const },
        ].map(({ label, view: v }) => (
          <button
            key={label}
            onClick={() => navigateTo(v)}
            style={{
              padding: '6px 11px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: font.ui,
              color: text.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => navigateTo({ type: 'review' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 11px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: font.ui,
            color: text.muted,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Review
          {reviewDueCount > 0 && <Badge>{reviewDueCount}</Badge>}
        </button>
      </nav>
    </header>
  )
}

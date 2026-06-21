import { surface, border, text, font, accent, mastery } from '@/theme'
import { useSessionStore, useNavStore } from './store'

export function StatusBar() {
  const { claudeConnected, claudeVersion } = useSessionStore()
  const { view, reviewDueCount } = useNavStore()

  const sessionLabel =
    view.type === 'mode' ? `session: ${view.topicId} · ${view.mode}` : null

  return (
    <footer
      style={{
        height: '26px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: surface.overlay,
        borderTop: `1px solid ${border.inner}`,
        fontFamily: font.mono,
        fontSize: '10.5px',
      }}
    >
      {/* Claude connection */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          color: text.muted,
          paddingRight: '14px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: claudeConnected ? mastery.mastered : mastery.unstarted,
            flexShrink: 0,
          }}
        />
        {claudeConnected
          ? `claude connected${claudeVersion ? ` · ${claudeVersion}` : ''}`
          : 'claude disconnected'}
      </div>

      {/* Session label */}
      {sessionLabel && (
        <div
          style={{
            color: text.placeholder,
            padding: '0 14px',
            borderLeft: `1px solid ${border.subtle}`,
          }}
        >
          {sessionLabel}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Review due count */}
      {reviewDueCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            color: accent.text,
            paddingLeft: '14px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: accent.primary,
              flexShrink: 0,
            }}
          />
          {reviewDueCount} due today
        </div>
      )}
    </footer>
  )
}

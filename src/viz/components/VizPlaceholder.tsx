import { surface, text, font, border, radius } from '@/theme'

export function VizPlaceholder({ type }: { type: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: text.muted,
        flexDirection: 'column',
        gap: 8,
        fontFamily: font.ui,
      }}
    >
      <span style={{ fontSize: 13, color: text.dimmed }}>
        Unknown visualization type:{' '}
        <code
          style={{
            background: surface.raised,
            border: `1px solid ${border.subtle}`,
            padding: '2px 6px',
            borderRadius: radius.sm,
            fontFamily: font.mono,
            fontSize: 12,
            color: text.secondary,
          }}
        >
          {type}
        </code>
      </span>
      <span style={{ fontSize: 12, color: text.placeholder }}>
        This visualization type is not yet supported.
      </span>
    </div>
  )
}

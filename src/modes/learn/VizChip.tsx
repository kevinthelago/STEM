import { surface, border, accent, text, font } from '@/theme'
import type { VizPayload } from '@/lib/types'

interface VizChipProps {
  viz: VizPayload
  onClick(): void
}

export function VizChip({ viz, onClick }: VizChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '14px',
        padding: '8px 13px 8px 11px',
        background: surface.input,
        border: `1px solid ${border.card}`,
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      {/* Play icon */}
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '5px',
          background: accent.tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="9" height="10" viewBox="0 0 9 10">
          <polygon points="0,0 9,5 0,10" fill="#b6a3ff" />
        </svg>
      </span>

      {/* Labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 500, color: accent.text }}>
          {viz.label}
        </span>
        <span style={{ fontSize: '10.5px', color: text.placeholder, fontFamily: font.mono }}>
          {'<viz type="'}{viz.type}{'">'} · opens Visualize host
        </span>
      </div>
    </button>
  )
}

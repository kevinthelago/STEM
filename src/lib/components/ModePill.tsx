import type { CSSProperties } from 'react'
import { accent, text, font } from '@/theme'

interface ModePillProps {
  label: string
  active: boolean
  onClick(): void
  style?: CSSProperties
}

/** Single tab in the TopBar mode switcher. Violet tint when active. */
export function ModePill({ label, active, onClick, style }: ModePillProps) {
  return (
    <button
      onClick={onClick}
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
        ...style,
      }}
    >
      {active && (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: accent.primary,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </button>
  )
}

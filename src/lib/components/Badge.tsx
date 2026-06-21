import type { ReactNode } from 'react'
import { accent, surface, font } from '@/theme'

interface BadgeProps {
  children: ReactNode
  style?: React.CSSProperties
}

/** Small pill badge — used for review count, labels, etc. */
export function Badge({ children, style }: BadgeProps) {
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: '10px',
        fontWeight: 600,
        color: surface.panel,
        background: accent.primary,
        borderRadius: '9px',
        padding: '1px 6px',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

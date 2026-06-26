import type { CSSProperties, ReactNode } from 'react'
import { surface, border, radius, shadow } from '@/theme'

interface CardProps {
  children: ReactNode
  padding?: 'default' | 'none'
  style?: CSSProperties
}

export function Card({ children, padding = 'default', style }: CardProps) {
  return (
    <div
      style={{
        background: surface.raised,
        border: `1px solid ${border.card}`,
        borderRadius: radius['2xl'],
        boxShadow: shadow.card,
        padding: padding === 'default' ? '20px 22px' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

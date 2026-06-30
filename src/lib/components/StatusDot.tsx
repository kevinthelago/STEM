import type { CSSProperties } from 'react'

interface StatusDotProps {
  color: string
  size?: number
  style?: CSSProperties
}

/** Generic coloured status indicator dot. */
export function StatusDot({ color, size = 6, style }: StatusDotProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

import type { MasteryLevel } from '@/theme'
import { mastery } from '@/theme'

interface MasteryDotProps {
  level: MasteryLevel
  size?: number
}

export function MasteryDot({ level, size = 6 }: MasteryDotProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: mastery[level],
        flexShrink: 0,
      }}
    />
  )
}

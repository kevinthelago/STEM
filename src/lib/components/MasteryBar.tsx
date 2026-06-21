import type { MasteryLevel } from '@/theme'
import { mastery, surface } from '@/theme'

interface MasteryBarProps {
  score: number // 0–100
  level: MasteryLevel
  width?: number
}

export function MasteryBar({ score, level, width = 120 }: MasteryBarProps) {
  return (
    <div
      style={{
        width,
        height: '5px',
        borderRadius: '3px',
        background: surface.track,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${score}%`,
          height: '100%',
          background: mastery[level],
          borderRadius: '3px',
        }}
      />
    </div>
  )
}

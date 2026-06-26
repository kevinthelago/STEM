import type { CSSProperties } from 'react'
import { accent, text, font } from '@/theme'

interface SliderProps {
  value: number
  onChange(value: number): void
  min?: number
  max?: number
  disabled?: boolean
  label?: string
  style?: CSSProperties
}

export function Slider({ value, onChange, min = 0, max = 100, disabled, label, style }: SliderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: text.muted, fontFamily: font.ui }}>{label}</span>
          <span style={{ fontSize: '12px', color: text.secondary, fontFamily: font.mono }}>{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: accent.primary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  )
}

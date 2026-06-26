import type { InputHTMLAttributes } from 'react'
import { surface, border, accent, text, font, radius } from '@/theme'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange(value: string): void
}

export function Input({ value, onChange, style, ...props }: InputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: '36px',
        padding: '0 12px',
        background: surface.input,
        border: `1px solid ${border.subtle}`,
        borderRadius: radius.lg,
        fontSize: '13px',
        fontFamily: font.ui,
        color: text.primary,
        outline: 'none',
        transition: 'border-color 0.1s, box-shadow 0.1s',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accent.primary
        e.currentTarget.style.boxShadow = `0 0 0 2px ${accent.tint}`
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = border.subtle
        e.currentTarget.style.boxShadow = 'none'
        props.onBlur?.(e)
      }}
      {...props}
    />
  )
}

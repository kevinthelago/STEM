import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { accent, surface, border, text, radius } from '@/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: accent.primary,
    color: surface.panel,
    fontWeight: 600,
    border: 'none',
  },
  secondary: {
    background: surface.raised,
    color: text.secondary,
    border: `1px solid ${border.card}`,
    fontWeight: 500,
  },
  ghost: {
    background: 'transparent',
    color: text.muted,
    border: `1px solid ${border.subtle}`,
    fontWeight: 500,
  },
  danger: {
    background: 'rgba(224,98,95,0.16)',
    color: '#e0625f',
    border: '1px solid rgba(224,98,95,0.3)',
    fontWeight: 500,
  },
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { height: '30px', padding: '0 12px', fontSize: '12px', borderRadius: radius.md },
  md: { height: '40px', padding: '0 16px', fontSize: '13px', borderRadius: radius.xl },
}

export function Button({
  variant = 'secondary',
  size = 'md',
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'opacity 0.1s',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

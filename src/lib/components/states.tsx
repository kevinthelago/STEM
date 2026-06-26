import type { CSSProperties } from 'react'
import { accent, text, grade, font } from '@/theme'
import { Button } from './Button'

const centerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  flex: 1,
  padding: '32px',
}

interface EmptyStateProps {
  message: string
  style?: CSSProperties
}

export function EmptyState({ message, style }: EmptyStateProps) {
  return (
    <div style={{ ...centerStyle, ...style }}>
      <span style={{ fontSize: '13px', color: text.placeholder, fontFamily: font.ui }}>
        {message}
      </span>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  style?: CSSProperties
}

export function LoadingState({ message = 'Loading…', style }: LoadingStateProps) {
  return (
    <div style={{ ...centerStyle, ...style }}>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: accent.primary,
          animation: 'blink 1s step-end infinite',
        }}
      />
      <span style={{ fontSize: '13px', color: text.muted, fontFamily: font.ui }}>{message}</span>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  style?: CSSProperties
}

export function ErrorState({ message, onRetry, style }: ErrorStateProps) {
  return (
    <div style={{ ...centerStyle, ...style }}>
      <span style={{ fontSize: '13px', color: grade.wrong, fontFamily: font.ui }}>{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

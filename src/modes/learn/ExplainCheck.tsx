import { useState } from 'react'
import { surface, border, accent, text, font } from '@/theme'
import { Button } from '@/lib/components/Button'
import { submitExplainAnswer } from '@/lib/tauri'

interface ExplainCheckProps {
  sessionId: string
  question: string
  onClose(): void
}

export function ExplainCheck({ sessionId, question, onClose }: ExplainCheckProps) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!answer.trim()) return
    setSubmitting(true)
    try {
      await submitExplainAnswer(sessionId, answer)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      style={{
        marginLeft: '40px',
        background: '#121319',
        border: `1px solid ${border.subtle}`,
        borderRadius: '10px',
        padding: '15px 16px',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: accent.primary,
            fontWeight: 600,
          }}
        >
          Explain-check
        </span>
        <span style={{ fontSize: '11px', color: text.placeholder }}>
          writing it yourself counts toward mastery
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            color: text.dimmed,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{ fontSize: '13.5px', lineHeight: 1.6, color: text.secondary, marginBottom: '11px' }}
      >
        {question}
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your explanation…"
        rows={3}
        style={{
          width: '100%',
          background: surface.panel,
          border: `1px solid ${border.subtle}`,
          borderRadius: '7px',
          padding: '11px 13px',
          fontSize: '13px',
          color: answer ? text.secondary : text.disabled,
          lineHeight: 1.55,
          fontFamily: font.ui,
          resize: 'vertical',
          minHeight: '58px',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '11px',
        }}
      >
        <span style={{ fontSize: '11px', color: text.placeholder }}>
          graded on intuition, not wording
        </span>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!answer.trim() || submitting}
          style={{ gap: '8px' }}
        >
          Submit explanation
          <span style={{ fontFamily: font.mono, fontSize: '10px', color: 'rgba(14,15,19,0.6)' }}>
            ⌘↵
          </span>
        </Button>
      </div>
    </div>
  )
}

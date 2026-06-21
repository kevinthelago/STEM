import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { accent, text, font } from '@/theme'
import { VizChip } from './VizChip'
import type { ChatMessage, VizPayload } from '@/lib/types'

interface TutorMessageProps {
  message: ChatMessage
  onVizClick(viz: VizPayload): void
}

export function TutorMessage({ message, onVizClick }: TutorMessageProps) {
  return (
    <div style={{ display: 'flex', gap: '14px' }}>
      {/* Tutor avatar */}
      <div
        style={{
          width: '26px',
          height: '26px',
          flexShrink: 0,
          borderRadius: '6px',
          background: accent.tint,
          border: `1px solid ${accent.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{ width: '7px', height: '7px', borderRadius: '2px', background: accent.primary }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Label */}
        <div
          style={{
            fontSize: '11px',
            color: text.placeholder,
            marginBottom: '7px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Tutor
          {message.isStreaming && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: accent.primary }}>
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: accent.primary,
                }}
              />
              streaming
            </span>
          )}
        </div>

        {/* Message content */}
        <div
          style={{
            fontSize: '14px',
            lineHeight: 1.72,
            color: text.secondary,
          }}
          className="tutor-prose"
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              strong: ({ children }) => (
                <strong style={{ color: text.primary, fontWeight: 600 }}>{children}</strong>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    fontFamily: font.mono,
                    fontSize: '0.9em',
                    color: accent.text,
                    background: 'rgba(154,124,255,0.1)',
                    borderRadius: '3px',
                    padding: '1px 4px',
                  }}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre
                  style={{
                    fontFamily: font.mono,
                    fontSize: '13px',
                    background: '#121419',
                    border: '1px solid #24262e',
                    borderRadius: '7px',
                    padding: '14px 16px',
                    overflowX: 'auto',
                    lineHeight: 1.6,
                    color: text.secondary,
                  }}
                >
                  {children}
                </pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Streaming cursor */}
          {message.isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '15px',
                background: accent.primary,
                marginLeft: '2px',
                verticalAlign: '-2px',
                borderRadius: '1px',
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </div>

        {/* Viz chip */}
        {message.vizPayload && (
          <VizChip viz={message.vizPayload} onClick={() => onVizClick(message.vizPayload!)} />
        )}
      </div>
    </div>
  )
}

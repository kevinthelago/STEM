import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { accent, text, font } from '@/theme'

interface ProseRendererProps {
  content: string
  isStreaming?: boolean
}

export function ProseRenderer({ content, isStreaming = false }: ProseRendererProps) {
  return (
    <div
      style={{ fontSize: '14px', lineHeight: 1.72, color: text.secondary }}
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
                background: 'rgba(154,124,255,0.10)',
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
        {content}
      </ReactMarkdown>

      {isStreaming && (
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
  )
}

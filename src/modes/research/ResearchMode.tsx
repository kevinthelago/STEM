import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { surface, border, accent, text, font } from '@/theme'
import { Button } from '@/lib/components/Button'
import { useSessionStore, useCurriculumStore } from '@/app/store'
import { sendLearnMessage } from '@/lib/tauri'

interface ResearchModeProps {
  topicId: string
}

/**
 * Free-form research mode — same chat mechanics as Learn but without
 * structured practice. The tutor is in exploration/source-citing mode.
 */
export function ResearchMode({ topicId }: ResearchModeProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { sessions, messages, ensureSession, appendUserMessage } = useSessionStore()
  const { topicsBySubject } = useCurriculumStore()

  const topic = Object.values(topicsBySubject).flat().find((t) => t.id === topicId)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    ensureSession(topicId).then((s) => setSessionId(s.id))
  }, [topicId, ensureSession])

  const session = sessionId ? sessions[sessionId] : null
  const msgs = useMemo(
    () => (sessionId ? (messages[sessionId] ?? []) : []),
    [sessionId, messages],
  )
  const isStreaming = msgs.length > 0 && msgs[msgs.length - 1]?.isStreaming

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs])

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || !sessionId) return
    setInput('')
    appendUserMessage(sessionId, content)
    await sendLearnMessage(sessionId, content)
  }, [input, sessionId, appendUserMessage])

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: surface.panel }}>
      {/* Header */}
      <div
        style={{
          height: '54px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 28px',
          borderBottom: `1px solid ${surface.raised}`,
        }}
      >
        <span style={{ fontSize: '14.5px', fontWeight: 600, color: text.primary }}>
          Research: {topic?.title ?? topicId}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: text.dimmed,
            background: surface.raised,
            border: `1px solid ${border.subtle}`,
            borderRadius: '5px',
            padding: '2px 8px',
          }}
        >
          free exploration
        </span>
        <div style={{ flex: 1 }} />
        {session && (
          <div
            style={{
              fontFamily: font.mono,
              fontSize: '11px',
              color: text.placeholder,
              padding: '4px 9px',
              border: `1px solid ${border.subtle}`,
              borderRadius: '6px',
            }}
          >
            claude · pty
          </div>
        )}
      </div>

      {/* Chat scroll */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '26px 28px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {msgs.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: text.placeholder,
                fontSize: '13px',
                paddingTop: '40px',
              }}
            >
              Ask anything — explore freely, dive into tangents, request sources.
            </div>
          )}

          {msgs.map((msg) =>
            msg.role === 'tutor' ? (
              <div key={msg.id} style={{ display: 'flex', gap: '14px' }}>
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
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '2px',
                      background: accent.primary,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: text.placeholder, marginBottom: '7px' }}>
                    Tutor
                    {msg.isStreaming && (
                      <span style={{ marginLeft: '8px', color: accent.primary }}>streaming</span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: 1.72, color: text.secondary }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div key={msg.id} style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    maxWidth: '560px',
                    background: surface.input,
                    border: `1px solid ${border.user}`,
                    borderRadius: '10px',
                    padding: '12px 15px',
                  }}
                >
                  <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#d7dae2' }}>
                    {msg.content}
                  </div>
                </div>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    flexShrink: 0,
                    borderRadius: '6px',
                    background: surface.raised,
                    border: `1px solid ${border.user}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: text.muted,
                    fontWeight: 600,
                  }}
                >
                  You
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: '14px 28px 18px', borderTop: `1px solid ${surface.raised}` }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              background: surface.input,
              border: `1px solid ${border.card}`,
              borderRadius: '11px',
              padding: '11px 13px',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Explore freely…"
              rows={1}
              style={{
                flex: 1,
                fontSize: '13.5px',
                color: input ? text.secondary : text.placeholder,
                lineHeight: 1.5,
                padding: '2px 0',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: font.ui,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: font.mono, fontSize: '10px', color: text.disabled }}>
                ⌘↵
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                style={{ borderRadius: '7px', width: '30px', height: '30px', padding: 0 }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11">
                  <polygon points="0,0 11,5.5 0,11 2,5.5" fill="#0e0f13" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

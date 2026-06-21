import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { surface, border, accent, text, font } from '@/theme'
import { MasteryBar } from '@/lib/components/MasteryBar'
import { Button } from '@/lib/components/Button'
import { useSessionStore, useCurriculumStore, useNavStore } from '@/app/store'
import { sendLearnMessage } from '@/lib/tauri'
import { TutorMessage } from './TutorMessage'
import { ExplainCheck } from './ExplainCheck'
import type { ChatMessage } from '@/lib/types'

interface LearnModeProps {
  topicId: string
}

export function LearnMode({ topicId }: LearnModeProps) {
  const [input, setInput] = useState('')
  const [showExplainCheck, setShowExplainCheck] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { sessions, messages, ensureSession } = useSessionStore()
  const { topicsBySubject } = useCurriculumStore()
  const { navigateTo } = useNavStore()

  const topic = Object.values(topicsBySubject).flat().find((t) => t.id === topicId)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    ensureSession(topicId).then((s) => setSessionId(s.id))
  }, [topicId, ensureSession])

  const session = sessionId ? sessions[sessionId] : null
  const msgs: ChatMessage[] = useMemo(
    () => (sessionId ? (messages[sessionId] ?? []) : []),
    [sessionId, messages],
  )

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs])

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || !sessionId) return
    setInput('')
    useSessionStore.getState().appendUserMessage(sessionId, content)
    await sendLearnMessage(sessionId, content)
  }, [input, sessionId])

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const isStreaming = msgs.length > 0 && msgs[msgs.length - 1]?.isStreaming

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: surface.panel }}>
      {/* Mode header */}
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
          {topic?.title ?? topicId}
        </span>
        {topic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MasteryBar score={topic.masteryScore} level={topic.masteryLevel} />
            <span
              style={{
                fontFamily: font.mono,
                fontSize: '11px',
                color:
                  topic.masteryLevel === 'mastered'
                    ? '#43b888'
                    : topic.masteryLevel === 'proficient'
                      ? '#4f93e0'
                      : topic.masteryLevel === 'learning'
                        ? '#d2934a'
                        : '#5b6172',
              }}
            >
              {topic.masteryScore}
            </span>
            <span style={{ fontSize: '11px', color: text.placeholder }}>
              {topic.masteryLevel[0].toUpperCase() + topic.masteryLevel.slice(1)}
            </span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: text.dimmed }}>
          {session && (
            <>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#43b888',
                }}
              />
              {`session active · ${session.turnCount} turns`}
            </>
          )}
        </div>
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
      </div>

      {/* Chat scroll area */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '26px 28px' }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          {msgs.length === 0 && !isStreaming && (
            <div
              style={{
                textAlign: 'center',
                color: text.placeholder,
                fontSize: '13px',
                paddingTop: '40px',
              }}
            >
              Start a conversation — ask the tutor about {topic?.title ?? 'this topic'}.
            </div>
          )}

          {msgs.map((msg) =>
            msg.role === 'tutor' ? (
              <TutorMessage
                key={msg.id}
                message={msg}
                onVizClick={(viz) => {
                  if (sessionId) {
                    useSessionStore.getState().setPendingViz(sessionId, viz)
                  }
                  const view = useNavStore.getState().view
                  if (view.type === 'mode') {
                    navigateTo({ ...view, mode: 'visualize' })
                  }
                }}
              />
            ) : (
              <UserMessage key={msg.id} content={msg.content} />
            ),
          )}

          {/* Explain-check block */}
          {showExplainCheck && sessionId && (
            <ExplainCheck
              sessionId={sessionId}
              question={`Explain in your own words the key concept from the last response.`}
              onClose={() => setShowExplainCheck(false)}
            />
          )}
        </div>
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          padding: '14px 28px 18px',
          borderTop: `1px solid ${surface.raised}`,
        }}
      >
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
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up, or paste a problem…"
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
                ⌘↵ send
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

          {/* Explain-check trigger */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => setShowExplainCheck(true)}
              style={{
                fontSize: '11px',
                color: accent.text,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: font.ui,
              }}
            >
              + Explain-check
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserMessage({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
      <div
        style={{
          maxWidth: '560px',
          background: surface.input,
          border: `1px solid ${border.user}`,
          borderRadius: '10px',
          padding: '12px 15px',
        }}
      >
        <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#d7dae2' }}>{content}</div>
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
          fontFamily: font.ui,
        }}
      >
        You
      </div>
    </div>
  )
}

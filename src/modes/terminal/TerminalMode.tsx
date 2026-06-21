import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { surface, font } from '@/theme'
import { useSessionStore } from '@/app/store'
import { onPtyOutput, getPtyHistory } from '@/lib/tauri'

interface TerminalModeProps {
  topicId: string
}

/** xterm.js surface bound to the active session's PTY. */
export function TerminalMode({ topicId: _topicId }: TerminalModeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const unlistenRef = useRef<(() => void) | null>(null)

  const sessions = useSessionStore((s) => s.sessions)
  const session = Object.values(sessions)[0] ?? null

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      fontFamily: font.mono,
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      theme: {
        background: surface.canvas,
        foreground: '#c9cdd8',
        cursor: '#9a7cff',
        selectionBackground: 'rgba(154,124,255,0.3)',
        black: '#1a1c22',
        red: '#e0625f',
        green: '#43b888',
        yellow: '#d2934a',
        blue: '#4f93e0',
        magenta: '#9a7cff',
        cyan: '#43b8b8',
        white: '#c9cdd8',
        brightBlack: '#5b6172',
        brightRed: '#e89c9a',
        brightGreen: '#8ae0c4',
        brightYellow: '#e8c07a',
        brightBlue: '#8ab8e8',
        brightMagenta: '#cdbcff',
        brightCyan: '#8ae0e0',
        brightWhite: '#e6e8ee',
      },
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => webglAddon.dispose())
      term.loadAddon(webglAddon)
    } catch {
      // WebGL not available — fall back to canvas renderer
    }

    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitRef.current = fitAddon

    // Replay PTY history if we have an active session
    if (session) {
      getPtyHistory(session.id)
        .then((history) => {
          if (history) term.write(history)
        })
        .catch(() => {})
    }

    // Subscribe to PTY output events
    onPtyOutput((payload) => {
      if (!session || payload.sessionId !== session.id) return
      term.write(payload.data)
    }).then((unlisten) => {
      unlistenRef.current = unlisten
    })

    // Resize observer
    const observer = new ResizeObserver(() => fitAddon.fit())
    observer.observe(containerRef.current)

    return () => {
      unlistenRef.current?.()
      observer.disconnect()
      term.dispose()
    }
  }, [session])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: surface.canvas,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '40px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #1a1c22',
          background: '#0e0f13',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '12px', color: '#9aa0ad', fontFamily: font.mono }}>
          Terminal · {session ? `session ${session.id.slice(0, 8)}` : 'no active session'}
        </span>
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', padding: '4px' }}
      />
    </div>
  )
}

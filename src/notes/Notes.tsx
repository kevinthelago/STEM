import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { surface, border, accent, text, font } from '@/theme'
import { Button } from '@/lib/components/Button'
import { useNotesStore } from '@/app/store'
import type { Note } from '@/lib/types'

interface NotesProps {
  topicId?: string
}

export function Notes({ topicId }: NotesProps) {
  const { notes, searchResults, searchQuery, activeNoteId, loading, loadNotes, search, clearSearch, save, remove, setActiveNote } =
    useNotesStore()
  const [editContent, setEditContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [dirty, setDirty] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadNotes(topicId ?? null)
  }, [topicId, loadNotes])

  const displayNotes = searchResults ?? notes
  const activeNote = displayNotes.find((n) => n.id === activeNoteId) ?? null

  // Load note into editor only when the selected note ID changes (not on every content update)
  useEffect(() => {
    if (activeNote) {
      setEditContent(activeNote.content)
      setDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id])

  function handleContentChange(val: string) {
    setEditContent(val)
    setDirty(true)
    // Auto-save after 1s idle
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (activeNote) {
        save({ ...activeNote, content: val })
        setDirty(false)
      }
    }, 1000)
  }

  async function handleNewNote() {
    const note = await save({ topicId: topicId ?? null, content: '' })
    setActiveNote(note.id)
    setEditContent('')
  }

  async function handleDeleteNote() {
    if (!activeNote) return
    await remove(activeNote.id)
    setActiveNote(null)
    setEditContent('')
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        background: surface.panel,
        overflow: 'hidden',
      }}
    >
      {/* Notes list panel */}
      <div
        style={{
          width: '260px',
          flexShrink: 0,
          borderRight: `1px solid ${border.inner}`,
          display: 'flex',
          flexDirection: 'column',
          background: surface.overlay,
        }}
      >
        {/* Search bar */}
        <div style={{ padding: '12px 12px 8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              if (e.target.value) search(e.target.value)
              else clearSearch()
            }}
            placeholder="Search notes…"
            style={{
              width: '100%',
              height: '34px',
              padding: '0 11px',
              background: surface.panel,
              border: `1px solid ${border.subtle}`,
              borderRadius: '7px',
              fontSize: '12.5px',
              color: text.secondary,
              fontFamily: font.ui,
            }}
          />
        </div>

        {/* New note button */}
        <div style={{ padding: '0 12px 8px' }}>
          <Button variant="secondary" size="sm" onClick={handleNewNote} style={{ width: '100%' }}>
            + New note
          </Button>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: text.placeholder, fontSize: '12px' }}>
              Loading…
            </div>
          )}
          {!loading && displayNotes.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: text.placeholder, fontSize: '12px' }}>
              {searchQuery ? 'No results' : 'No notes yet'}
            </div>
          )}
          {displayNotes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              active={note.id === activeNoteId}
              onClick={() => setActiveNote(note.id)}
            />
          ))}
        </div>
      </div>

      {/* Editor panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeNote ? (
          <>
            {/* Editor toolbar */}
            <div
              style={{
                height: '46px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                borderBottom: `1px solid ${border.inner}`,
              }}
            >
              <button
                onClick={() => setPreview(false)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontFamily: font.ui,
                  background: !preview ? accent.tint : 'transparent',
                  border: !preview ? `1px solid ${accent.border}` : `1px solid transparent`,
                  color: !preview ? accent.text : text.muted,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => setPreview(true)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontFamily: font.ui,
                  background: preview ? accent.tint : 'transparent',
                  border: preview ? `1px solid ${accent.border}` : `1px solid transparent`,
                  color: preview ? accent.text : text.muted,
                  cursor: 'pointer',
                }}
              >
                Preview
              </button>
              <div style={{ flex: 1 }} />
              {dirty && (
                <span style={{ fontSize: '11px', color: text.placeholder }}>saving…</span>
              )}
              <Button variant="danger" size="sm" onClick={handleDeleteNote}>
                Delete
              </Button>
            </div>

            {/* Editor / Preview */}
            {!preview ? (
              <textarea
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write in markdown — math with $…$ or $$…$$"
                style={{
                  flex: 1,
                  padding: '24px 28px',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: text.secondary,
                  background: surface.panel,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: font.mono,
                }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 28px',
                  fontSize: '14px',
                  lineHeight: 1.72,
                  color: text.secondary,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {editContent || '*No content*'}
                </ReactMarkdown>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: text.placeholder,
              fontSize: '13px',
            }}
          >
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  )
}

function NoteListItem({
  note,
  active,
  onClick,
}: {
  note: Note
  active: boolean
  onClick(): void
}) {
  const preview = note.content.split('\n')[0]?.slice(0, 60) ?? 'Empty note'
  const date = new Date(note.updatedAt).toLocaleDateString()

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        padding: '10px 14px',
        width: '100%',
        textAlign: 'left',
        background: active ? accent.activeBg : 'transparent',
        boxShadow: active ? `inset 2px 0 0 ${accent.primary}` : 'none',
        border: 'none',
        borderBottom: `1px solid ${border.inner}`,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          fontSize: '12.5px',
          color: active ? text.primary : text.secondary,
          fontWeight: active ? 500 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {preview || 'Empty note'}
      </span>
      <span style={{ fontSize: '10.5px', color: text.placeholder, fontFamily: font.mono }}>
        {date}
      </span>
    </button>
  )
}

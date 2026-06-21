import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { surface, border, accent, text, font, mastery as masteryColors } from '@/theme'
import { useCurriculumStore, useNavStore } from './store'
import type { MasteryLevel } from '@/theme'
import type { Topic, Subject } from '@/lib/types'

interface CommandPaletteProps {
  open: boolean
  onClose(): void
}

type TopicItem = { kind: 'topic'; topic: Topic; subject: Subject }
type ActionItem = { kind: 'action'; id: string; label: string; onSelect(): void }
type PaletteItem = TopicItem | ActionItem

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { subjects, topicsBySubject } = useCurriculumStore()
  const { navigateTo } = useNavStore()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        kind: 'action',
        id: 'dashboard',
        label: 'Dashboard',
        onSelect: () => {
          navigateTo({ type: 'dashboard' })
          onClose()
        },
      },
      {
        kind: 'action',
        id: 'notes',
        label: 'Notes',
        onSelect: () => {
          navigateTo({ type: 'notes' })
          onClose()
        },
      },
      {
        kind: 'action',
        id: 'review',
        label: 'Review',
        onSelect: () => {
          navigateTo({ type: 'review' })
          onClose()
        },
      },
      {
        kind: 'action',
        id: 'settings',
        label: 'Settings',
        onSelect: () => {
          navigateTo({ type: 'settings' })
          onClose()
        },
      },
    ],
    [navigateTo, onClose],
  )

  const { topicItems, filteredActions } = useMemo(() => {
    const q = query.toLowerCase()

    const matchedTopics: TopicItem[] = subjects.flatMap((subject) =>
      (topicsBySubject[subject.id] ?? [])
        .filter((t) => !q || t.title.toLowerCase().includes(q))
        .map((topic): TopicItem => ({ kind: 'topic', topic, subject })),
    )

    const matchedActions: ActionItem[] = q
      ? actions.filter((a) => a.label.toLowerCase().includes(q))
      : actions

    return { topicItems: matchedTopics, filteredActions: matchedActions }
  }, [query, subjects, topicsBySubject, actions])

  const items: PaletteItem[] = [...topicItems, ...filteredActions]

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      if (item.kind === 'action') {
        item.onSelect()
      } else {
        useCurriculumStore.getState().setActiveTopic(item.topic.id)
        navigateTo({
          type: 'mode',
          mode: 'learn',
          topicId: item.topic.id,
          subjectId: item.subject.id,
        })
        onClose()
      }
    },
    [navigateTo, onClose],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => {
        const next = Math.min(i + 1, items.length - 1)
        scrollItemIntoView(next)
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => {
        const next = Math.max(i - 1, 0)
        scrollItemIntoView(next)
        return next
      })
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      handleSelect(items[selectedIndex])
    }
  }

  function scrollItemIntoView(idx: number) {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${idx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }

  if (!open) return null

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 100,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: 'fixed',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          maxHeight: '440px',
          background: surface.overlay,
          border: `1px solid ${border.card}`,
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 101,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderBottom: `1px solid ${border.inner}`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="4.5" stroke="#626878" strokeWidth="1.5" />
            <line
              x1="9.8"
              y1="9.8"
              x2="13"
              y2="13"
              stroke="#626878"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search topics, jump to mode…"
            style={{
              flex: 1,
              fontSize: '14px',
              color: text.primary,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: font.ui,
            }}
          />
          <span
            style={{
              fontSize: '10.5px',
              color: text.disabled,
              fontFamily: font.mono,
              flexShrink: 0,
            }}
          >
            ESC
          </span>
        </div>

        {/* Results list */}
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {/* Topics section */}
          {topicItems.length > 0 && (
            <>
              <SectionHeader label="Topics" />
              {topicItems.map((item, i) => {
                const isSelected = i === selectedIndex
                const color = masteryColors[item.topic.masteryLevel as MasteryLevel]
                return (
                  <PaletteRow
                    key={item.topic.id}
                    dataIdx={i}
                    selected={isSelected}
                    onClick={() => handleSelect(item)}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{ flex: 1, fontSize: '13px', color: text.secondary, textAlign: 'left' }}
                    >
                      {item.topic.title}
                    </span>
                    <span style={{ fontSize: '11px', color: text.placeholder }}>
                      {item.subject.title}
                    </span>
                  </PaletteRow>
                )
              })}
            </>
          )}

          {/* Actions section */}
          {filteredActions.length > 0 && (
            <>
              <SectionHeader label="Actions" />
              {filteredActions.map((item, i) => {
                const idx = topicItems.length + i
                const isSelected = idx === selectedIndex
                return (
                  <PaletteRow
                    key={item.id}
                    dataIdx={idx}
                    selected={isSelected}
                    onClick={() => handleSelect(item)}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '5px',
                        background: surface.raised,
                        border: `1px solid ${border.subtle}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '2px',
                          background: accent.primary,
                          opacity: isSelected ? 1 : 0.4,
                        }}
                      />
                    </span>
                    <span style={{ fontSize: '13px', color: text.secondary }}>{item.label}</span>
                  </PaletteRow>
                )
              })}
            </>
          )}

          {items.length === 0 && query && (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: text.placeholder,
                fontSize: '13px',
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '8px 16px 4px',
        fontSize: '10px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: text.placeholder,
        fontFamily: font.ui,
      }}
    >
      {label}
    </div>
  )
}

function PaletteRow({
  children,
  selected,
  dataIdx,
  onClick,
}: {
  children: React.ReactNode
  selected: boolean
  dataIdx: number
  onClick(): void
}) {
  return (
    <button
      data-idx={dataIdx}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 16px',
        width: '100%',
        background: selected ? accent.activeBg : 'transparent',
        boxShadow: selected ? `inset 2px 0 0 ${accent.primary}` : 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {children}
    </button>
  )
}

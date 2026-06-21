import { surface, border, accent, text, font, mastery as masteryColors } from '@/theme'
import { useCurriculumStore, useNavStore } from './store'
import type { Subject, Topic } from '@/lib/types'
import type { MasteryLevel } from '@/theme'

export function Sidebar() {
  const { subjects, topicsBySubject, expandedSubjects, activeTopicId, toggleSubject } =
    useCurriculumStore()
  const { view, navigateTo, openCommandPalette } = useNavStore()

  function handleTopicClick(topic: Topic, subject: Subject) {
    useCurriculumStore.getState().setActiveTopic(topic.id)
    navigateTo({
      type: 'mode',
      mode: view.type === 'mode' ? view.mode : 'learn',
      topicId: topic.id,
      subjectId: subject.id,
    })
  }

  // Suggested next topic: first unstarted or learning topic without prereqs met
  const suggestedNext = (() => {
    for (const s of subjects) {
      const topics = topicsBySubject[s.id] ?? []
      const next = topics.find((t) => t.masteryLevel === 'unstarted' || t.masteryLevel === 'learning')
      if (next) return { topic: next, subject: s }
    }
    return null
  })()

  return (
    <aside
      style={{
        width: '266px',
        flexShrink: 0,
        background: surface.overlay,
        borderRight: `1px solid ${border.inner}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Search / command palette trigger */}
      <div style={{ padding: '12px 12px 10px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            height: '34px',
            padding: '0 11px',
            background: surface.panel,
            border: `1px solid ${border.subtle}`,
            borderRadius: '7px',
            width: '100%',
            cursor: 'pointer',
          }}
          onClick={openCommandPalette}
        >
          <span style={{ fontFamily: font.mono, fontSize: '12px', color: text.disabled }}>⌘K</span>
          <span style={{ fontSize: '12.5px', color: text.placeholder }}>
            Search topics, jump to mode…
          </span>
        </button>
      </div>

      {/* Topic tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px' }}>
        {subjects.map((subject) => (
          <SubjectSection
            key={subject.id}
            subject={subject}
            topics={topicsBySubject[subject.id] ?? []}
            expanded={expandedSubjects.has(subject.id)}
            activeTopicId={activeTopicId}
            onToggle={() => toggleSubject(subject.id)}
            onTopicClick={(t) => handleTopicClick(t, subject)}
          />
        ))}
      </div>

      {/* Suggested next footer */}
      {suggestedNext && (
        <div
          style={{
            borderTop: `1px solid ${border.inner}`,
            padding: '11px 14px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: text.placeholder,
              marginBottom: '6px',
            }}
          >
            Suggested next
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() =>
              suggestedNext && handleTopicClick(suggestedNext.topic, suggestedNext.subject)
            }
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: masteryColors[suggestedNext.topic.masteryLevel],
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px', color: accent.text }}>
              {suggestedNext.topic.title}
            </span>
          </button>
        </div>
      )}
    </aside>
  )
}

function SubjectSection({
  subject,
  topics,
  expanded,
  activeTopicId,
  onToggle,
  onTopicClick,
}: {
  subject: Subject
  topics: Topic[]
  expanded: boolean
  activeTopicId: string | null
  onToggle(): void
  onTopicClick(topic: Topic): void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '7px 8px 6px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '9px', color: text.muted, width: '9px', flexShrink: 0 }}>
          {expanded ? '▾' : '▸'}
        </span>
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: expanded ? text.secondary : text.dimmed,
            fontWeight: 600,
            flex: 1,
            textAlign: 'left',
          }}
        >
          {subject.title}
        </span>
        <span style={{ fontFamily: font.mono, fontSize: '10px', color: text.placeholder }}>
          {subject.mastery > 0 ? Math.round(subject.mastery) : subject.topicCount}
        </span>
      </button>

      {expanded &&
        topics.map((topic) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            active={topic.id === activeTopicId}
            onClick={() => onTopicClick(topic)}
          />
        ))}
    </div>
  )
}

function TopicRow({
  topic,
  active,
  onClick,
}: {
  topic: Topic
  active: boolean
  onClick(): void
}) {
  const color = masteryColors[topic.masteryLevel as MasteryLevel]
  const dimText = topic.masteryLevel === 'unstarted'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: active ? '6px 10px 6px 21px' : '6px 10px 6px 24px',
        borderRadius: '6px',
        width: '100%',
        background: active ? accent.activeBg : 'transparent',
        boxShadow: active ? `inset 2px 0 0 ${accent.primary}` : 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {topic.isCapstone ? (
        <span style={{ fontSize: '9px', color: accent.primary, flexShrink: 0 }}>◆</span>
      ) : (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          flex: 1,
          fontSize: '12.5px',
          color: active ? text.primary : dimText ? text.dimmed : text.muted,
          fontWeight: active ? 500 : 400,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {topic.title}
      </span>
      {topic.prerequisites.length > 0 && topic.masteryLevel === 'unstarted' ? (
        <span style={{ fontSize: '10px', color: '#a06a3a' }} title="prerequisite unmet">
          ⚠
        </span>
      ) : (
        <span
          style={{
            fontFamily: font.mono,
            fontSize: '10px',
            color: topic.masteryScore > 0 ? color : text.disabled,
          }}
        >
          {topic.masteryScore > 0 ? topic.masteryScore : '—'}
        </span>
      )}
    </button>
  )
}

import { surface, border, accent, text, font, mastery as masteryColors } from '@/theme'
import type { MasteryLevel } from '@/theme'
import type { Subject, Topic } from '@/lib/types'

export interface CurriculumTreeProps {
  subjects: Subject[]
  topicsBySubject: Record<string, Topic[]>
  expandedSubjects: Set<string>
  activeTopicId: string | null
  onToggleSubject(subjectId: string): void
  onTopicClick(topic: Topic, subject: Subject): void
}

/**
 * The collapsible curriculum tree: subjects → topics with mastery dots,
 * prerequisite warnings, and active-topic highlight.
 * Consumed by the shell Sidebar and any other surface that needs the tree.
 */
export function CurriculumTree({
  subjects,
  topicsBySubject,
  expandedSubjects,
  activeTopicId,
  onToggleSubject,
  onTopicClick,
}: CurriculumTreeProps) {
  return (
    <div style={{ padding: '2px 8px' }}>
      {subjects.length === 0 && (
        <div
          style={{
            padding: '24px 12px',
            textAlign: 'center',
            fontSize: '12px',
            color: text.placeholder,
          }}
        >
          No subjects loaded yet.
        </div>
      )}
      {subjects.map((subject) => (
        <SubjectSection
          key={subject.id}
          subject={subject}
          topics={topicsBySubject[subject.id] ?? []}
          expanded={expandedSubjects.has(subject.id)}
          activeTopicId={activeTopicId}
          onToggle={() => onToggleSubject(subject.id)}
          onTopicClick={(t) => onTopicClick(t, subject)}
        />
      ))}
    </div>
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
  const hasUnmetPrereq = topic.prerequisites.length > 0 && topic.masteryLevel === 'unstarted'

  return (
    <button
      onClick={onClick}
      title={hasUnmetPrereq ? 'Prerequisites not yet met — you can still explore this topic' : undefined}
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
      {hasUnmetPrereq ? (
        <span style={{ fontSize: '10px', color: '#a06a3a' }}>⚠</span>
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

// ── Suggested-next footer ─────────────────────────────────────────────────────

export interface SuggestedNextProps {
  topic: Topic
  onClick(): void
}

export function SuggestedNext({ topic, onClick }: SuggestedNextProps) {
  const color = masteryColors[topic.masteryLevel as MasteryLevel]
  return (
    <div style={{ borderTop: `1px solid ${border.inner}`, padding: '11px 14px' }}>
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
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
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
        <span style={{ fontSize: '12px', color: accent.text }}>{topic.title}</span>
      </button>
    </div>
  )
}

// ── Problem-set progress strip (Practice mode sidebar footer) ─────────────────

export interface ProblemSetProgressProps {
  correct: number
  total: number
}

export function ProblemSetProgress({ correct, total }: ProblemSetProgressProps) {
  const dots = Math.max(total, 5)
  return (
    <div style={{ borderTop: `1px solid ${border.inner}`, padding: '11px 14px' }}>
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: text.placeholder,
          marginBottom: '8px',
        }}
      >
        Problem set
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i < correct ? masteryColors.mastered : surface.raised,
                border: i < correct ? 'none' : `1px solid ${border.subtle}`,
              }}
            />
          ))}
        </div>
        <span style={{ fontFamily: font.mono, fontSize: '10px', color: text.placeholder }}>
          {correct} / {total}
        </span>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useMasteryStore } from './masteryStore'
import { TopicCard } from './components/TopicCard'
import { TrendChart } from './components/TrendChart'
import { WeakAreas } from './components/WeakAreas'
import { StudyNext } from './components/StudyNext'
import { surface, border, text, accent, mastery as masteryTokens, font, radius } from '@/theme'
import type { MasteryLevel } from '@/theme'
import type { Topic } from './api'

function masteryLevel(score: number): MasteryLevel {
  if (score >= 80) return 'mastered'
  if (score >= 50) return 'proficient'
  if (score > 0) return 'learning'
  return 'unstarted'
}

interface SubjectChipProps {
  subject: string
  avgMastery: number
  selected: boolean
  onClick: () => void
}

function SubjectChip({ subject, avgMastery, selected, onClick }: SubjectChipProps) {
  const level = masteryLevel(avgMastery)
  const color = masteryTokens[level]
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 14px',
        border: `1px solid ${selected ? accent.border : border.card}`,
        borderRadius: radius.xl,
        background: selected ? accent.activeBg : surface.raised,
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 130,
        fontFamily: font.ui,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: selected ? text.primary : text.secondary }}>
          {subject}
        </span>
        <span style={{ fontFamily: font.mono, fontSize: 12, color }}>
          {avgMastery}
        </span>
      </div>
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: surface.track,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${avgMastery}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </button>
  )
}

export function MasteryDashboard() {
  const {
    topics,
    masteryRecords,
    isLoading,
    error,
    load,
    masteryByTopic,
    computedWeakAreas,
    recommendedNext,
    subjectGroups,
  } = useMasteryStore()

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: text.muted,
          fontSize: 13,
          fontFamily: font.ui,
        }}
      >
        Loading mastery data…
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          color: '#e0625f',
          fontSize: 13,
          fontFamily: font.ui,
        }}
      >
        Error loading mastery data: {error}
      </div>
    )
  }

  const byTopic = masteryByTopic()
  const groups = subjectGroups()
  const next = recommendedNext()
  const nextMastery = next ? (byTopic[next.id] ?? 0) : 0
  const weak = computedWeakAreas()

  const visibleTopics = topics.filter((t) => {
    if (selectedSubject && t.subject !== selectedSubject) return false
    if (filter && !t.name.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const selectedTopicRecords = selectedTopic
    ? masteryRecords.filter((r) => r.topic_id === selectedTopic.id)
    : []

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        fontFamily: font.ui,
        background: surface.base,
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: text.primary,
            margin: '0 0 2px',
            letterSpacing: '0.01em',
          }}
        >
          Mastery Dashboard
        </h1>
        <div style={{ fontSize: 12, color: text.placeholder }}>
          Track your progress across all topics
        </div>
      </div>

      {/* Subject overview */}
      <section>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: text.placeholder,
            fontFamily: font.mono,
            marginBottom: 10,
          }}
        >
          By subject
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {groups.map(({ subject, avgMastery }) => (
            <SubjectChip
              key={subject}
              subject={subject}
              avgMastery={avgMastery}
              selected={selectedSubject === subject}
              onClick={() =>
                setSelectedSubject(selectedSubject === subject ? null : subject)
              }
            />
          ))}
        </div>
      </section>

      {/* Main grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Topic list */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: text.placeholder,
                fontFamily: font.mono,
              }}
            >
              Topics {visibleTopics.length > 0 && `(${visibleTopics.length})`}
            </div>
            <input
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '4px 10px',
                border: `1px solid ${border.subtle}`,
                borderRadius: radius.md,
                fontSize: 12,
                background: surface.input,
                color: text.secondary,
                fontFamily: font.ui,
                outline: 'none',
                width: 140,
              }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 6,
            }}
          >
            {visibleTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                mastery={byTopic[topic.id] ?? 0}
                onClick={() =>
                  setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)
                }
              />
            ))}
            {visibleTopics.length === 0 && (
              <div style={{ color: text.placeholder, fontSize: 13, padding: '16px 0' }}>
                No topics match your filter.
              </div>
            )}
          </div>
        </section>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StudyNext topic={next} mastery={nextMastery} />

          {selectedTopic ? (
            <section>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: text.placeholder,
                  fontFamily: font.mono,
                  marginBottom: 10,
                }}
              >
                Trend — {selectedTopic.name}
              </div>
              <div
                style={{
                  background: surface.panel,
                  border: `1px solid ${border.inner}`,
                  borderRadius: radius.xl,
                  padding: 16,
                  overflow: 'hidden',
                }}
              >
                <TrendChart
                  records={selectedTopicRecords}
                  topicName={selectedTopic.name}
                  width={288}
                  height={160}
                />
              </div>
            </section>
          ) : (
            <div
              style={{
                color: text.placeholder,
                fontSize: 12,
                padding: '24px 0',
                textAlign: 'center',
                border: `1px dashed ${border.subtle}`,
                borderRadius: radius.xl,
              }}
            >
              Select a topic to see its trend
            </div>
          )}
        </div>
      </div>

      {/* Weak areas */}
      {weak.length > 0 && (
        <section>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: text.placeholder,
              fontFamily: font.mono,
              marginBottom: 10,
            }}
          >
            Weak areas ({weak.length})
          </div>
          <WeakAreas
            topics={weak}
            masteryByTopic={byTopic}
            allRecords={masteryRecords}
          />
        </section>
      )}
    </div>
  )
}

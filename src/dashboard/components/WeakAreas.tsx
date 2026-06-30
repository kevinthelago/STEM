import { surface, border, text, accent, mastery as masteryTokens, grade, font, radius } from '@/theme'
import type { Topic, MasteryRecord } from '../api'
import { computeMasteryScore, DEFAULT_WEIGHTS } from '../masteryModel'

interface WeakAreasProps {
  topics: Topic[]
  masteryByTopic: Record<string, number>
  allRecords: MasteryRecord[]
  onStudyNow?: (topic: Topic) => void
}

const SIGNALS = ['problem', 'explain', 'capstone', 'retention'] as const

const SIGNAL_COLORS: Record<string, string> = {
  problem: masteryTokens.proficient,
  explain: masteryTokens.learning,
  capstone: masteryTokens.mastered,
  retention: grade.wrong,
}

export function WeakAreas({ topics, masteryByTopic, allRecords, onStudyNow }: WeakAreasProps) {
  const weak = topics
    .filter((t) => (masteryByTopic[t.id] ?? 0) < 50)
    .sort((a, b) => (masteryByTopic[a.id] ?? 0) - (masteryByTopic[b.id] ?? 0))

  if (weak.length === 0) {
    return (
      <div
        style={{
          color: text.muted,
          fontSize: 13,
          padding: '16px 0',
          fontFamily: font.ui,
        }}
      >
        No weak areas — great work!
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {weak.map((topic) => {
        const topicRecords = allRecords.filter((r) => r.topic_id === topic.id)
        const signalScores = SIGNALS.map((signal) => {
          const sigRecs = topicRecords.filter((r) => r.signal === signal)
          return {
            signal,
            score: sigRecs.length > 0 ? computeMasteryScore(sigRecs, DEFAULT_WEIGHTS) : 0,
          }
        })
        const score = masteryByTopic[topic.id] ?? 0

        return (
          <div
            key={topic.id}
            style={{
              border: `1px solid ${border.card}`,
              borderRadius: radius.xl,
              padding: '12px 14px',
              background: surface.raised,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 13,
                  color: text.secondary,
                  fontFamily: font.ui,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {topic.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: text.placeholder,
                  marginBottom: 8,
                  fontFamily: font.ui,
                }}
              >
                {topic.subject} — {score}/100
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                {signalScores.map(({ signal, score: sigScore }) => (
                  <div
                    key={signal}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 4,
                        borderRadius: 2,
                        background: surface.track,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${sigScore}%`,
                          height: '100%',
                          background: SIGNAL_COLORS[signal],
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        color: text.placeholder,
                        fontFamily: font.mono,
                        textTransform: 'uppercase',
                      }}
                    >
                      {signal[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {onStudyNow && (
              <button
                onClick={() => onStudyNow(topic)}
                style={{
                  padding: '6px 12px',
                  background: grade.wrongBg,
                  color: grade.wrong,
                  border: `1px solid ${grade.wrongBorder}`,
                  borderRadius: radius.md,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontFamily: font.ui,
                }}
              >
                Study now
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

import type { Topic, MasteryRecord } from "../api";
import { computeMasteryScore, DEFAULT_WEIGHTS } from "../masteryModel";

interface WeakAreasProps {
  topics: Topic[];
  masteryByTopic: Record<string, number>;
  allRecords: MasteryRecord[];
  onStudyNow?: (topic: Topic) => void;
}

const SIGNALS = ["problem", "explain", "capstone", "retention"] as const;
const SIGNAL_COLORS: Record<string, string> = {
  problem: "#6366f1",
  explain: "#f59e0b",
  capstone: "#10b981",
  retention: "#ef4444",
};

export function WeakAreas({ topics, masteryByTopic, allRecords, onStudyNow }: WeakAreasProps) {
  const weak = topics
    .filter((t) => (masteryByTopic[t.id] ?? 0) < 50)
    .sort((a, b) => (masteryByTopic[a.id] ?? 0) - (masteryByTopic[b.id] ?? 0));

  if (weak.length === 0) {
    return (
      <div style={{ color: "#6b7280", fontSize: 14, padding: "16px 0" }}>
        No weak areas — great work!
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {weak.map((topic) => {
        const topicRecords = allRecords.filter((r) => r.topic_id === topic.id);
        const signalScores = SIGNALS.map((signal) => {
          const sigRecs = topicRecords.filter((r) => r.signal === signal);
          return {
            signal,
            score: sigRecs.length > 0 ? computeMasteryScore(sigRecs, DEFAULT_WEIGHTS) : 0,
          };
        });

        return (
          <div
            key={topic.id}
            style={{
              border: "1px solid #fee2e2",
              borderRadius: 8,
              padding: "12px 16px",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{topic.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                {topic.subject} — {masteryByTopic[topic.id] ?? 0}/100
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {signalScores.map(({ signal, score }) => (
                  <div key={signal} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div
                      style={{
                        width: 24,
                        height: 4,
                        borderRadius: 2,
                        background: "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${score}%`,
                          height: "100%",
                          background: SIGNAL_COLORS[signal],
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 9, color: "#9ca3af" }}>{signal[0].toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
            {onStudyNow && (
              <button
                onClick={() => onStudyNow(topic)}
                style={{
                  padding: "6px 12px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Study now
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

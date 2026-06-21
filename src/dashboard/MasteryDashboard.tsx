import { useEffect, useState } from "react";
import { useMasteryStore } from "./masteryStore";
import { TopicCard } from "./components/TopicCard";
import { TrendChart } from "./components/TrendChart";
import { WeakAreas } from "./components/WeakAreas";
import { StudyNext } from "./components/StudyNext";
import type { Topic } from "./api";

interface SubjectOverviewProps {
  groups: Array<{ subject: string; topics: Topic[]; avgMastery: number }>;
  selectedSubject: string | null;
  onSelect: (subject: string | null) => void;
}

function SubjectOverview({ groups, selectedSubject, onSelect }: SubjectOverviewProps) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {groups.map(({ subject, avgMastery }) => {
        const isSelected = selectedSubject === subject;
        const color = avgMastery >= 70 ? "#22c55e" : avgMastery >= 50 ? "#eab308" : "#ef4444";
        return (
          <button
            key={subject}
            onClick={() => onSelect(isSelected ? null : subject)}
            style={{
              padding: "10px 16px",
              border: `2px solid ${isSelected ? "#6366f1" : "#e5e7eb"}`,
              borderRadius: 8,
              background: isSelected ? "#eef2ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              minWidth: 140,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20, color }}>{avgMastery}</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{subject}</div>
            <div
              style={{
                marginTop: 6,
                height: 4,
                borderRadius: 2,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${avgMastery}%`,
                  height: "100%",
                  background: color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
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
  } = useMasteryStore();

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#6b7280" }}>
        Loading mastery data…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: "#ef4444" }}>
        Error loading mastery data: {error}
      </div>
    );
  }

  const byTopic = masteryByTopic();
  const groups = subjectGroups();
  const next = recommendedNext();
  const nextMastery = next ? (byTopic[next.id] ?? 0) : 0;
  const weak = computedWeakAreas();

  const visibleTopics = topics.filter((t) => {
    if (selectedSubject && t.subject !== selectedSubject) return false;
    if (filter && !t.name.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const selectedTopicRecords = selectedTopic
    ? masteryRecords.filter((r) => r.topic_id === selectedTopic.id)
    : [];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Mastery Dashboard</h1>

      {/* Subject overview */}
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 12 }}>By subject</h2>
        <SubjectOverview groups={groups} selectedSubject={selectedSubject} onSelect={setSelectedSubject} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Topic grid */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: 0 }}>Topics</h2>
            <input
              placeholder="Filter topics…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {visibleTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                mastery={byTopic[topic.id] ?? 0}
                onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
              />
            ))}
          </div>
        </section>

        {/* Right panel: trend + study next */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {selectedTopic ? (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                Trend — {selectedTopic.name}
              </h2>
              <TrendChart
                records={selectedTopicRecords}
                topicName={selectedTopic.name}
                width={460}
                height={200}
              />
            </section>
          ) : (
            <div style={{ color: "#9ca3af", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
              Select a topic to see its trend
            </div>
          )}

          <StudyNext topic={next} mastery={nextMastery} />
        </div>
      </div>

      {/* Weak areas */}
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
          Weak areas ({weak.length})
        </h2>
        <WeakAreas
          topics={weak}
          masteryByTopic={byTopic}
          allRecords={masteryRecords}
        />
      </section>
    </div>
  );
}

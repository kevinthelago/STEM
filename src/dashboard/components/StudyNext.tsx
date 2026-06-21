import type { Topic } from "../api";

interface StudyNextProps {
  topic: Topic | null;
  mastery: number;
  onStart?: (topic: Topic) => void;
}

export function StudyNext({ topic, mastery, onStart }: StudyNextProps) {
  if (!topic) {
    return (
      <div
        style={{
          border: "1px dashed #d1d5db",
          borderRadius: 8,
          padding: 20,
          textAlign: "center",
          color: "#9ca3af",
          fontSize: 14,
        }}
      >
        No recommendations yet — complete more topics to unlock suggestions.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #818cf8",
        borderRadius: 8,
        padding: 20,
        background: "#eef2ff",
      }}
    >
      <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        Study next
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#111827", marginBottom: 2 }}>
        {topic.name}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
        {topic.subject} · current mastery {mastery}/100
      </div>
      <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 16 }}>
        {mastery < 30
          ? "This topic needs significant work — start here to build foundations."
          : mastery < 60
          ? "You have some familiarity — review and practice to solidify understanding."
          : "Almost there — a focused review session should push you over 70."}
      </div>
      {onStart && (
        <button
          onClick={() => onStart(topic)}
          style={{
            padding: "8px 20px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Start studying
        </button>
      )}
    </div>
  );
}

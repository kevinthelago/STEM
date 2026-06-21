import type { Topic } from "../api";

interface TopicCardProps {
  topic: Topic;
  mastery: number;
  onClick?: () => void;
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function ProgressRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TopicCard({ topic, mastery, onClick }: TopicCardProps) {
  const color = scoreColor(mastery);

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <ProgressRing score={mastery} />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color,
          }}
        >
          {mastery}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {topic.name}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{topic.subject}</div>
      </div>
    </button>
  );
}

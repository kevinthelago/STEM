import React from "react";
import { MATH_PREREQUISITES } from "../milestones";

interface PrerequisiteGateProps {
  prerequisiteMastery: Record<string, number>;
  onStudyCalculus?: () => void;
  onStudyLinearAlgebra?: () => void;
}

const TOPIC_LABELS: Record<string, string> = {
  derivatives: "Derivatives & Calculus",
  linear_algebra_basics: "Linear Algebra Basics",
};

export function PrerequisiteGate({
  prerequisiteMastery,
  onStudyCalculus,
  onStudyLinearAlgebra,
}: PrerequisiteGateProps) {
  const missing = Object.entries(MATH_PREREQUISITES).filter(
    ([topicId, required]) => (prerequisiteMastery[topicId] ?? 0) < required,
  );

  const actionFor = (topicId: string): (() => void) | undefined => {
    if (topicId === "derivatives") return onStudyCalculus;
    if (topicId === "linear_algebra_basics") return onStudyLinearAlgebra;
    return undefined;
  };

  return (
    <div style={styles.container}>
      <div style={styles.icon}>🔒</div>
      <h2 style={styles.heading}>Math Prerequisites Required</h2>
      <p style={styles.subtext}>
        The Neural-Net Capstone requires foundational math skills. Complete the
        following topics to unlock it:
      </p>
      <div style={styles.prereqList}>
        {missing.map(([topicId, required]) => {
          const current = prerequisiteMastery[topicId] ?? 0;
          const pct = Math.min(100, Math.round((current / required) * 100));
          const action = actionFor(topicId);
          return (
            <div key={topicId} style={styles.prereqCard}>
              <div style={styles.prereqHeader}>
                <span style={styles.prereqName}>
                  {TOPIC_LABELS[topicId] ?? topicId}
                </span>
                <span style={styles.prereqScore}>
                  {current.toFixed(0)} / {required}
                </span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{ ...styles.progressFill, width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={current}
                  aria-valuemin={0}
                  aria-valuemax={required}
                />
              </div>
              {action && (
                <button style={styles.studyBtn} onClick={action}>
                  Study{" "}
                  {topicId === "derivatives" ? "Calculus" : "Linear Algebra"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 32px",
    gap: 16,
    maxWidth: 480,
    margin: "0 auto",
  },
  icon: { fontSize: 48 },
  heading: { margin: 0, fontSize: 22, fontWeight: 700, textAlign: "center" },
  subtext: {
    margin: 0,
    color: "#666",
    textAlign: "center",
    lineHeight: 1.6,
  },
  prereqList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
    marginTop: 8,
  },
  prereqCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "16px 20px",
    borderRadius: 8,
    background: "#f8f8f8",
    border: "1px solid #e0e0e0",
  },
  prereqHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prereqName: { fontWeight: 600, fontSize: 15 },
  prereqScore: { fontSize: 13, color: "#888" },
  progressTrack: {
    height: 8,
    background: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#f59e0b",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  studyBtn: {
    alignSelf: "flex-start",
    padding: "6px 16px",
    borderRadius: 6,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
};

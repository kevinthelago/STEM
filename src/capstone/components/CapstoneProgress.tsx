import React from "react";
import type { Milestone, MilestoneId } from "../milestones";
import type { CapstoneProgress as CapstoneProgressRecord } from "../api";
import { MilestoneCard } from "./MilestoneCard";

interface CapstoneProgressProps {
  milestones: Milestone[];
  progress: CapstoneProgressRecord[];
  completionPercent: number;
  getMilestoneStatus: (id: MilestoneId) => CapstoneProgressRecord["status"];
  isUnlocked: (id: MilestoneId) => boolean;
  onBegin?: (id: MilestoneId) => void;
  onMarkComplete?: (id: MilestoneId, notes: string) => void;
}

export function CapstoneProgress({
  milestones,
  progress,
  completionPercent,
  getMilestoneStatus,
  isUnlocked,
  onBegin,
  onMarkComplete,
}: CapstoneProgressProps) {
  const allComplete = completionPercent === 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h2 style={styles.title}>Neural Network from Scratch</h2>
          <span style={styles.subtitle}>
            {completionPercent}% complete &mdash;{" "}
            {progress.filter((p) => p.status === "complete").length} of{" "}
            {milestones.length} milestones
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{ ...styles.progressFill, width: `${completionPercent}%` }}
            role="progressbar"
            aria-valuenow={completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {allComplete && (
        <div style={styles.completionBanner}>
          <div style={styles.completionIcon}>🎉</div>
          <div>
            <div style={styles.completionTitle}>
              Capstone Complete — You built a neural network from scratch!
            </div>
            <div style={styles.completionDetail}>
              You implemented scalar autograd, neurons, layers, backpropagation,
              a training loop, and model evaluation — the same foundations
              underlying PyTorch and JAX. You earned the Neural-Net mastery
              signal.
            </div>
          </div>
        </div>
      )}

      <div style={styles.milestoneList}>
        {milestones.map((milestone, idx) => {
          const status = getMilestoneStatus(milestone.id);
          const unlocked = isUnlocked(milestone.id);
          const effectiveStatus =
            status === "locked" && unlocked ? "unlocked" : status;
          const rec = progress.find((p) => p.milestone_id === milestone.id);

          return (
            <div key={milestone.id} style={styles.milestoneRow}>
              <div style={styles.stepIndicator}>
                <div
                  style={{
                    ...styles.stepBubble,
                    ...(effectiveStatus === "complete"
                      ? styles.stepComplete
                      : effectiveStatus === "in_progress"
                        ? styles.stepInProgress
                        : effectiveStatus === "unlocked"
                          ? styles.stepUnlocked
                          : styles.stepLocked),
                  }}
                >
                  {effectiveStatus === "complete" ? "✓" : idx + 1}
                </div>
                {idx < milestones.length - 1 && (
                  <div
                    style={{
                      ...styles.connector,
                      ...(effectiveStatus === "complete"
                        ? styles.connectorComplete
                        : {}),
                    }}
                  />
                )}
              </div>
              <div style={styles.milestoneCardWrap}>
                <MilestoneCard
                  milestone={milestone}
                  status={effectiveStatus}
                  completedAt={rec?.completed_at}
                  completionNotes={rec?.notes}
                  onBegin={
                    onBegin && effectiveStatus === "unlocked"
                      ? () => onBegin(milestone.id)
                      : undefined
                  }
                  onMarkComplete={
                    onMarkComplete && effectiveStatus === "in_progress"
                      ? (notes) => onMarkComplete(milestone.id, notes)
                      : undefined
                  }
                />
              </div>
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
    gap: 24,
    maxWidth: 720,
    margin: "0 auto",
    padding: "24px 0",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "0 4px",
  },
  headerText: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  subtitle: { fontSize: 13, color: "#6b7280" },
  progressTrack: {
    height: 10,
    background: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #22c55e)",
    borderRadius: 5,
    transition: "width 0.4s ease",
  },
  completionBanner: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    padding: "20px 24px",
    borderRadius: 10,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },
  completionIcon: { fontSize: 32, flexShrink: 0 },
  completionTitle: { fontWeight: 700, fontSize: 16, color: "#15803d" },
  completionDetail: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 1.6,
    marginTop: 4,
  },
  milestoneList: { display: "flex", flexDirection: "column", gap: 0 },
  milestoneRow: { display: "flex", gap: 0 },
  stepIndicator: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 40,
    flexShrink: 0,
  },
  stepBubble: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    border: "2px solid",
    flexShrink: 0,
    zIndex: 1,
    background: "#fff",
  },
  stepComplete: { borderColor: "#22c55e", color: "#22c55e" },
  stepInProgress: { borderColor: "#f59e0b", color: "#f59e0b" },
  stepUnlocked: { borderColor: "#3b82f6", color: "#3b82f6" },
  stepLocked: { borderColor: "#d1d5db", color: "#9ca3af" },
  connector: {
    width: 2,
    flex: 1,
    background: "#e5e7eb",
    minHeight: 24,
  },
  connectorComplete: { background: "#22c55e" },
  milestoneCardWrap: { flex: 1, paddingBottom: 16 },
};

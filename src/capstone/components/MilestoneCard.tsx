import React, { useState } from "react";
import type { Milestone } from "../milestones";
import type { CapstoneProgress } from "../api";

interface MilestoneCardProps {
  milestone: Milestone;
  status: CapstoneProgress["status"];
  completedAt?: string | null;
  completionNotes?: string | null;
  onBegin?: () => void;
  onMarkComplete?: (notes: string) => void;
}

export function MilestoneCard({
  milestone,
  status,
  completedAt,
  completionNotes,
  onBegin,
  onMarkComplete,
}: MilestoneCardProps) {
  const [checkedObjectives, setCheckedObjectives] = useState<Set<number>>(
    new Set(),
  );
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const toggleObjective = (i: number) => {
    setCheckedObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const cardStyle: React.CSSProperties = {
    ...styles.card,
    ...(status === "locked" ? styles.cardLocked : {}),
    ...(status === "complete" ? styles.cardComplete : {}),
  };

  const statusBadge =
    status === "locked"
      ? { label: "Locked", color: "#9ca3af" }
      : status === "unlocked"
        ? { label: "Ready", color: "#3b82f6" }
        : status === "in_progress"
          ? { label: "In Progress", color: "#f59e0b" }
          : { label: "Complete", color: "#22c55e" };

  return (
    <div style={cardStyle} aria-label={`Milestone: ${milestone.title}`}>
      <div style={styles.cardHeader}>
        <div style={styles.titleRow}>
          <span style={styles.milestoneTitle}>{milestone.title}</span>
          <span
            style={{
              ...styles.badge,
              background: statusBadge.color + "22",
              color: statusBadge.color,
            }}
          >
            {statusBadge.label}
          </span>
        </div>
        <p style={styles.description}>{milestone.description}</p>
      </div>

      {status === "locked" && (
        <div style={styles.lockedNote}>
          <span>🔒</span>
          <span>
            Complete{" "}
            {milestone.prerequisites.map((p) => <strong key={p}>{p}</strong>).reduce(
              (acc, el, i) =>
                i === 0 ? [el] : [...(acc as React.ReactNode[]), " and ", el],
              [] as React.ReactNode[],
            )}{" "}
            to unlock this milestone.
          </span>
        </div>
      )}

      {(status === "unlocked" || status === "in_progress") && (
        <div style={styles.objectivesList}>
          <span style={styles.sectionLabel}>Objectives</span>
          {milestone.objectives.map((obj, i) => (
            <label key={i} style={styles.objectiveRow}>
              <input
                type="checkbox"
                checked={checkedObjectives.has(i)}
                onChange={() => toggleObjective(i)}
                style={styles.checkbox}
              />
              <span
                style={{
                  ...styles.objectiveText,
                  ...(checkedObjectives.has(i) ? styles.objectiveStruck : {}),
                }}
              >
                {obj}
              </span>
            </label>
          ))}

          <div style={styles.references}>
            <span style={styles.sectionLabel}>References</span>
            {milestone.references.map((ref, i) => (
              <span key={i} style={styles.refItem}>
                📖 {ref}
              </span>
            ))}
          </div>

          {status === "unlocked" && onBegin && (
            <button style={styles.beginBtn} onClick={onBegin}>
              Begin Milestone
            </button>
          )}

          {status === "in_progress" && onMarkComplete && (
            <div style={styles.completeSection}>
              {showNotes ? (
                <>
                  <textarea
                    style={styles.notesArea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about what you built or learned (optional)…"
                    rows={4}
                  />
                  <div style={styles.completeActions}>
                    <button
                      style={styles.cancelBtn}
                      onClick={() => setShowNotes(false)}
                    >
                      Cancel
                    </button>
                    <button
                      style={styles.submitBtn}
                      onClick={() => onMarkComplete(notes)}
                    >
                      Mark Complete
                    </button>
                  </div>
                </>
              ) : (
                <button
                  style={styles.submitBtn}
                  onClick={() => setShowNotes(true)}
                >
                  Mark Complete ✓
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {status === "complete" && (
        <div style={styles.completedSection}>
          <div style={styles.completedBadge}>✅ Completed</div>
          {completedAt && (
            <span style={styles.completedDate}>
              {new Date(completedAt).toLocaleDateString()}
            </span>
          )}
          {completionNotes && (
            <p style={styles.completionNotes}>{completionNotes}</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 10,
    border: "1px solid #e0e0e0",
    background: "#fff",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardLocked: {
    background: "#fafafa",
    opacity: 0.7,
  },
  cardComplete: {
    borderColor: "#bbf7d0",
    background: "#f0fdf4",
  },
  cardHeader: { display: "flex", flexDirection: "column", gap: 8 },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  milestoneTitle: { fontWeight: 700, fontSize: 17 },
  badge: {
    padding: "2px 10px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  description: { margin: 0, color: "#555", fontSize: 14, lineHeight: 1.6 },
  lockedNote: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    color: "#9ca3af",
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#9ca3af",
    marginBottom: 4,
  },
  objectivesList: { display: "flex", flexDirection: "column", gap: 10 },
  objectiveRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    cursor: "pointer",
  },
  checkbox: { marginTop: 2, flexShrink: 0 },
  objectiveText: { fontSize: 14, color: "#374151", lineHeight: 1.5 },
  objectiveStruck: { textDecoration: "line-through", color: "#9ca3af" },
  references: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
  },
  refItem: { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
  beginBtn: {
    alignSelf: "flex-start",
    padding: "8px 20px",
    borderRadius: 6,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  completeSection: { display: "flex", flexDirection: "column", gap: 10 },
  notesArea: {
    width: "100%",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    fontSize: 14,
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  completeActions: { display: "flex", gap: 8 },
  submitBtn: {
    alignSelf: "flex-start",
    padding: "8px 20px",
    borderRadius: 6,
    border: "none",
    background: "#22c55e",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    cursor: "pointer",
  },
  completedSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  completedBadge: {
    fontWeight: 600,
    color: "#16a34a",
    fontSize: 14,
  },
  completedDate: { fontSize: 12, color: "#9ca3af" },
  completionNotes: {
    margin: 0,
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
};

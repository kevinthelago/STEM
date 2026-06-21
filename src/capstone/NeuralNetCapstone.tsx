import React, { useEffect } from "react";
import { useCapstoneStore } from "./capstoneStore";
import type { MilestoneId } from "./milestones";
import { PrerequisiteGate } from "./components/PrerequisiteGate";
import { CapstoneProgress } from "./components/CapstoneProgress";

interface NeuralNetCapstoneProps {
  onStudyCalculus?: () => void;
  onStudyLinearAlgebra?: () => void;
}

export function NeuralNetCapstone({
  onStudyCalculus,
  onStudyLinearAlgebra,
}: NeuralNetCapstoneProps) {
  const store = useCapstoneStore();

  useEffect(() => {
    store.load();
    // load is stable (zustand action), no re-run needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (store.isLoading) {
    return (
      <div style={styles.center}>
        <span style={styles.loading}>Loading capstone…</span>
      </div>
    );
  }

  if (store.error) {
    return (
      <div style={styles.center}>
        <span style={styles.error}>Error: {store.error}</span>
        <button style={styles.retryBtn} onClick={() => store.load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!store.arePrereqsMet()) {
    return (
      <div style={styles.page}>
        <PrerequisiteGate
          prerequisiteMastery={store.prerequisiteMastery}
          onStudyCalculus={onStudyCalculus}
          onStudyLinearAlgebra={onStudyLinearAlgebra}
        />
      </div>
    );
  }

  const handleBegin = async (id: MilestoneId) => {
    // Mark as in_progress by completing then backend tracks state;
    // for now the backend's complete_capstone_milestone transitions the state.
    // Starting a milestone is implicit — tutor session opens in Learn mode.
    // Here we just trigger a store reload to refresh status.
    await store.load();
    void id; // consumed by callers via navigation
  };

  const handleMarkComplete = async (id: MilestoneId, notes: string) => {
    await store.completeMilestone(id, notes);
  };

  return (
    <div style={styles.page}>
      <CapstoneProgress
        milestones={store.milestones}
        progress={store.progress}
        completionPercent={store.completionPercent()}
        getMilestoneStatus={(id) => store.getMilestoneStatus(id)}
        isUnlocked={(id) => store.isUnlocked(id)}
        onBegin={handleBegin}
        onMarkComplete={handleMarkComplete}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 24px",
    overflowY: "auto",
    height: "100%",
    boxSizing: "border-box",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 16,
  },
  loading: { color: "#6b7280", fontSize: 15 },
  error: { color: "#dc2626", fontSize: 15 },
  retryBtn: {
    padding: "8px 20px",
    borderRadius: 6,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

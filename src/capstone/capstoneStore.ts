import { create } from "zustand";
import {
  MILESTONES,
  MATH_PREREQUISITES,
  type Milestone,
  type MilestoneId,
} from "./milestones";
import {
  getCapstoneProgress,
  completeCapstoneMilestone,
  getTopicMastery,
  awardCapstoneMasterySignal,
  type CapstoneProgress,
} from "./api";

interface CapstoneStore {
  milestones: Milestone[];
  progress: CapstoneProgress[];
  prerequisiteMastery: Record<string, number>;
  isLoading: boolean;
  error: string | null;

  load(): Promise<void>;
  completeMilestone(milestoneId: MilestoneId, notes?: string): Promise<void>;

  getMilestoneStatus(id: MilestoneId): CapstoneProgress["status"];
  isUnlocked(id: MilestoneId): boolean;
  arePrereqsMet(): boolean;
  currentMilestone(): Milestone | null;
  completionPercent(): number;
}

export const useCapstoneStore = create<CapstoneStore>((set, get) => ({
  milestones: MILESTONES,
  progress: [],
  prerequisiteMastery: {},
  isLoading: false,
  error: null,

  async load() {
    set({ isLoading: true, error: null });
    try {
      const [progressData, masteryData] = await Promise.all([
        getCapstoneProgress(),
        getTopicMastery(Object.keys(MATH_PREREQUISITES)),
      ]);
      const prerequisiteMastery: Record<string, number> = {};
      for (const tm of masteryData) {
        prerequisiteMastery[tm.topic_id] = tm.composite_score;
      }
      set({ progress: progressData, prerequisiteMastery, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load capstone data",
        isLoading: false,
      });
    }
  },

  async completeMilestone(milestoneId, notes) {
    await completeCapstoneMilestone(milestoneId, notes);
    await awardCapstoneMasterySignal(milestoneId);
    const updated = await getCapstoneProgress();
    set({ progress: updated });
  },

  getMilestoneStatus(id) {
    const record = get().progress.find((p) => p.milestone_id === id);
    if (!record) return "locked";
    return record.status;
  },

  isUnlocked(id) {
    const milestone = get().milestones.find((m) => m.id === id);
    if (!milestone) return false;
    if (milestone.prerequisites.length === 0) return true;
    return milestone.prerequisites.every(
      (prereqId) => get().getMilestoneStatus(prereqId) === "complete",
    );
  },

  arePrereqsMet() {
    const { prerequisiteMastery } = get();
    return Object.entries(MATH_PREREQUISITES).every(
      ([topicId, required]) => (prerequisiteMastery[topicId] ?? 0) >= required,
    );
  },

  currentMilestone() {
    const store = get();
    // First in_progress milestone
    for (const m of store.milestones) {
      if (store.getMilestoneStatus(m.id) === "in_progress") return m;
    }
    // First unlocked (not complete) milestone
    for (const m of store.milestones) {
      const status = store.getMilestoneStatus(m.id);
      if (store.isUnlocked(m.id) && status !== "complete") return m;
    }
    return null;
  },

  completionPercent() {
    const { milestones, progress } = get();
    if (milestones.length === 0) return 0;
    const completed = progress.filter((p) => p.status === "complete").length;
    return Math.round((completed / milestones.length) * 100);
  },
}));

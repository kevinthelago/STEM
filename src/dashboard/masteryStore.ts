import { create } from "zustand";
import { getMasteryRecords, getTopics, upsertMastery } from "./api";
import type { MasteryRecord, Topic } from "./api";
import {
  DEFAULT_WEIGHTS,
  computeMasteryScore,
  groupBySubject,
  recommendNextTopic,
  weakAreas,
} from "./masteryModel";
import type { SignalWeights } from "./masteryModel";

interface MasteryStore {
  topics: Topic[];
  masteryRecords: MasteryRecord[];
  weights: SignalWeights;
  isLoading: boolean;
  error: string | null;

  load(): Promise<void>;
  setWeights(w: Partial<SignalWeights>): void;
  applyMasteryUpdate(record: MasteryRecord): Promise<void>;

  masteryByTopic(): Record<string, number>;
  computedWeakAreas(): Topic[];
  recommendedNext(): Topic | null;
  subjectGroups(): Array<{ subject: string; topics: Topic[]; avgMastery: number }>;
}

export const useMasteryStore = create<MasteryStore>((set, get) => ({
  topics: [],
  masteryRecords: [],
  weights: DEFAULT_WEIGHTS,
  isLoading: false,
  error: null,

  async load() {
    set({ isLoading: true, error: null });
    try {
      const [topics, masteryRecords] = await Promise.all([getTopics(), getMasteryRecords()]);
      set({ topics, masteryRecords, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  setWeights(w) {
    set((state) => ({ weights: { ...state.weights, ...w } }));
  },

  async applyMasteryUpdate(record) {
    await upsertMastery(record);
    set((state) => {
      const existing = state.masteryRecords.findIndex(
        (r) => r.topic_id === record.topic_id && r.signal === record.signal
      );
      if (existing >= 0) {
        const updated = [...state.masteryRecords];
        updated[existing] = record;
        return { masteryRecords: updated };
      }
      return { masteryRecords: [...state.masteryRecords, record] };
    });
  },

  masteryByTopic() {
    const { topics, masteryRecords, weights } = get();
    const result: Record<string, number> = {};
    for (const topic of topics) {
      const records = masteryRecords.filter((r) => r.topic_id === topic.id);
      result[topic.id] = computeMasteryScore(records, weights);
    }
    return result;
  },

  computedWeakAreas() {
    const { topics } = get();
    return weakAreas(topics, get().masteryByTopic());
  },

  recommendedNext() {
    const { topics } = get();
    return recommendNextTopic(topics, get().masteryByTopic());
  },

  subjectGroups() {
    const { topics } = get();
    return groupBySubject(topics, get().masteryByTopic());
  },
}));

import { create } from "zustand";
import {
  getDueReviews,
  getOverdueCount,
  completeReview,
  updateRetentionSignal,
  type ReviewItem,
} from "./api";
import { sm2QualityFromOutcome, type ReviewOutcome } from "./sm2";

export interface ReviewResult {
  item: ReviewItem;
  quality: number;
  outcome: ReviewOutcome;
  newInterval: number;
}

interface ReviewStore {
  dueItems: ReviewItem[];
  overdueCount: number;
  currentItem: ReviewItem | null;
  sessionResults: ReviewResult[];
  sessionActive: boolean;
  isLoading: boolean;
  error: string | null;

  loadQueue(): Promise<void>;
  startSession(): void;
  submitResult(quality: number, outcome: ReviewOutcome): Promise<void>;
  nextItem(): void;
  endSession(): void;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  dueItems: [],
  overdueCount: 0,
  currentItem: null,
  sessionResults: [],
  sessionActive: false,
  isLoading: false,
  error: null,

  async loadQueue() {
    set({ isLoading: true, error: null });
    try {
      const [dueItems, overdueCount] = await Promise.all([
        getDueReviews(),
        getOverdueCount(),
      ]);
      set({ dueItems, overdueCount, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  startSession() {
    const { dueItems } = get();
    if (dueItems.length === 0) return;
    set({ sessionActive: true, sessionResults: [], currentItem: dueItems[0] });
  },

  async submitResult(quality: number, outcome: ReviewOutcome) {
    const { currentItem, sessionResults, dueItems } = get();
    if (!currentItem) return;

    const q = quality !== undefined ? quality : sm2QualityFromOutcome(outcome);

    try {
      const updated = await completeReview(currentItem.id, q, outcome);

      // compute retention signal: rolling average of quality / 5 over session
      const allResults = [...sessionResults, { item: currentItem, quality: q, outcome, newInterval: updated.interval }];
      const avgQuality = allResults.reduce((s, r) => s + r.quality, 0) / allResults.length;
      await updateRetentionSignal(currentItem.topic_id, avgQuality / 5);

      // advance queue
      const remaining = dueItems.filter((i) => i.id !== currentItem.id);
      const nextItem = remaining[0] ?? null;

      set({
        sessionResults: allResults,
        dueItems: remaining,
        currentItem: nextItem,
      });

      if (!nextItem) {
        set({ sessionActive: false });
      }
    } catch (e) {
      set({ error: String(e) });
    }
  },

  nextItem() {
    const { dueItems } = get();
    const nextItem = dueItems[0] ?? null;
    set({ currentItem: nextItem });
    if (!nextItem) set({ sessionActive: false });
  },

  endSession() {
    set({ sessionActive: false, currentItem: null });
  },
}));

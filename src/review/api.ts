import { invoke } from "@tauri-apps/api/core";
import type { ReviewOutcome } from "./sm2";

export interface ReviewItem {
  id: string;
  topic_id: string;
  topic_name: string;
  subject: string;
  due_at: string;
  interval: number;
  ease: number;
  reps: number;
  last_result: string | null;
  kind: "problem" | "explain";
}

export async function getDueReviews(limit?: number): Promise<ReviewItem[]> {
  return invoke<ReviewItem[]>("get_due_reviews", { limit });
}

export async function getOverdueCount(): Promise<number> {
  return invoke<number>("get_overdue_count");
}

export async function completeReview(
  itemId: string,
  quality: number,
  outcome: ReviewOutcome,
): Promise<ReviewItem> {
  return invoke<ReviewItem>("complete_review", { itemId, quality, outcome });
}

export async function updateRetentionSignal(topicId: string, score: number): Promise<void> {
  return invoke<void>("update_retention_signal", { topicId, score });
}

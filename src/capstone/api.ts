import { invoke } from "@tauri-apps/api/core";
import type { MilestoneId } from "./milestones";

export interface CapstoneProgress {
  milestone_id: string;
  status: "locked" | "unlocked" | "in_progress" | "complete";
  completed_at: string | null;
  notes: string | null;
}

export interface TopicMastery {
  topic_id: string;
  composite_score: number;
}

export async function getCapstoneProgress(): Promise<CapstoneProgress[]> {
  return invoke<CapstoneProgress[]>("get_capstone_progress");
}

export async function completeCapstoneMilestone(
  milestoneId: MilestoneId,
  notes?: string,
): Promise<void> {
  return invoke<void>("complete_capstone_milestone", {
    milestoneId,
    notes: notes ?? null,
  });
}

export async function getTopicMastery(
  topicIds: string[],
): Promise<TopicMastery[]> {
  return invoke<TopicMastery[]>("get_topic_mastery", { topicIds });
}

export async function awardCapstoneMasterySignal(
  milestoneId: MilestoneId,
): Promise<void> {
  return invoke<void>("award_capstone_mastery_signal", { milestoneId });
}

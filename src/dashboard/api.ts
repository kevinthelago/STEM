import { invoke } from "@tauri-apps/api/core";

export interface MasteryRecord {
  topic_id: string;
  signal: "problem" | "explain" | "capstone" | "retention";
  score: number;
  evidence_count: number;
  updated_at: string;
}

export interface PracticeAttempt {
  id: string;
  topic_id: string;
  kind: "problem" | "explain";
  score: number;
  difficulty: number;
  attempted_at: string;
}

export interface Topic {
  id: string;
  subject: string;
  name: string;
  prerequisites: string[];
}

export async function getMasteryRecords(topicId?: string): Promise<MasteryRecord[]> {
  return invoke<MasteryRecord[]>("get_mastery_records", { topicId });
}

export async function getPracticeAttempts(topicId?: string, limit?: number): Promise<PracticeAttempt[]> {
  return invoke<PracticeAttempt[]>("get_practice_attempts", { topicId, limit });
}

export async function getTopics(): Promise<Topic[]> {
  return invoke<Topic[]>("get_topics");
}

export async function upsertMastery(record: MasteryRecord): Promise<void> {
  return invoke<void>("upsert_mastery", { record });
}

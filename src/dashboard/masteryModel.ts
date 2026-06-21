import type { MasteryRecord, Topic } from "./api";

export interface SignalWeights {
  problem: number;
  explain: number;
  capstone: number;
  retention: number;
}

export const DEFAULT_WEIGHTS: SignalWeights = {
  problem: 40,
  explain: 25,
  capstone: 20,
  retention: 15,
};

const DECAY_LAMBDA = 0.05;

function daysSince(isoDate: string, now: Date): number {
  const then = new Date(isoDate).getTime();
  return Math.max(0, (now.getTime() - then) / (1000 * 60 * 60 * 24));
}

function recencyWeight(isoDate: string, now: Date): number {
  return Math.exp(-DECAY_LAMBDA * daysSince(isoDate, now));
}

function normalizeWeights(weights: SignalWeights): SignalWeights {
  const total = weights.problem + weights.explain + weights.capstone + weights.retention;
  if (total === 0) return { problem: 0.25, explain: 0.25, capstone: 0.25, retention: 0.25 };
  return {
    problem: weights.problem / total,
    explain: weights.explain / total,
    capstone: weights.capstone / total,
    retention: weights.retention / total,
  };
}

export function computeMasteryScore(
  records: MasteryRecord[],
  weights: SignalWeights = DEFAULT_WEIGHTS,
  now: Date = new Date()
): number {
  if (records.length === 0) return 0;

  const norm = normalizeWeights(weights);
  const signals: (keyof SignalWeights)[] = ["problem", "explain", "capstone", "retention"];

  let totalWeightedScore = 0;

  for (const signal of signals) {
    const signalRecords = records.filter((r) => r.signal === signal);
    if (signalRecords.length === 0) continue;

    let weightedSum = 0;
    let weightSum = 0;
    for (const rec of signalRecords) {
      const w = recencyWeight(rec.updated_at, now);
      weightedSum += rec.score * w;
      weightSum += w;
    }

    const signalScore = weightSum > 0 ? weightedSum / weightSum : 0;
    totalWeightedScore += signalScore * norm[signal];
  }

  return Math.round(Math.min(100, Math.max(0, totalWeightedScore * 100)));
}

export function recommendNextTopic(
  topics: Topic[],
  masteryByTopic: Record<string, number>
): Topic | null {
  if (topics.length === 0) return null;

  const PREREQ_THRESHOLD = 70;

  const eligible = topics.filter((topic) => {
    if (topic.prerequisites.length === 0) return true;
    return topic.prerequisites.every(
      (prereqId) => (masteryByTopic[prereqId] ?? 0) >= PREREQ_THRESHOLD
    );
  });

  if (eligible.length === 0) return null;

  return eligible.reduce((lowest, topic) => {
    const score = masteryByTopic[topic.id] ?? 0;
    const lowestScore = masteryByTopic[lowest.id] ?? 0;
    return score < lowestScore ? topic : lowest;
  });
}

export function groupBySubject(
  topics: Topic[],
  masteryByTopic: Record<string, number>
): Array<{ subject: string; topics: Topic[]; avgMastery: number }> {
  const bySubject = new Map<string, Topic[]>();
  for (const topic of topics) {
    const group = bySubject.get(topic.subject) ?? [];
    group.push(topic);
    bySubject.set(topic.subject, group);
  }

  return Array.from(bySubject.entries()).map(([subject, subjectTopics]) => {
    const scores = subjectTopics.map((t) => masteryByTopic[t.id] ?? 0);
    const avgMastery = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { subject, topics: subjectTopics, avgMastery: Math.round(avgMastery) };
  });
}

export function weakAreas(
  topics: Topic[],
  masteryByTopic: Record<string, number>,
  threshold = 50
): Topic[] {
  return topics
    .filter((t) => (masteryByTopic[t.id] ?? 0) < threshold)
    .sort((a, b) => (masteryByTopic[a.id] ?? 0) - (masteryByTopic[b.id] ?? 0));
}

import { describe, it, expect } from "vitest";
import {
  computeMasteryScore,
  recommendNextTopic,
  groupBySubject,
  weakAreas,
  DEFAULT_WEIGHTS,
} from "../masteryModel";
import type { MasteryRecord, Topic } from "../api";

const NOW = new Date("2024-06-15T12:00:00Z");

function makeRecord(
  topic_id: string,
  signal: MasteryRecord["signal"],
  score: number,
  updated_at = "2024-06-15T12:00:00Z"
): MasteryRecord {
  return { topic_id, signal, score, evidence_count: 1, updated_at };
}

function makeTopic(id: string, subject: string, name: string, prerequisites: string[] = []): Topic {
  return { id, subject, name, prerequisites };
}

describe("computeMasteryScore", () => {
  it("returns 0 for empty records", () => {
    expect(computeMasteryScore([], DEFAULT_WEIGHTS, NOW)).toBe(0);
  });

  it("returns 100 for all signals at 1.0", () => {
    const records: MasteryRecord[] = [
      makeRecord("t1", "problem", 1.0),
      makeRecord("t1", "explain", 1.0),
      makeRecord("t1", "capstone", 1.0),
      makeRecord("t1", "retention", 1.0),
    ];
    expect(computeMasteryScore(records, DEFAULT_WEIGHTS, NOW)).toBe(100);
  });

  it("returns 0 for all signals at 0", () => {
    const records: MasteryRecord[] = [
      makeRecord("t1", "problem", 0),
      makeRecord("t1", "explain", 0),
      makeRecord("t1", "capstone", 0),
      makeRecord("t1", "retention", 0),
    ];
    expect(computeMasteryScore(records, DEFAULT_WEIGHTS, NOW)).toBe(0);
  });

  it("computes weighted sum correctly with single signal", () => {
    const records: MasteryRecord[] = [makeRecord("t1", "problem", 1.0)];
    // Only problem at 1.0; weight=40, total weight=40+25+20+15=100 → normalized 0.4 → score = 0.4 * 100 = 40
    expect(computeMasteryScore(records, DEFAULT_WEIGHTS, NOW)).toBe(40);
  });

  it("applies recency decay — older record contributes less", () => {
    const newRecord = makeRecord("t1", "problem", 1.0, "2024-06-15T00:00:00Z"); // today
    const oldRecord = makeRecord("t1", "problem", 1.0, "2023-06-15T00:00:00Z"); // ~365 days ago

    const scoreNew = computeMasteryScore([newRecord], DEFAULT_WEIGHTS, NOW);
    const scoreOld = computeMasteryScore([oldRecord], DEFAULT_WEIGHTS, NOW);

    // Both are score=1.0 but old should be weighted down, but still 100 since it's the only record
    // The recency weight just changes the per-signal weighted average; with one record, it's still 1.0
    // So both should be 40 (only problem signal)
    expect(scoreNew).toBe(scoreOld);

    // Test with two records for same signal: newer should dominate
    const twoRecords = [
      makeRecord("t1", "problem", 1.0, "2024-06-15T00:00:00Z"), // today, score 1.0
      makeRecord("t1", "problem", 0.0, "2023-06-01T00:00:00Z"), // old, score 0.0
    ];
    const combined = computeMasteryScore(twoRecords, DEFAULT_WEIGHTS, NOW);
    // The newer record (1.0) should dominate → combined > 30
    expect(combined).toBeGreaterThan(30);
  });

  it("normalizes weights — weights don't need to sum to 100", () => {
    const records: MasteryRecord[] = [
      makeRecord("t1", "problem", 1.0),
      makeRecord("t1", "explain", 1.0),
      makeRecord("t1", "capstone", 1.0),
      makeRecord("t1", "retention", 1.0),
    ];
    const doubledWeights = { problem: 80, explain: 50, capstone: 40, retention: 30 };
    // All signals at 1.0 → regardless of weights (as long as they normalize), score = 100
    expect(computeMasteryScore(records, doubledWeights, NOW)).toBe(100);
  });

  it("handles partial signals (some missing)", () => {
    const records: MasteryRecord[] = [
      makeRecord("t1", "problem", 0.8),
      makeRecord("t1", "explain", 0.6),
    ];
    const score = computeMasteryScore(records, DEFAULT_WEIGHTS, NOW);
    // problem 0.8 * (40/100) + explain 0.6 * (25/100) = 0.32 + 0.15 = 0.47 → 47
    expect(score).toBe(47);
  });
});

describe("recommendNextTopic", () => {
  it("returns null for empty topics", () => {
    expect(recommendNextTopic([], {})).toBeNull();
  });

  it("returns the only topic when no prerequisites", () => {
    const topics = [makeTopic("t1", "Math", "Derivatives")];
    const result = recommendNextTopic(topics, { t1: 30 });
    expect(result?.id).toBe("t1");
  });

  it("skips topics with unmet prerequisites", () => {
    const topics = [
      makeTopic("t1", "Math", "Derivatives"),
      makeTopic("t2", "Math", "Integration", ["t1"]),
    ];
    // t1 mastery = 50 (< 70 threshold) → t2 is ineligible
    const result = recommendNextTopic(topics, { t1: 50, t2: 20 });
    expect(result?.id).toBe("t1");
  });

  it("includes topic when prerequisites are met (≥70)", () => {
    const topics = [
      makeTopic("t1", "Math", "Derivatives"),
      makeTopic("t2", "Math", "Integration", ["t1"]),
    ];
    // t1 mastery = 75 (≥70) → t2 is eligible; t2 has lower mastery
    const result = recommendNextTopic(topics, { t1: 75, t2: 20 });
    expect(result?.id).toBe("t2");
  });

  it("picks lowest mastery among eligible topics", () => {
    const topics = [
      makeTopic("t1", "Math", "A"),
      makeTopic("t2", "Math", "B"),
      makeTopic("t3", "Math", "C"),
    ];
    const result = recommendNextTopic(topics, { t1: 60, t2: 30, t3: 50 });
    expect(result?.id).toBe("t2");
  });

  it("returns null when all topics have unmet prerequisites", () => {
    const topics = [makeTopic("t2", "Math", "Integration", ["t1"])];
    const result = recommendNextTopic(topics, { t1: 50, t2: 0 });
    expect(result).toBeNull();
  });
});

describe("weakAreas", () => {
  const topics = [
    makeTopic("t1", "Math", "A"),
    makeTopic("t2", "Math", "B"),
    makeTopic("t3", "Math", "C"),
    makeTopic("t4", "Math", "D"),
  ];

  it("returns topics below threshold sorted ascending", () => {
    const mastery = { t1: 90, t2: 30, t3: 10, t4: 60 };
    const result = weakAreas(topics, mastery);
    expect(result.map((t) => t.id)).toEqual(["t3", "t2"]);
  });

  it("returns empty when all above threshold", () => {
    const mastery = { t1: 80, t2: 70, t3: 60, t4: 90 };
    expect(weakAreas(topics, mastery)).toHaveLength(0);
  });

  it("respects custom threshold", () => {
    const mastery = { t1: 55, t2: 40, t3: 75, t4: 85 };
    const result = weakAreas(topics, mastery, 60);
    expect(result.map((t) => t.id)).toEqual(["t2", "t1"]);
  });

  it("treats missing mastery as 0", () => {
    const result = weakAreas(topics, {});
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe("t1");
  });
});

describe("groupBySubject", () => {
  it("groups topics and computes average mastery", () => {
    const topics = [
      makeTopic("t1", "Math", "A"),
      makeTopic("t2", "Math", "B"),
      makeTopic("t3", "Physics", "C"),
    ];
    const mastery = { t1: 80, t2: 60, t3: 50 };
    const groups = groupBySubject(topics, mastery);

    const math = groups.find((g) => g.subject === "Math");
    const physics = groups.find((g) => g.subject === "Physics");

    expect(math?.avgMastery).toBe(70);
    expect(physics?.avgMastery).toBe(50);
    expect(math?.topics).toHaveLength(2);
  });

  it("handles empty topics", () => {
    expect(groupBySubject([], {})).toHaveLength(0);
  });

  it("treats missing mastery as 0 in average", () => {
    const topics = [makeTopic("t1", "Math", "A"), makeTopic("t2", "Math", "B")];
    const groups = groupBySubject(topics, { t1: 80 });
    const math = groups.find((g) => g.subject === "Math");
    expect(math?.avgMastery).toBe(40);
  });
});

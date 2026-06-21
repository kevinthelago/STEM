import { describe, it, expect } from "vitest";
import {
  sm2Advance,
  sm2QualityFromOutcome,
  DEFAULT_SM2_STATE,
  type SM2State,
} from "../sm2";

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("sm2Advance", () => {
  it("first perfect recall: interval = 1", () => {
    const result = sm2Advance(DEFAULT_SM2_STATE, 5, NOW);
    expect(result.state.interval).toBe(1);
    expect(result.state.reps).toBe(1);
  });

  it("second perfect recall: interval = 6", () => {
    const s1 = sm2Advance(DEFAULT_SM2_STATE, 5, NOW).state;
    const result = sm2Advance(s1, 5, NOW);
    expect(result.state.interval).toBe(6);
    expect(result.state.reps).toBe(2);
  });

  it("third perfect recall: interval = round(6 * ease)", () => {
    const s1 = sm2Advance(DEFAULT_SM2_STATE, 5, NOW).state;
    const s2 = sm2Advance(s1, 5, NOW).state;
    const result = sm2Advance(s2, 5, NOW);
    // ease after two perfect reviews: 2.5 + 0.1 = 2.6 both times → ~2.7
    expect(result.state.interval).toBe(Math.round(6 * s2.ease));
    expect(result.state.reps).toBe(3);
  });

  it("lapse (quality=0): resets interval to 1 and reps to 0", () => {
    const s1 = sm2Advance(DEFAULT_SM2_STATE, 5, NOW).state;
    const s2 = sm2Advance(s1, 5, NOW).state;
    const result = sm2Advance(s2, 0, NOW);
    expect(result.state.interval).toBe(1);
    expect(result.state.reps).toBe(0);
  });

  it("lapse preserves ease factor", () => {
    const s1 = sm2Advance(DEFAULT_SM2_STATE, 5, NOW).state;
    const easeBefore = s1.ease;
    const result = sm2Advance(s1, 0, NOW);
    expect(result.state.ease).toBeCloseTo(easeBefore);
  });

  it("ease increases with quality=5", () => {
    const result = sm2Advance(DEFAULT_SM2_STATE, 5, NOW);
    expect(result.state.ease).toBeGreaterThan(DEFAULT_SM2_STATE.ease);
  });

  it("ease decreases with quality=3", () => {
    const result = sm2Advance(DEFAULT_SM2_STATE, 3, NOW);
    expect(result.state.ease).toBeLessThan(DEFAULT_SM2_STATE.ease);
  });

  it("ease never falls below 1.3", () => {
    let state: SM2State = DEFAULT_SM2_STATE;
    for (let i = 0; i < 20; i++) {
      state = sm2Advance(state, 3, NOW).state;
    }
    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("dueAt is approximately now + interval days", () => {
    const result = sm2Advance(DEFAULT_SM2_STATE, 5, NOW);
    const expectedMs = NOW.getTime() + result.state.interval * 86_400_000;
    expect(result.dueAt.getTime()).toBeCloseTo(expectedMs, -2);
  });

  it("quality < 3 is always a lapse (boundary at quality=2)", () => {
    const s = sm2Advance(DEFAULT_SM2_STATE, 5, NOW).state; // reps=1
    const result = sm2Advance(s, 2, NOW);
    expect(result.state.reps).toBe(0);
    expect(result.state.interval).toBe(1);
  });

  it("quality=3 is not a lapse", () => {
    const result = sm2Advance(DEFAULT_SM2_STATE, 3, NOW);
    expect(result.state.reps).toBe(1);
    expect(result.state.interval).toBe(1);
  });
});

describe("sm2QualityFromOutcome", () => {
  it("maps perfect → 5", () => expect(sm2QualityFromOutcome("perfect")).toBe(5));
  it("maps correct → 4", () => expect(sm2QualityFromOutcome("correct")).toBe(4));
  it("maps hesitant → 3", () => expect(sm2QualityFromOutcome("hesitant")).toBe(3));
  it("maps incorrect → 1", () => expect(sm2QualityFromOutcome("incorrect")).toBe(1));
  it("maps blackout → 0", () => expect(sm2QualityFromOutcome("blackout")).toBe(0));
});

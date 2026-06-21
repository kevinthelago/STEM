import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCapstoneStore } from "../capstoneStore";
import { MILESTONES } from "../milestones";
import type { CapstoneProgress } from "../api";

// Tauri invoke is mocked globally by src/test-setup.ts
const { invoke } = await import("@tauri-apps/api/core");
const mockInvoke = vi.mocked(invoke);

function makeProgress(
  overrides: Partial<CapstoneProgress>[] = [],
): CapstoneProgress[] {
  const base: CapstoneProgress[] = [
    { milestone_id: "autograd", status: "locked", completed_at: null, notes: null },
    { milestone_id: "neuron", status: "locked", completed_at: null, notes: null },
    { milestone_id: "mlp", status: "locked", completed_at: null, notes: null },
    { milestone_id: "backprop", status: "locked", completed_at: null, notes: null },
    { milestone_id: "training", status: "locked", completed_at: null, notes: null },
    { milestone_id: "evaluation", status: "locked", completed_at: null, notes: null },
  ];
  for (const override of overrides) {
    const rec = base.find((p) => p.milestone_id === override.milestone_id);
    if (rec) Object.assign(rec, override);
  }
  return base;
}

describe("useCapstoneStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCapstoneStore.setState({
      milestones: MILESTONES,
      progress: [],
      prerequisiteMastery: {},
      isLoading: false,
      error: null,
    });
  });

  describe("arePrereqsMet()", () => {
    it("returns false when both mastery scores are 0", () => {
      useCapstoneStore.setState({ prerequisiteMastery: {} });
      expect(useCapstoneStore.getState().arePrereqsMet()).toBe(false);
    });

    it("returns false when only one prereq is met", () => {
      useCapstoneStore.setState({
        prerequisiteMastery: { derivatives: 80, linear_algebra_basics: 30 },
      });
      expect(useCapstoneStore.getState().arePrereqsMet()).toBe(false);
    });

    it("returns true when both prereqs are exactly at threshold (60)", () => {
      useCapstoneStore.setState({
        prerequisiteMastery: { derivatives: 60, linear_algebra_basics: 60 },
      });
      expect(useCapstoneStore.getState().arePrereqsMet()).toBe(true);
    });

    it("returns true when both prereqs exceed threshold", () => {
      useCapstoneStore.setState({
        prerequisiteMastery: { derivatives: 95, linear_algebra_basics: 88 },
      });
      expect(useCapstoneStore.getState().arePrereqsMet()).toBe(true);
    });

    it("returns false when mastery is 59 (just below threshold)", () => {
      useCapstoneStore.setState({
        prerequisiteMastery: { derivatives: 59, linear_algebra_basics: 60 },
      });
      expect(useCapstoneStore.getState().arePrereqsMet()).toBe(false);
    });
  });

  describe("isUnlocked()", () => {
    it("autograd is always unlocked regardless of progress", () => {
      useCapstoneStore.setState({ progress: makeProgress() });
      expect(useCapstoneStore.getState().isUnlocked("autograd")).toBe(true);
    });

    it("neuron is locked when autograd is not complete", () => {
      useCapstoneStore.setState({
        progress: makeProgress([{ milestone_id: "autograd", status: "in_progress" }]),
      });
      expect(useCapstoneStore.getState().isUnlocked("neuron")).toBe(false);
    });

    it("neuron is unlocked when autograd is complete", () => {
      useCapstoneStore.setState({
        progress: makeProgress([
          {
            milestone_id: "autograd",
            status: "complete",
            completed_at: "2026-06-01T10:00:00Z",
          },
        ]),
      });
      expect(useCapstoneStore.getState().isUnlocked("neuron")).toBe(true);
    });

    it("evaluation is locked when training is not complete", () => {
      useCapstoneStore.setState({ progress: makeProgress() });
      expect(useCapstoneStore.getState().isUnlocked("evaluation")).toBe(false);
    });

    it("evaluation is unlocked when training is complete", () => {
      useCapstoneStore.setState({
        progress: makeProgress([
          { milestone_id: "autograd", status: "complete", completed_at: "2026-06-01T10:00:00Z" },
          { milestone_id: "neuron", status: "complete", completed_at: "2026-06-02T10:00:00Z" },
          { milestone_id: "mlp", status: "complete", completed_at: "2026-06-03T10:00:00Z" },
          { milestone_id: "backprop", status: "complete", completed_at: "2026-06-04T10:00:00Z" },
          { milestone_id: "training", status: "complete", completed_at: "2026-06-05T10:00:00Z" },
        ]),
      });
      expect(useCapstoneStore.getState().isUnlocked("evaluation")).toBe(true);
    });
  });

  describe("completionPercent()", () => {
    it("returns 0 when no milestones are complete", () => {
      useCapstoneStore.setState({ progress: makeProgress() });
      expect(useCapstoneStore.getState().completionPercent()).toBe(0);
    });

    it("returns 100 when all 6 milestones are complete", () => {
      const allComplete = makeProgress().map((p) => ({
        ...p,
        status: "complete" as const,
        completed_at: "2026-06-01T00:00:00Z",
      }));
      useCapstoneStore.setState({ progress: allComplete });
      expect(useCapstoneStore.getState().completionPercent()).toBe(100);
    });

    it("returns ~33 when 2 of 6 are complete", () => {
      useCapstoneStore.setState({
        progress: makeProgress([
          { milestone_id: "autograd", status: "complete", completed_at: "2026-06-01T00:00:00Z" },
          { milestone_id: "neuron", status: "complete", completed_at: "2026-06-02T00:00:00Z" },
        ]),
      });
      expect(useCapstoneStore.getState().completionPercent()).toBe(33);
    });
  });

  describe("currentMilestone()", () => {
    it("returns null when no milestones are available", () => {
      useCapstoneStore.setState({ milestones: [], progress: [] });
      expect(useCapstoneStore.getState().currentMilestone()).toBeNull();
    });

    it("returns autograd (first unlocked) when nothing started", () => {
      useCapstoneStore.setState({ progress: makeProgress() });
      const current = useCapstoneStore.getState().currentMilestone();
      expect(current?.id).toBe("autograd");
    });

    it("returns in_progress milestone first", () => {
      useCapstoneStore.setState({
        progress: makeProgress([
          { milestone_id: "autograd", status: "complete", completed_at: "2026-06-01T00:00:00Z" },
          { milestone_id: "neuron", status: "in_progress" },
        ]),
      });
      const current = useCapstoneStore.getState().currentMilestone();
      expect(current?.id).toBe("neuron");
    });

    it("returns null when all milestones are complete", () => {
      const allComplete = makeProgress().map((p) => ({
        ...p,
        status: "complete" as const,
        completed_at: "2026-06-01T00:00:00Z",
      }));
      useCapstoneStore.setState({ progress: allComplete });
      expect(useCapstoneStore.getState().currentMilestone()).toBeNull();
    });

    it("skips completed milestones and returns next unlocked", () => {
      useCapstoneStore.setState({
        progress: makeProgress([
          { milestone_id: "autograd", status: "complete", completed_at: "2026-06-01T00:00:00Z" },
        ]),
      });
      const current = useCapstoneStore.getState().currentMilestone();
      expect(current?.id).toBe("neuron");
    });
  });

  describe("load()", () => {
    it("fetches progress and mastery and stores them", async () => {
      const fakeProgress = makeProgress([
        { milestone_id: "autograd", status: "complete", completed_at: "2026-06-01T00:00:00Z" },
      ]);
      const fakeMastery = [
        { topic_id: "derivatives", composite_score: 75 },
        { topic_id: "linear_algebra_basics", composite_score: 80 },
      ];

      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "get_capstone_progress") return Promise.resolve(fakeProgress);
        if (cmd === "get_topic_mastery") return Promise.resolve(fakeMastery);
        return Promise.resolve(null);
      });

      await useCapstoneStore.getState().load();

      const state = useCapstoneStore.getState();
      expect(state.progress).toEqual(fakeProgress);
      expect(state.prerequisiteMastery["derivatives"]).toBe(75);
      expect(state.prerequisiteMastery["linear_algebra_basics"]).toBe(80);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      mockInvoke.mockRejectedValue(new Error("DB error"));

      await useCapstoneStore.getState().load();

      const state = useCapstoneStore.getState();
      expect(state.error).toContain("DB error");
      expect(state.isLoading).toBe(false);
    });
  });
});

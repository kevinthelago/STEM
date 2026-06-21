import { describe, it, expect } from "vitest";
import { MILESTONES, type MilestoneId } from "../milestones";

describe("MILESTONES", () => {
  it("has exactly 6 entries", () => {
    expect(MILESTONES).toHaveLength(6);
  });

  it("are in the expected order", () => {
    const expectedOrder: MilestoneId[] = [
      "autograd",
      "neuron",
      "mlp",
      "backprop",
      "training",
      "evaluation",
    ];
    expect(MILESTONES.map((m) => m.id)).toEqual(expectedOrder);
  });

  it("each milestone has non-empty required fields", () => {
    for (const m of MILESTONES) {
      expect(m.title.length, `${m.id}.title`).toBeGreaterThan(0);
      expect(m.description.length, `${m.id}.description`).toBeGreaterThan(0);
      expect(m.objectives.length, `${m.id}.objectives`).toBeGreaterThan(0);
      expect(
        m.verificationPrompt.length,
        `${m.id}.verificationPrompt`,
      ).toBeGreaterThan(0);
      m.objectives.forEach((obj, i) => {
        expect(obj.length, `${m.id}.objectives[${i}]`).toBeGreaterThan(0);
      });
    }
  });

  it("autograd has no prerequisites", () => {
    const autograd = MILESTONES.find((m) => m.id === "autograd");
    expect(autograd).toBeDefined();
    expect(autograd!.prerequisites).toEqual([]);
  });

  it("evaluation requires training (directly)", () => {
    const evaluation = MILESTONES.find((m) => m.id === "evaluation");
    expect(evaluation).toBeDefined();
    expect(evaluation!.prerequisites).toContain("training");
  });

  it("prerequisites form a valid DAG — no cycles", () => {
    const milestoneMap = new Map(MILESTONES.map((m) => [m.id, m]));

    function hasCycle(
      id: MilestoneId,
      visited: Set<MilestoneId>,
      stack: Set<MilestoneId>,
    ): boolean {
      visited.add(id);
      stack.add(id);
      const m = milestoneMap.get(id);
      if (!m) return false;
      for (const prereq of m.prerequisites as MilestoneId[]) {
        if (!visited.has(prereq)) {
          if (hasCycle(prereq, visited, stack)) return true;
        } else if (stack.has(prereq)) {
          return true;
        }
      }
      stack.delete(id);
      return false;
    }

    const visited = new Set<MilestoneId>();
    const stack = new Set<MilestoneId>();
    for (const m of MILESTONES) {
      if (!visited.has(m.id)) {
        expect(hasCycle(m.id, visited, stack)).toBe(false);
      }
    }
  });

  it("all prerequisites reference known milestone IDs", () => {
    const knownIds = new Set(MILESTONES.map((m) => m.id));
    for (const m of MILESTONES) {
      for (const prereq of m.prerequisites) {
        expect(knownIds.has(prereq as MilestoneId), `unknown prereq ${prereq} on ${m.id}`).toBe(
          true,
        );
      }
    }
  });

  it("milestones have at least one reference", () => {
    for (const m of MILESTONES) {
      expect(m.references.length, `${m.id}.references`).toBeGreaterThan(0);
    }
  });
});

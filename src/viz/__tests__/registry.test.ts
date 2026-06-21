import { describe, it, expect } from "vitest";
import { isKnownVizType, getDefaultParams, VIZ_REGISTRY, VIZ_TYPES } from "../registry";
import type { VizType } from "../types";

const ALL_TYPES: VizType[] = [
  "vector3d",
  "matrix_transform",
  "function_plot",
  "distribution",
  "gradient_descent",
  "physics_sim",
];

describe("isKnownVizType", () => {
  it("returns true for all known VizType values", () => {
    ALL_TYPES.forEach((t) => {
      expect(isKnownVizType(t)).toBe(true);
    });
  });

  it("returns false for unknown strings", () => {
    expect(isKnownVizType("unknown")).toBe(false);
    expect(isKnownVizType("")).toBe(false);
    expect(isKnownVizType("3d_vector")).toBe(false);
    expect(isKnownVizType("VECTOR3D")).toBe(false);
  });
});

describe("getDefaultParams", () => {
  it("returns a non-null object for every known VizType", () => {
    ALL_TYPES.forEach((t) => {
      const defaults = getDefaultParams(t);
      expect(defaults).toBeDefined();
      expect(typeof defaults).toBe("object");
      expect(defaults).not.toBeNull();
    });
  });

  it("returns independent copies (mutating one does not affect another)", () => {
    const a = getDefaultParams("function_plot");
    const b = getDefaultParams("function_plot");
    a["expression"] = "MUTATED";
    expect(b["expression"]).toBe("Math.sin(x)");
  });

  it("vector3d defaults include a vectors array", () => {
    const d = getDefaultParams("vector3d");
    expect(Array.isArray(d.vectors)).toBe(true);
    expect((d.vectors as unknown[]).length).toBeGreaterThan(0);
  });

  it("matrix_transform defaults include a 3×3 matrix", () => {
    const d = getDefaultParams("matrix_transform");
    const m = d.matrix as number[][];
    expect(m.length).toBe(3);
    m.forEach((row) => expect(row.length).toBe(3));
  });

  it("distribution defaults have a valid kind", () => {
    const d = getDefaultParams("distribution");
    expect(["normal", "uniform", "binomial"]).toContain(d.kind);
  });

  it("physics_sim defaults include a bodies array with at least one body", () => {
    const d = getDefaultParams("physics_sim");
    expect(Array.isArray(d.bodies)).toBe(true);
    expect((d.bodies as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("VIZ_REGISTRY", () => {
  it("has an entry for every VizType", () => {
    ALL_TYPES.forEach((t) => {
      expect(VIZ_REGISTRY[t]).toBeDefined();
    });
  });

  it("VIZ_TYPES matches ALL_TYPES", () => {
    expect([...VIZ_TYPES].sort()).toEqual([...ALL_TYPES].sort());
  });

  it("every registry value is a lazy-loaded component (has $$typeof)", () => {
    ALL_TYPES.forEach((t) => {
      // React.lazy returns an object with $$typeof === Symbol(react.lazy)
      const comp = VIZ_REGISTRY[t] as unknown as { $$typeof: symbol };
      expect(comp.$$typeof).toBeDefined();
      expect(comp.$$typeof.toString()).toContain("react.lazy");
    });
  });
});

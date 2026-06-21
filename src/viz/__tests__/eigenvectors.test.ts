import { describe, it, expect } from "vitest";
import { computeEigenvectors2D } from "../utils/eigenvectors";

const EPSILON = 1e-9;

function approxEqual(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

function vecLength(v: [number, number, number]): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}

describe("computeEigenvectors2D", () => {
  it("returns 2 eigenvectors for the identity matrix", () => {
    const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(I);
    expect(evs.length).toBe(2);
    evs.forEach((ev) => {
      expect(approxEqual(ev.eigenvalue, 1, 1e-6)).toBe(true);
    });
  });

  it("returns unit-length eigenvectors", () => {
    const m = [[3, 1, 0], [1, 3, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    expect(evs.length).toBe(2);
    evs.forEach((ev) => {
      expect(approxEqual(vecLength(ev.vector), 1, 1e-9)).toBe(true);
    });
  });

  it("computes correct eigenvalues for a 2×2 scaling matrix", () => {
    // Diagonal: eigenvalues are 2 and 5
    const m = [[2, 0, 0], [0, 5, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    expect(evs.length).toBe(2);
    const eigenvalues = evs.map((e) => e.eigenvalue).sort((a, b) => a - b);
    expect(approxEqual(eigenvalues[0], 2, 1e-6)).toBe(true);
    expect(approxEqual(eigenvalues[1], 5, 1e-6)).toBe(true);
  });

  it("computes correct eigenvalues for a symmetric shear matrix", () => {
    // [[3, 1], [1, 3]]: eigenvalues are 2 and 4
    const m = [[3, 1, 0], [1, 3, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    expect(evs.length).toBe(2);
    const eigenvalues = evs.map((e) => e.eigenvalue).sort((a, b) => a - b);
    expect(approxEqual(eigenvalues[0], 2, 1e-6)).toBe(true);
    expect(approxEqual(eigenvalues[1], 4, 1e-6)).toBe(true);
  });

  it("verifies that Av = λv for each eigenvector", () => {
    const m = [[3, 1, 0], [1, 3, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    evs.forEach(({ eigenvalue: lambda, vector: v }) => {
      // Compute Av using 2×2 submatrix
      const Av0 = m[0][0] * v[0] + m[0][1] * v[1];
      const Av1 = m[1][0] * v[0] + m[1][1] * v[1];
      // Av should equal λv (within floating-point tolerance)
      expect(approxEqual(Av0, lambda * v[0], 1e-6)).toBe(true);
      expect(approxEqual(Av1, lambda * v[1], 1e-6)).toBe(true);
    });
  });

  it("returns empty array for a pure rotation matrix (complex eigenvalues)", () => {
    // 90° rotation: [[0, -1], [1, 0]] — eigenvalues are ±i
    const m = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    expect(evs.length).toBe(0);
  });

  it("returns empty array for a 45° rotation (complex eigenvalues)", () => {
    const c = Math.cos(Math.PI / 4), s = Math.sin(Math.PI / 4);
    const m = [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    expect(evs.length).toBe(0);
  });

  it("handles a negative eigenvalue correctly", () => {
    // Reflection across x-axis: [[1,0],[0,-1]] — eigenvalues 1 and -1
    const m = [[1, 0, 0], [0, -1, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    expect(evs.length).toBe(2);
    const eigenvalues = evs.map((e) => e.eigenvalue).sort((a, b) => a - b);
    expect(approxEqual(eigenvalues[0], -1, 1e-6)).toBe(true);
    expect(approxEqual(eigenvalues[1], 1, 1e-6)).toBe(true);
  });

  it("all eigenvectors lie in the z=0 plane", () => {
    const m = [[3, 1, 0], [1, 3, 0], [0, 0, 1]];
    const evs = computeEigenvectors2D(m);
    evs.forEach((ev) => {
      expect(approxEqual(ev.vector[2], 0, 1e-10)).toBe(true);
    });
  });
});

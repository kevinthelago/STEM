export interface EigResult {
  eigenvalue: number;
  vector: [number, number, number];
}

/**
 * Computes real eigenvectors from the top-left 2×2 submatrix embedded in 3D (z=0 plane).
 * Returns an empty array when eigenvalues are complex (negative discriminant).
 */
export function computeEigenvectors2D(m: number[][]): EigResult[] {
  const a = m[0][0], b = m[0][1];
  const c = m[1][0], d = m[1][1];
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  if (disc < 0) return [];

  const sqrtDisc = Math.sqrt(disc);
  const results: EigResult[] = [];

  for (const sign of [1, -1] as const) {
    const lambda = (trace + sign * sqrtDisc) / 2;
    let vx: number, vy: number;
    if (Math.abs(b) > 1e-10) {
      vx = b; vy = lambda - a;
    } else if (Math.abs(c) > 1e-10) {
      vx = lambda - d; vy = c;
    } else {
      vx = sign > 0 ? 1 : 0; vy = sign > 0 ? 0 : 1;
    }
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len < 1e-10) continue;
    results.push({ eigenvalue: lambda, vector: [vx / len, vy / len, 0] });
  }
  return results;
}

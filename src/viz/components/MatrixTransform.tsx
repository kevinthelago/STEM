import { useMemo } from "react";
import * as THREE from "three";
import { OrbitControls, Line } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { VizComponentProps, MatrixTransformParams } from "../types";
import { VIZ_COLORS } from "../theme";
import { computeEigenvectors2D } from "../utils/eigenvectors";
import type { EigResult } from "../utils/eigenvectors";

const IDENTITY: number[][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const DEFAULT_PARAMS: MatrixTransformParams = {
  matrix: IDENTITY,
  showBasis: true,
  showEigenvectors: false,
};

function mergeParams(params: Record<string, unknown>): MatrixTransformParams {
  return {
    matrix: (params.matrix as number[][]) ?? DEFAULT_PARAMS.matrix,
    showBasis: (params.showBasis as boolean) ?? DEFAULT_PARAMS.showBasis,
    showEigenvectors: (params.showEigenvectors as boolean) ?? DEFAULT_PARAMS.showEigenvectors,
  };
}

const EIGVEC_COLORS = ["#ff6b6b", "#51cf66"] as const;

interface EigenvectorArrowsProps {
  eigenvectors: EigResult[];
}

function EigenvectorArrows({ eigenvectors }: EigenvectorArrowsProps) {
  return (
    <>
      {eigenvectors.map((ev, i) => {
        const scale = Math.abs(ev.eigenvalue);
        if (scale < 1e-10) return null;
        const dir = new THREE.Vector3(...ev.vector);
        const arrow = new THREE.ArrowHelper(
          dir.normalize(),
          new THREE.Vector3(0, 0, 0),
          Math.max(scale, 0.3) * 1.5,
          EIGVEC_COLORS[i % EIGVEC_COLORS.length],
          0.25,
          0.12
        );
        return <primitive key={i} object={arrow} />;
      })}
    </>
  );
}

// Unit cube corners
const CUBE_EDGES: Array<[[number,number,number],[number,number,number]]> = [
  [[0,0,0],[1,0,0]], [[1,0,0],[1,1,0]], [[1,1,0],[0,1,0]], [[0,1,0],[0,0,0]],
  [[0,0,1],[1,0,1]], [[1,0,1],[1,1,1]], [[1,1,1],[0,1,1]], [[0,1,1],[0,0,1]],
  [[0,0,0],[0,0,1]], [[1,0,0],[1,0,1]], [[1,1,0],[1,1,1]], [[0,1,0],[0,1,1]],
];

function applyMatrix(p: [number,number,number], m: number[][]): [number,number,number] {
  return [
    m[0][0]*p[0] + m[0][1]*p[1] + m[0][2]*p[2],
    m[1][0]*p[0] + m[1][1]*p[1] + m[1][2]*p[2],
    m[2][0]*p[0] + m[2][1]*p[1] + m[2][2]*p[2],
  ];
}

interface CubeWireframeProps {
  matrix?: number[][];
  color: string;
  opacity?: number;
}

function CubeWireframe({ matrix, color, opacity = 1 }: CubeWireframeProps) {
  const edges = useMemo(() =>
    CUBE_EDGES.map(([a, b]) => {
      const pa = matrix ? applyMatrix(a, matrix) : a;
      const pb = matrix ? applyMatrix(b, matrix) : b;
      return [pa, pb] as [[number,number,number],[number,number,number]];
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(matrix)]
  );

  return (
    <>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color={color} lineWidth={1.5} opacity={opacity} transparent />
      ))}
    </>
  );
}

interface BasisArrowsProps {
  matrix: number[][];
}

function BasisArrows({ matrix }: BasisArrowsProps) {
  const basisColors = [VIZ_COLORS.axisX, VIZ_COLORS.axisY, VIZ_COLORS.axisZ];
  const inputs: Array<[number,number,number]> = [[1,0,0],[0,1,0],[0,0,1]];

  return (
    <>
      {inputs.map((inp, i) => {
        const out = applyMatrix(inp, matrix);
        const dir = new THREE.Vector3(...out);
        const len = dir.length();
        if (len < 0.001) return null;
        const arrow = new THREE.ArrowHelper(
          dir.normalize(),
          new THREE.Vector3(0, 0, 0),
          len,
          basisColors[i],
          len * 0.2,
          len * 0.1
        );
        return <primitive key={i} object={arrow} />;
      })}
    </>
  );
}

export function MatrixTransform({ params }: VizComponentProps) {
  const p = mergeParams(params);
  const isIdentity = JSON.stringify(p.matrix) === JSON.stringify(IDENTITY);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const eigenvectors = useMemo(() => computeEigenvectors2D(p.matrix), [JSON.stringify(p.matrix)]);

  return (
    <Canvas
      style={{ width: "100%", height: "100%", background: VIZ_COLORS.background }}
      camera={{ position: [3, 3, 3], fov: 50 }}
    >
      <ambientLight intensity={0.5} />
      <OrbitControls makeDefault />
      {/* Original unit cube — wireframe */}
      <CubeWireframe color={VIZ_COLORS.textMuted} opacity={0.4} />
      {/* Transformed cube */}
      {!isIdentity && <CubeWireframe matrix={p.matrix} color={VIZ_COLORS.primary} opacity={0.9} />}
      {/* Basis vectors of the transform */}
      {p.showBasis && <BasisArrows matrix={p.matrix} />}
      {/* Eigenvectors in the z=0 plane — toggled via showEigenvectors */}
      {p.showEigenvectors && eigenvectors.length > 0 && (
        <EigenvectorArrows eigenvectors={eigenvectors} />
      )}
    </Canvas>
  );
}

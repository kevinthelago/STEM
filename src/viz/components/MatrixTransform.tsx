import { useMemo } from "react";
import * as THREE from "three";
import { OrbitControls, Line } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { VizComponentProps, MatrixTransformParams } from "../types";
import { VIZ_COLORS } from "../theme";

const IDENTITY: number[][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const DEFAULT_PARAMS: MatrixTransformParams = {
  matrix: IDENTITY,
  showBasis: true,
};

function mergeParams(params: Record<string, unknown>): MatrixTransformParams {
  return {
    matrix: (params.matrix as number[][]) ?? DEFAULT_PARAMS.matrix,
    showBasis: (params.showBasis as boolean) ?? DEFAULT_PARAMS.showBasis,
  };
}

function buildThreeMatrix(m: number[][]): THREE.Matrix4 {
  // m is 3×3, place into 4×4
  const mat4 = new THREE.Matrix4();
  mat4.set(
    m[0][0], m[0][1], m[0][2], 0,
    m[1][0], m[1][1], m[1][2], 0,
    m[2][0], m[2][1], m[2][2], 0,
    0,       0,       0,       1
  );
  return mat4;
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
    </Canvas>
  );
}

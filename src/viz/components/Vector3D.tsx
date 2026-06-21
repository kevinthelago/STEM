import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Html, OrbitControls, Line } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { VizComponentProps, Vector3DParams } from "../types";
import { VIZ_COLORS, VIZ_SIZES } from "../theme";

const DEFAULT_PARAMS: Vector3DParams = {
  vectors: [{ direction: [1, 0, 0], color: VIZ_COLORS.vectorDefault, label: "v" }],
  showAxes: true,
};

function mergeParams(params: Record<string, unknown>): Vector3DParams {
  return {
    vectors:
      (params.vectors as Vector3DParams["vectors"]) ??
      DEFAULT_PARAMS.vectors,
    showAxes: (params.showAxes as boolean) ?? DEFAULT_PARAMS.showAxes,
  };
}

interface ArrowProps {
  origin: [number, number, number];
  direction: [number, number, number];
  color: string;
  label?: string;
}

function Arrow({ origin, direction, color, label }: ArrowProps) {
  const arrowRef = useRef<THREE.ArrowHelper>(null);
  const length = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
  const dir = new THREE.Vector3(...direction).normalize();
  const orig = new THREE.Vector3(...origin);

  const helper = useMemo(
    () =>
      new THREE.ArrowHelper(
        dir,
        orig,
        Math.max(length, 0.001),
        color,
        length * VIZ_SIZES.arrowHeadRatio * 2,
        length * VIZ_SIZES.arrowHeadRatio
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [origin.join(), direction.join(), color]
  );

  const tip: [number, number, number] = [
    origin[0] + direction[0],
    origin[1] + direction[1],
    origin[2] + direction[2],
  ];

  return (
    <>
      <primitive object={helper} ref={arrowRef} />
      {label && (
        <Html position={tip} style={{ pointerEvents: "none" }}>
          <span
            style={{
              background: "rgba(0,0,0,0.6)",
              color,
              padding: "1px 5px",
              borderRadius: 4,
              fontSize: VIZ_SIZES.labelFontSize,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </Html>
      )}
    </>
  );
}

function Axes({ length = VIZ_SIZES.axisLength }: { length?: number }) {
  return (
    <>
      <Line
        points={[[-length, 0, 0], [length, 0, 0]]}
        color={VIZ_COLORS.axisX}
        lineWidth={1}
        opacity={0.6}
        transparent
      />
      <Line
        points={[[0, -length, 0], [0, length, 0]]}
        color={VIZ_COLORS.axisY}
        lineWidth={1}
        opacity={0.6}
        transparent
      />
      <Line
        points={[[0, 0, -length], [0, 0, length]]}
        color={VIZ_COLORS.axisZ}
        lineWidth={1}
        opacity={0.6}
        transparent
      />
    </>
  );
}

export function Vector3D({ params }: VizComponentProps) {
  const p = mergeParams(params);

  return (
    <Canvas
      style={{ width: "100%", height: "100%", background: VIZ_COLORS.background }}
      camera={{ position: [3, 3, 3], fov: 50 }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls makeDefault />
      {p.showAxes && <Axes />}
      {p.vectors.map((v, i) => (
        <Arrow
          key={i}
          origin={v.origin ?? [0, 0, 0]}
          direction={v.direction}
          color={v.color ?? VIZ_COLORS.vectorDefault}
          label={v.label}
        />
      ))}
    </Canvas>
  );
}

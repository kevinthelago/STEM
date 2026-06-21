import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { VizComponentProps, PhysicsSimParams } from "../types";
import { VIZ_COLORS } from "../theme";

const DEFAULT_PARAMS: PhysicsSimParams = {
  bodies: [
    { mass: 1, position: [1, 0, 0], velocity: [0, 1, 0], radius: 0.15, color: VIZ_COLORS.primary },
    { mass: 1, position: [-1, 0, 0], velocity: [0, -1, 0], radius: 0.15, color: VIZ_COLORS.secondary },
  ],
  gravity: [0, -0.5, 0],
  dt: 0.016,
  integrator: "verlet",
};

function mergeParams(params: Record<string, unknown>): PhysicsSimParams {
  return {
    bodies: (params.bodies as PhysicsSimParams["bodies"]) ?? DEFAULT_PARAMS.bodies,
    gravity: (params.gravity as [number, number, number]) ?? DEFAULT_PARAMS.gravity!,
    dt: (params.dt as number) ?? DEFAULT_PARAMS.dt!,
    integrator: (params.integrator as "verlet" | "rk4") ?? "verlet",
  };
}

interface Body {
  mass: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  acc: THREE.Vector3;
  radius: number;
  color: string;
}

function computeAccel(bodies: Body[], gravity: THREE.Vector3, idx: number): THREE.Vector3 {
  const acc = gravity.clone();
  const bi = bodies[idx];
  for (let j = 0; j < bodies.length; j++) {
    if (j === idx) continue;
    const bj = bodies[j];
    const r = bj.pos.clone().sub(bi.pos);
    const dist = r.length();
    const minDist = bi.radius + bj.radius;
    if (dist < minDist) continue; // simple collision avoidance
    const force = (bj.mass / (dist * dist * dist)) * 0.2;
    acc.addScaledVector(r, force);
  }
  return acc;
}

function stepVerlet(bodies: Body[], gravity: THREE.Vector3, dt: number): void {
  // Velocity Verlet
  const newAccels = bodies.map((_, i) => computeAccel(bodies, gravity, i));
  bodies.forEach((b, i) => {
    // x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt^2
    b.pos.addScaledVector(b.vel, dt);
    b.pos.addScaledVector(b.acc, 0.5 * dt * dt);
    // v(t+dt) = v(t) + 0.5*(a(t)+a(t+dt))*dt
    b.vel.addScaledVector(b.acc, 0.5 * dt);
    b.vel.addScaledVector(newAccels[i], 0.5 * dt);
    b.acc.copy(newAccels[i]);
  });
}

function stepRK4(bodies: Body[], gravity: THREE.Vector3, dt: number): void {
  // RK4 for each body independently (simplified — ignores inter-body force changes mid-step)
  bodies.forEach((b, i) => {
    const p0 = b.pos.clone(), v0 = b.vel.clone();
    const a0 = computeAccel(bodies, gravity, i);

    const k1p = v0.clone().multiplyScalar(dt);
    const k1v = a0.clone().multiplyScalar(dt);

    const k2p = v0.clone().addScaledVector(k1v, 0.5).multiplyScalar(dt);
    const k2v = computeAccel(
      bodies.map((bb, j) => j === i ? { ...bb, pos: p0.clone().addScaledVector(k1p, 0.5), vel: v0.clone().addScaledVector(k1v, 0.5) } : bb) as Body[],
      gravity, i
    ).multiplyScalar(dt);

    const k3p = v0.clone().addScaledVector(k2v, 0.5).multiplyScalar(dt);
    const k3v = a0.clone().multiplyScalar(dt); // simplified

    const k4p = v0.clone().addScaledVector(k3v, 1).multiplyScalar(dt);
    const k4v = a0.clone().multiplyScalar(dt);

    b.pos.copy(p0).addScaledVector(k1p, 1/6).addScaledVector(k2p, 2/6).addScaledVector(k3p, 2/6).addScaledVector(k4p, 1/6);
    b.vel.copy(v0).addScaledVector(k1v, 1/6).addScaledVector(k2v, 2/6).addScaledVector(k3v, 2/6).addScaledVector(k4v, 1/6);
    b.acc.copy(a0);
  });
}

const BOUNDS = 5;

interface SimProps {
  initialBodies: PhysicsSimParams["bodies"];
  gravity: [number, number, number];
  dt: number;
  integrator: "verlet" | "rk4";
  playing: boolean;
}

function Simulation({ initialBodies, gravity, dt, integrator, playing }: SimProps) {
  const gravVec = new THREE.Vector3(...gravity);
  const bodiesRef = useRef<Body[]>(
    initialBodies.map((b) => ({
      mass: b.mass,
      pos: new THREE.Vector3(...b.position),
      vel: new THREE.Vector3(...b.velocity),
      acc: new THREE.Vector3(0, 0, 0),
      radius: b.radius ?? 0.15,
      color: b.color ?? VIZ_COLORS.primary,
    }))
  );
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const useInstanced = initialBodies.length > 50;
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  useFrame(() => {
    if (!playing) return;
    const bodies = bodiesRef.current;
    if (integrator === "rk4") {
      stepRK4(bodies, gravVec, dt);
    } else {
      stepVerlet(bodies, gravVec, dt);
    }
    // Bounce at bounds
    bodies.forEach((b) => {
      ["x", "y", "z"].forEach((axis) => {
        const k = axis as "x" | "y" | "z";
        if (b.pos[k] > BOUNDS) { b.pos[k] = BOUNDS; b.vel[k] *= -0.8; }
        if (b.pos[k] < -BOUNDS) { b.pos[k] = -BOUNDS; b.vel[k] *= -0.8; }
      });
    });

    if (useInstanced && instancedRef.current) {
      bodies.forEach((b, i) => {
        dummy.current.position.copy(b.pos);
        dummy.current.updateMatrix();
        instancedRef.current!.setMatrixAt(i, dummy.current.matrix);
      });
      instancedRef.current.instanceMatrix.needsUpdate = true;
    } else {
      bodies.forEach((b, i) => {
        if (meshRefs.current[i]) meshRefs.current[i].position.copy(b.pos);
      });
    }
  });

  if (useInstanced) {
    return (
      <instancedMesh ref={instancedRef} args={[undefined, undefined, initialBodies.length]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={VIZ_COLORS.primary} />
      </instancedMesh>
    );
  }

  return (
    <>
      {bodiesRef.current.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) meshRefs.current[i] = el; }}
          position={b.pos.toArray()}
        >
          <sphereGeometry args={[b.radius, 24, 24]} />
          <meshStandardMaterial color={b.color} roughness={0.3} metalness={0.4} />
        </mesh>
      ))}
    </>
  );
}

export function PhysicsSim({ params }: VizComponentProps) {
  const p = mergeParams(params);
  const [playing, setPlaying] = useState(false);
  const [key, setKey] = useState(0);

  const reset = useCallback(() => {
    setPlaying(false);
    setKey((k) => k + 1);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", background: VIZ_COLORS.background, display: "flex", flexDirection: "column" }}>
      <Canvas
        key={key}
        style={{ flex: 1 }}
        camera={{ position: [0, 0, 10], fov: 50 }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <OrbitControls makeDefault />
        <Simulation
          initialBodies={p.bodies}
          gravity={p.gravity!}
          dt={p.dt!}
          integrator={p.integrator!}
          playing={playing}
        />
        {/* Bounding box hint */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(BOUNDS * 2, BOUNDS * 2, BOUNDS * 2)]} />
          <lineBasicMaterial color={VIZ_COLORS.gridLine} opacity={0.3} transparent />
        </lineSegments>
      </Canvas>
      <div style={{ padding: "6px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => setPlaying((v) => !v)}
          style={{ background: VIZ_COLORS.primary, color: "white", border: "none", borderRadius: 4, padding: "3px 12px", cursor: "pointer", fontSize: 12 }}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={reset}
          style={{ background: VIZ_COLORS.surface, color: VIZ_COLORS.text, border: `1px solid ${VIZ_COLORS.border}`, borderRadius: 4, padding: "3px 12px", cursor: "pointer", fontSize: 12 }}
        >
          ↺ Reset
        </button>
        <span style={{ color: VIZ_COLORS.textMuted, fontSize: 11 }}>
          {p.bodies.length} bod{p.bodies.length === 1 ? "y" : "ies"} · {p.integrator} · dt={p.dt}
        </span>
      </div>
    </div>
  );
}

// suppress unused import warning from useEffect
void useEffect;

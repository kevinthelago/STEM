/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import type { VizType, Vector3DParams, MatrixTransformParams, FunctionPlotParams, DistributionParams, GradientDescentParams, PhysicsSimParams } from "./types";

export const VIZ_REGISTRY = {
  vector3d: lazy(() => import("./components/Vector3D").then((m) => ({ default: m.Vector3D }))),
  matrix_transform: lazy(() => import("./components/MatrixTransform").then((m) => ({ default: m.MatrixTransform }))),
  function_plot: lazy(() => import("./components/FunctionPlot").then((m) => ({ default: m.FunctionPlot }))),
  distribution: lazy(() => import("./components/Distribution").then((m) => ({ default: m.Distribution }))),
  gradient_descent: lazy(() => import("./components/GradientDescent").then((m) => ({ default: m.GradientDescent }))),
  physics_sim: lazy(() => import("./components/PhysicsSim").then((m) => ({ default: m.PhysicsSim }))),
} as const;

const KNOWN_TYPES = new Set<string>(Object.keys(VIZ_REGISTRY));

export function isKnownVizType(type: string): type is VizType {
  return KNOWN_TYPES.has(type);
}

const DEFAULTS: Record<VizType, Record<string, unknown>> = {
  vector3d: {
    vectors: [{ direction: [1, 0, 0], color: "#f39c12", label: "v" }],
    showAxes: true,
  } satisfies Vector3DParams,
  matrix_transform: {
    matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    showBasis: true,
    showEigenvectors: false,
  } satisfies MatrixTransformParams,
  function_plot: {
    expression: "Math.sin(x)",
    domain: [-Math.PI * 2, Math.PI * 2],
    range: [-2, 2],
    numPoints: 400,
    variables: [],
  } satisfies FunctionPlotParams,
  distribution: {
    kind: "normal",
    mu: 0,
    sigma: 1,
    showMean: true,
    showStd: true,
  } satisfies DistributionParams,
  gradient_descent: {
    objective: "x*x + y*y",
    learningRate: 0.1,
    steps: 30,
    startX: 2.5,
    startY: 2.5,
    xDomain: [-3, 3],
    yDomain: [-3, 3],
  } satisfies GradientDescentParams,
  physics_sim: {
    bodies: [
      { mass: 1, position: [1, 0, 0], velocity: [0, 1, 0], radius: 0.15, color: "#6c63ff" },
      { mass: 1, position: [-1, 0, 0], velocity: [0, -1, 0], radius: 0.15, color: "#f39c12" },
    ],
    gravity: [0, -0.5, 0],
    dt: 0.016,
    integrator: "verlet",
  } satisfies PhysicsSimParams,
};

export function getDefaultParams(type: VizType): Record<string, unknown> {
  return { ...DEFAULTS[type] };
}

export const VIZ_TYPES: readonly VizType[] = Object.keys(VIZ_REGISTRY) as VizType[];

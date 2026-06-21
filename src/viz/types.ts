export type VizType =
  | "vector3d"
  | "matrix_transform"
  | "function_plot"
  | "distribution"
  | "gradient_descent"
  | "physics_sim";

export interface VizPayload {
  type: string;
  params: Record<string, unknown>;
}

export interface VizComponentProps<P = Record<string, unknown>> {
  params: P;
}

export interface Vector3DParams {
  vectors: Array<{
    origin?: [number, number, number];
    direction: [number, number, number];
    color?: string;
    label?: string;
  }>;
  showAxes?: boolean;
}

export interface MatrixTransformParams {
  matrix: number[][];
  showBasis?: boolean;
  showEigenvectors?: boolean;
}

export interface FunctionPlotParams {
  expression: string;
  domain?: [number, number];
  range?: [number, number];
  numPoints?: number;
  variables?: string[];
}

export interface DistributionParams {
  kind: "normal" | "uniform" | "binomial";
  mu?: number;
  sigma?: number;
  a?: number;
  b?: number;
  n?: number;
  p?: number;
  showMean?: boolean;
  showStd?: boolean;
}

export interface GradientDescentParams {
  objective: string;
  path?: Array<[number, number]>;
  learningRate?: number;
  steps?: number;
  startX?: number;
  startY?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
}

export interface PhysicsSimParams {
  bodies: Array<{
    mass: number;
    position: [number, number, number];
    velocity: [number, number, number];
    radius?: number;
    color?: string;
  }>;
  gravity?: [number, number, number];
  dt?: number;
  integrator?: "verlet" | "rk4";
}

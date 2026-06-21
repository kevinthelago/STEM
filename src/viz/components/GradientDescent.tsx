import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { VizComponentProps, GradientDescentParams } from "../types";
import { VIZ_COLORS, VIZ_DEFAULTS } from "../theme";

const DEFAULT_PARAMS: GradientDescentParams = {
  objective: "x*x + y*y",
  learningRate: 0.1,
  steps: 30,
  startX: 2.5,
  startY: 2.5,
  xDomain: [-3, 3],
  yDomain: [-3, 3],
};

function mergeParams(params: Record<string, unknown>): GradientDescentParams {
  return {
    objective: (params.objective as string) ?? DEFAULT_PARAMS.objective!,
    path: params.path as Array<[number, number]> | undefined,
    learningRate: (params.learningRate as number) ?? DEFAULT_PARAMS.learningRate!,
    steps: (params.steps as number) ?? DEFAULT_PARAMS.steps!,
    startX: (params.startX as number) ?? DEFAULT_PARAMS.startX!,
    startY: (params.startY as number) ?? DEFAULT_PARAMS.startY!,
    xDomain: (params.xDomain as [number, number]) ?? DEFAULT_PARAMS.xDomain!,
    yDomain: (params.yDomain as [number, number]) ?? DEFAULT_PARAMS.yDomain!,
  };
}

function evalObjective(expr: string, x: number, y: number): number {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("x", "y", `"use strict"; return (${expr});`);
    const v = fn(x, y) as number;
    return isFinite(v) ? v : Infinity;
  } catch {
    return Infinity;
  }
}

function numericalGradient(expr: string, x: number, y: number, h = 1e-5): [number, number] {
  const fxp = evalObjective(expr, x + h, y);
  const fxm = evalObjective(expr, x - h, y);
  const fyp = evalObjective(expr, x, y + h);
  const fym = evalObjective(expr, x, y - h);
  return [(fxp - fxm) / (2 * h), (fyp - fym) / (2 * h)];
}

function simulatePath(expr: string, lr: number, steps: number, sx: number, sy: number): Array<[number, number]> {
  const path: Array<[number, number]> = [[sx, sy]];
  let x = sx, y = sy;
  for (let i = 0; i < steps; i++) {
    const [gx, gy] = numericalGradient(expr, x, y);
    x -= lr * gx;
    y -= lr * gy;
    path.push([x, y]);
    if (Math.abs(gx) + Math.abs(gy) < 1e-8) break;
  }
  return path;
}

export function GradientDescent({ params }: VizComponentProps) {
  const p = mergeParams(params);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 400 });
  const [animIdx, setAnimIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const pathRef = useRef<Array<[number, number]>>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Recompute path when params change
  useEffect(() => {
    pathRef.current = p.path ?? simulatePath(
      p.objective!,
      p.learningRate!,
      p.steps!,
      p.startX!,
      p.startY!
    );
    setAnimIdx(pathRef.current.length - 1);
    setPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(p)]);

  // Animation
  useEffect(() => {
    if (!playing) return;
    setAnimIdx(0);
    let idx = 0;
    const total = pathRef.current.length - 1;
    const timer = d3.interval(() => {
      idx++;
      setAnimIdx(idx);
      if (idx >= total) timer.stop();
    }, 120);
    return () => timer.stop();
  }, [playing]);

  useEffect(() => {
    if (!svgRef.current || dims.width === 0) return;
    const margin = VIZ_DEFAULTS.chartMargin;
    const innerW = dims.width - margin.left - margin.right;
    const innerH = dims.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", dims.width).attr("height", dims.height);

    const xDom = p.xDomain!;
    const yDom = p.yDomain!;

    const xScale = d3.scaleLinear().domain(xDom).range([0, innerW]);
    const yScale = d3.scaleLinear().domain(yDom).range([innerH, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Build contour data
    const gridN = 60;
    const xStep = (xDom[1] - xDom[0]) / gridN;
    const yStep = (yDom[1] - yDom[0]) / gridN;
    const values = new Array<number>(gridN * gridN);
    for (let j = 0; j < gridN; j++) {
      for (let i = 0; i < gridN; i++) {
        const x = xDom[0] + i * xStep;
        const y = yDom[0] + j * yStep;
        values[j * gridN + i] = evalObjective(p.objective!, x, y);
      }
    }

    const vMin = d3.min(values) ?? 0;
    const vMax = d3.min([d3.max(values) ?? 10, 1e6]) ?? 10;

    const contours = d3.contours()
      .size([gridN, gridN])
      .thresholds(d3.range(vMin, vMax, (vMax - vMin) / 12))
      (values);

    const colorScale = d3.scaleSequential(d3.interpolateCool).domain([vMin, vMax]);

    const pathGen = d3.geoPath().projection(
      d3.geoTransform({
        point(px, py) {
          const wx = xDom[0] + px * xStep;
          const wy = yDom[0] + py * yStep;
          this.stream.point(xScale(wx), yScale(wy));
        },
      })
    );

    g.append("g")
      .selectAll("path")
      .data(contours)
      .join("path")
      .attr("d", pathGen)
      .attr("fill", (d) => colorScale(d.value))
      .attr("stroke", "rgba(255,255,255,0.1)")
      .attr("stroke-width", 0.5);

    // Axes
    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(xScale).ticks(6));
    g.append("g").call(d3.axisLeft(yScale).ticks(6));
    g.selectAll("text").attr("fill", VIZ_COLORS.textMuted);
    g.selectAll(".domain, .tick line").attr("stroke", VIZ_COLORS.textMuted);

    // Path
    const path = pathRef.current.slice(0, animIdx + 1);
    if (path.length > 1) {
      const line = d3.line<[number, number]>()
        .x(([x]) => xScale(x))
        .y(([, y]) => yScale(y));

      g.append("path")
        .datum(path)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("d", line);

      // Dots
      g.selectAll(".pt")
        .data(path)
        .join("circle")
        .attr("cx", ([x]) => xScale(x))
        .attr("cy", ([, y]) => yScale(y))
        .attr("r", (_, i) => (i === path.length - 1 ? 5 : 2.5))
        .attr("fill", (_, i) => (i === path.length - 1 ? VIZ_COLORS.accent : "rgba(255,255,255,0.6)"));
    }

    // Label last point loss
    if (path.length > 0) {
      const [lx, ly] = path[path.length - 1];
      const lv = evalObjective(p.objective!, lx, ly);
      g.append("text")
        .attr("x", xScale(lx) + 8)
        .attr("y", yScale(ly) - 8)
        .attr("fill", "white")
        .attr("font-size", 11)
        .attr("font-family", "monospace")
        .text(`L=${lv.toFixed(4)}`);
    }
  }, [dims, animIdx, p]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", background: VIZ_COLORS.background, display: "flex", flexDirection: "column" }}>
      <svg ref={svgRef} style={{ flex: 1 }} />
      <div style={{ padding: "6px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={() => { setPlaying(true); }}
          style={{ background: VIZ_COLORS.primary, color: "white", border: "none", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}
        >
          ▶ Replay
        </button>
        <span style={{ color: VIZ_COLORS.textMuted, fontSize: 11, fontFamily: "monospace" }}>
          step {Math.min(animIdx, pathRef.current.length - 1)} / {Math.max(pathRef.current.length - 1, 0)}
        </span>
        <span style={{ color: VIZ_COLORS.textMuted, fontSize: 11, fontFamily: "monospace" }}>
          f(x,y) = {p.objective}
        </span>
      </div>
    </div>
  );
}

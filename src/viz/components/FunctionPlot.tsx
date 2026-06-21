import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { VizComponentProps, FunctionPlotParams } from "../types";
import { VIZ_COLORS, VIZ_DEFAULTS } from "../theme";

const DEFAULT_PARAMS: FunctionPlotParams = {
  expression: "Math.sin(x)",
  domain: [-Math.PI * 2, Math.PI * 2],
  range: [-2, 2],
  numPoints: 400,
  variables: [],
};

function mergeParams(params: Record<string, unknown>): FunctionPlotParams {
  return {
    expression: (params.expression as string) ?? DEFAULT_PARAMS.expression,
    domain: (params.domain as [number, number]) ?? DEFAULT_PARAMS.domain,
    range: (params.range as [number, number]) ?? DEFAULT_PARAMS.range,
    numPoints: (params.numPoints as number) ?? DEFAULT_PARAMS.numPoints,
    variables: (params.variables as string[]) ?? DEFAULT_PARAMS.variables,
  };
}

function evaluateExpression(expr: string, x: number, extraVars: Record<string, number>): number | null {
  try {
    const varNames = Object.keys(extraVars);
    const varVals = Object.values(extraVars);
    // eslint-disable-next-line no-new-func
    const fn = new Function("x", ...varNames, `"use strict"; return (${expr});`);
    const result = fn(x, ...varVals) as number;
    return isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function FunctionPlot({ params }: VizComponentProps) {
  const p = mergeParams(params);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 400 });

  // Extra variable sliders (beyond x)
  const extraVarNames = (p.variables ?? []).filter((v) => v !== "x");
  const [extraVarVals, setExtraVarVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(extraVarNames.map((v) => [v, 1]))
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const margin = VIZ_DEFAULTS.chartMargin;
    const innerW = dims.width - margin.left - margin.right;
    const innerH = dims.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const domain = p.domain ?? DEFAULT_PARAMS.domain!;
    const range = p.range ?? DEFAULT_PARAMS.range!;
    const numPoints = p.numPoints ?? DEFAULT_PARAMS.numPoints!;

    const xScale = d3.scaleLinear().domain(domain).range([0, innerW]);
    const yScale = d3.scaleLinear().domain(range).range([innerH, 0]);

    const g = svg
      .attr("width", dims.width)
      .attr("height", dims.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.2)
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerW)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", VIZ_COLORS.gridLine);

    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.2)
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3.axisBottom(xScale)
          .tickSize(-innerH)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", VIZ_COLORS.gridLine);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("fill", VIZ_COLORS.textMuted);

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", VIZ_COLORS.textMuted);

    g.selectAll(".domain, .tick line").attr("stroke", VIZ_COLORS.textMuted);

    // Zero lines
    const y0 = yScale(0);
    if (y0 >= 0 && y0 <= innerH) {
      g.append("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", y0).attr("y2", y0)
        .attr("stroke", VIZ_COLORS.textMuted)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.5);
    }

    // Data points
    const step = (domain[1] - domain[0]) / numPoints;
    const points: Array<[number, number]> = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = domain[0] + i * step;
      const y = evaluateExpression(p.expression, x, extraVarVals);
      if (y !== null) points.push([x, y]);
    }

    // Split into segments at discontinuities
    const segments: Array<Array<[number, number]>> = [];
    let seg: Array<[number, number]> = [];
    for (let i = 0; i < points.length; i++) {
      const [, y] = points[i];
      if (y < range[0] - 10 || y > range[1] + 10) {
        if (seg.length > 1) segments.push(seg);
        seg = [];
      } else {
        seg.push(points[i]);
      }
    }
    if (seg.length > 1) segments.push(seg);

    const line = d3
      .line<[number, number]>()
      .x(([x]) => xScale(x))
      .y(([, y]) => yScale(y))
      .curve(d3.curveCatmullRom);

    const clipId = `clip-${Math.random().toString(36).slice(2)}`;
    g.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH);

    segments.forEach((s) => {
      g.append("path")
        .datum(s)
        .attr("clip-path", `url(#${clipId})`)
        .attr("fill", "none")
        .attr("stroke", VIZ_COLORS.plotLine)
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Expression label
    g.append("text")
      .attr("x", innerW - 4)
      .attr("y", 12)
      .attr("text-anchor", "end")
      .attr("fill", VIZ_COLORS.text)
      .attr("font-size", 12)
      .attr("font-family", "monospace")
      .text(`y = ${p.expression}`);
  }, [dims, p, extraVarVals]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", background: VIZ_COLORS.background, display: "flex", flexDirection: "column" }}>
      <svg ref={svgRef} style={{ flex: 1 }} />
      {extraVarNames.length > 0 && (
        <div style={{ padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: 12 }}>
          {extraVarNames.map((v) => (
            <label key={v} style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "monospace" }}>{v}</span>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={extraVarVals[v] ?? 1}
                onChange={(e) =>
                  setExtraVarVals((prev) => ({ ...prev, [v]: parseFloat(e.target.value) }))
                }
                style={{ width: 100 }}
              />
              <span style={{ minWidth: 32, textAlign: "right" }}>
                {(extraVarVals[v] ?? 1).toFixed(1)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

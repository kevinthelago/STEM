import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { VizComponentProps, DistributionParams } from "../types";
import { VIZ_COLORS, VIZ_DEFAULTS } from "../theme";

function mergeParams(params: Record<string, unknown>): DistributionParams {
  return {
    kind: (params.kind as DistributionParams["kind"]) ?? "normal",
    mu: (params.mu as number) ?? 0,
    sigma: (params.sigma as number) ?? 1,
    a: (params.a as number) ?? -2,
    b: (params.b as number) ?? 2,
    n: (params.n as number) ?? 10,
    p: (params.p as number) ?? 0.5,
    showMean: (params.showMean as boolean) ?? true,
    showStd: (params.showStd as boolean) ?? true,
  };
}

function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function uniformPDF(x: number, a: number, b: number): number {
  return x >= a && x <= b ? 1 / (b - a) : 0;
}

function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  // log combination to avoid overflow
  let logC = 0;
  for (let i = 0; i < k; i++) logC += Math.log(n - i) - Math.log(i + 1);
  return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

export function Distribution({ params }: VizComponentProps) {
  const p = mergeParams(params);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 360 });

  const [mu, setMu] = useState(p.mu ?? 0);
  const [sigma, setSigma] = useState(Math.max(p.sigma ?? 1, 0.1));
  const [bA, setBA] = useState(p.a ?? -2);
  const [bB, setBB] = useState(p.b ?? 2);
  const [bN, setBN] = useState(Math.max(Math.round(p.n ?? 10), 1));
  const [bP, setBP] = useState(Math.min(Math.max(p.p ?? 0.5, 0.01), 0.99));

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ width, height: height - 80 > 100 ? height - 80 : height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const margin = VIZ_DEFAULTS.chartMargin;
    const innerW = dims.width - margin.left - margin.right;
    const innerH = Math.max(dims.height - margin.top - margin.bottom, 50);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", dims.width).attr("height", dims.height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (p.kind === "binomial") {
      const n = bN;
      const pv = bP;
      const ks = d3.range(0, n + 1);
      const vals = ks.map((k) => ({ k, prob: binomialPMF(k, n, pv) }));
      const maxProb = d3.max(vals, (d) => d.prob) ?? 1;

      const xScale = d3.scaleBand().domain(ks.map(String)).range([0, innerW]).padding(0.2);
      const yScale = d3.scaleLinear().domain([0, maxProb * 1.1]).range([innerH, 0]);

      g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => i % Math.max(1, Math.floor(n / 10)) === 0)));
      g.append("g").call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".2f")));
      g.selectAll("text").attr("fill", VIZ_COLORS.textMuted);
      g.selectAll(".domain, .tick line").attr("stroke", VIZ_COLORS.textMuted);

      const mean = n * pv;
      g.selectAll(".bar")
        .data(vals)
        .join("rect")
        .attr("x", (d) => xScale(String(d.k)) ?? 0)
        .attr("y", (d) => yScale(d.prob))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => innerH - yScale(d.prob))
        .attr("fill", (d) => Math.abs(d.k - mean) < 0.5 ? VIZ_COLORS.accent : VIZ_COLORS.plotLine)
        .attr("opacity", 0.8);

      if (p.showMean) {
        const mx = xScale(String(Math.round(mean)));
        if (mx !== undefined) {
          g.append("line")
            .attr("x1", mx + xScale.bandwidth() / 2)
            .attr("x2", mx + xScale.bandwidth() / 2)
            .attr("y1", 0).attr("y2", innerH)
            .attr("stroke", VIZ_COLORS.secondary)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,3");
          g.append("text")
            .attr("x", mx + xScale.bandwidth() / 2 + 4)
            .attr("y", 12)
            .attr("fill", VIZ_COLORS.secondary)
            .attr("font-size", 11)
            .text(`μ=${mean.toFixed(1)}`);
        }
      }
    } else {
      // Continuous: normal or uniform
      const isNormal = p.kind === "normal";
      const domainMin = isNormal ? mu - 4 * sigma : bA - 0.5;
      const domainMax = isNormal ? mu + 4 * sigma : bB + 0.5;
      const numPoints = 400;

      const step = (domainMax - domainMin) / numPoints;
      const points: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= numPoints; i++) {
        const x = domainMin + i * step;
        const y = isNormal ? normalPDF(x, mu, sigma) : uniformPDF(x, bA, bB);
        points.push({ x, y });
      }

      const maxY = d3.max(points, (d) => d.y) ?? 1;
      const xScale = d3.scaleLinear().domain([domainMin, domainMax]).range([0, innerW]);
      const yScale = d3.scaleLinear().domain([0, maxY * 1.15]).range([innerH, 0]);

      // Grid
      g.append("g").attr("opacity", 0.15).call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(() => "")).selectAll("line").attr("stroke", VIZ_COLORS.gridLine);

      g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(xScale).ticks(8));
      g.append("g").call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".2f")));
      g.selectAll("text").attr("fill", VIZ_COLORS.textMuted);
      g.selectAll(".domain, .tick line").attr("stroke", VIZ_COLORS.textMuted);

      // Fill
      const area = d3.area<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y0(innerH)
        .y1((d) => yScale(d.y))
        .curve(d3.curveCatmullRom);

      g.append("path")
        .datum(points)
        .attr("fill", VIZ_COLORS.plotFill)
        .attr("d", area);

      const line = d3.line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveCatmullRom);

      g.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", VIZ_COLORS.plotLine)
        .attr("stroke-width", 2)
        .attr("d", line);

      if (p.showMean) {
        const mean = isNormal ? mu : (bA + bB) / 2;
        g.append("line")
          .attr("x1", xScale(mean)).attr("x2", xScale(mean))
          .attr("y1", 0).attr("y2", innerH)
          .attr("stroke", VIZ_COLORS.secondary)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,3");
        g.append("text")
          .attr("x", xScale(mean) + 4)
          .attr("y", 14)
          .attr("fill", VIZ_COLORS.secondary)
          .attr("font-size", 11)
          .text(`μ=${mean.toFixed(2)}`);
      }

      if (p.showStd && isNormal) {
        [-1, 1].forEach((s) => {
          g.append("line")
            .attr("x1", xScale(mu + s * sigma)).attr("x2", xScale(mu + s * sigma))
            .attr("y1", 0).attr("y2", innerH)
            .attr("stroke", VIZ_COLORS.accent)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
        });
        g.append("text")
          .attr("x", xScale(mu + sigma) + 4)
          .attr("y", 28)
          .attr("fill", VIZ_COLORS.accent)
          .attr("font-size", 10)
          .text(`±σ=${sigma.toFixed(2)}`);
      }
    }
  }, [dims, p.kind, p.showMean, p.showStd, mu, sigma, bA, bB, bN, bP]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", background: VIZ_COLORS.background, display: "flex", flexDirection: "column" }}>
      <svg ref={svgRef} style={{ flex: 1 }} />
      <div style={{ padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {p.kind === "normal" && (
          <>
            <label style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              μ
              <input type="range" min="-5" max="5" step="0.1" value={mu} onChange={(e) => setMu(parseFloat(e.target.value))} style={{ width: 80 }} />
              <span style={{ minWidth: 32 }}>{mu.toFixed(1)}</span>
            </label>
            <label style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              σ
              <input type="range" min="0.1" max="5" step="0.1" value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} style={{ width: 80 }} />
              <span style={{ minWidth: 32 }}>{sigma.toFixed(1)}</span>
            </label>
          </>
        )}
        {p.kind === "uniform" && (
          <>
            <label style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              a
              <input type="range" min="-10" max="0" step="0.1" value={bA} onChange={(e) => setBA(parseFloat(e.target.value))} style={{ width: 80 }} />
              <span style={{ minWidth: 32 }}>{bA.toFixed(1)}</span>
            </label>
            <label style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              b
              <input type="range" min="0" max="10" step="0.1" value={bB} onChange={(e) => setBB(parseFloat(e.target.value))} style={{ width: 80 }} />
              <span style={{ minWidth: 32 }}>{bB.toFixed(1)}</span>
            </label>
          </>
        )}
        {p.kind === "binomial" && (
          <>
            <label style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              n
              <input type="range" min="1" max="50" step="1" value={bN} onChange={(e) => setBN(parseInt(e.target.value))} style={{ width: 80 }} />
              <span style={{ minWidth: 32 }}>{bN}</span>
            </label>
            <label style={{ color: VIZ_COLORS.text, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              p
              <input type="range" min="0.01" max="0.99" step="0.01" value={bP} onChange={(e) => setBP(parseFloat(e.target.value))} style={{ width: 80 }} />
              <span style={{ minWidth: 32 }}>{bP.toFixed(2)}</span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}

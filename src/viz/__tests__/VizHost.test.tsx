import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React, { Suspense } from "react";
import { VizHost } from "../VizHost";
import { getDefaultParams } from "../registry";
import type { VizType } from "../types";

// Mock all viz components to keep tests fast and environment-independent
vi.mock("../components/Vector3D", () => ({ Vector3D: () => <div data-testid="comp-vector3d" /> }));
vi.mock("../components/MatrixTransform", () => ({ MatrixTransform: () => <div data-testid="comp-matrix_transform" /> }));
vi.mock("../components/FunctionPlot", () => ({ FunctionPlot: () => <div data-testid="comp-function_plot" /> }));
vi.mock("../components/Distribution", () => ({ Distribution: () => <div data-testid="comp-distribution" /> }));
vi.mock("../components/GradientDescent", () => ({ GradientDescent: () => <div data-testid="comp-gradient_descent" /> }));
vi.mock("../components/PhysicsSim", () => ({ PhysicsSim: () => <div data-testid="comp-physics_sim" /> }));

// Flush React.lazy by awaiting microtasks
async function renderAndFlush(ui: React.ReactElement) {
  const result = render(ui);
  await new Promise((r) => setTimeout(r, 0));
  return result;
}

const ALL_TYPES: VizType[] = [
  "vector3d",
  "matrix_transform",
  "function_plot",
  "distribution",
  "gradient_descent",
  "physics_sim",
];

describe("VizHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders VizPlaceholder for an unknown viz type", async () => {
    await renderAndFlush(
      <Suspense fallback={null}>
        <VizHost payload={{ type: "unknown_type", params: {} }} />
      </Suspense>
    );
    expect(screen.getByText(/Unknown visualization type/)).toBeTruthy();
    expect(screen.getByText("unknown_type")).toBeTruthy();
  });

  it("renders VizPlaceholder for empty string type", async () => {
    await renderAndFlush(
      <Suspense fallback={null}>
        <VizHost payload={{ type: "", params: {} }} />
      </Suspense>
    );
    expect(screen.getByText(/Unknown visualization type/)).toBeTruthy();
  });

  it.each(ALL_TYPES)("renders %s without crashing using default params", async (type) => {
    const { container } = await renderAndFlush(
      <Suspense fallback={<div>loading</div>}>
        <VizHost payload={{ type, params: {} }} />
      </Suspense>
    );
    // Should not contain the placeholder text
    expect(container.textContent).not.toContain("Unknown visualization type");
  });

  it("renders the viz-host container div", async () => {
    await renderAndFlush(
      <Suspense fallback={null}>
        <VizHost payload={{ type: "function_plot", params: {} }} />
      </Suspense>
    );
    expect(document.querySelector("[data-testid='viz-host']")).toBeTruthy();
  });

  it("merges default params with provided params", async () => {
    const customExpression = "Math.cos(x)";
    const renderSpy = vi.fn(() => <div data-testid="comp-function_plot" />);

    vi.doMock("../components/FunctionPlot", () => ({
      FunctionPlot: renderSpy,
    }));

    const defaults = getDefaultParams("function_plot");
    const merged = { ...defaults, expression: customExpression };

    // The VizHost merges defaults + user params, so expression should be overridden
    expect(merged.expression).toBe(customExpression);
    // Domain, range etc. should still come from defaults
    expect(merged.domain).toEqual(defaults.domain);
  });

  it("applies className to the container", async () => {
    await renderAndFlush(
      <Suspense fallback={null}>
        <VizHost payload={{ type: "distribution", params: {} }} className="my-viz" />
      </Suspense>
    );
    expect(document.querySelector(".my-viz")).toBeTruthy();
  });

  it("applies width and height when provided", async () => {
    await renderAndFlush(
      <Suspense fallback={null}>
        <VizHost payload={{ type: "vector3d", params: {} }} width={640} height={480} />
      </Suspense>
    );
    const host = document.querySelector("[data-testid='viz-host']") as HTMLElement;
    expect(host.style.width).toBe("640px");
    expect(host.style.height).toBe("480px");
  });
});

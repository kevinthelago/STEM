import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { VizPayload } from "./types";
import { isKnownVizType, getDefaultParams, VIZ_REGISTRY } from "./registry";
import { VizPlaceholder } from "./components/VizPlaceholder";
import { VIZ_COLORS } from "./theme";

const THREE_D_TYPES = new Set(["vector3d", "matrix_transform", "physics_sim"]);

interface VizHostProps {
  payload: VizPayload;
  width?: number;
  height?: number;
  className?: string;
}

function LoadingFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: VIZ_COLORS.textMuted }}>
      Loading visualization…
    </div>
  );
}

export function VizHost({ payload, width, height, className }: VizHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedSize, setResolvedSize] = useState({ width: width ?? 0, height: height ?? 0 });
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      const { width: w, height: h } = entry.contentRect;
      setResolvedSize({ width: w, height: h });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(onResize);
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [onResize]);

  const containerStyle: React.CSSProperties = {
    width: width !== undefined ? `${width}px` : "100%",
    height: height !== undefined ? `${height}px` : "100%",
    minHeight: 200,
    background: VIZ_COLORS.background,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  };

  if (!isKnownVizType(payload.type)) {
    return (
      <div ref={containerRef} style={containerStyle} className={className} data-testid="viz-host">
        <VizPlaceholder type={payload.type} />
      </div>
    );
  }

  const defaults = getDefaultParams(payload.type);
  const mergedParams: Record<string, unknown> = { ...defaults, ...payload.params };

  if (typeof mergedParams !== "object" || mergedParams === null) {
    console.warn(`[VizHost] Invalid params for type "${payload.type}", using defaults.`);
  }

  const Component = VIZ_REGISTRY[payload.type];

  // Suppress unused variable
  void reducedMotion;
  void resolvedSize;
  void THREE_D_TYPES;

  return (
    <div ref={containerRef} style={containerStyle} className={className} data-testid="viz-host">
      <Suspense fallback={<LoadingFallback />}>
        <Component params={mergedParams} />
      </Suspense>
    </div>
  );
}

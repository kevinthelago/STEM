export const VIZ_COLORS = {
  axisX: "#e74c3c",
  axisY: "#2ecc71",
  axisZ: "#3498db",
  primary: "#6c63ff",
  secondary: "#f39c12",
  accent: "#e91e63",
  background: "#1a1a2e",
  surface: "#16213e",
  border: "#0f3460",
  text: "#e0e0e0",
  textMuted: "#888",
  gridLine: "#2a2a4a",
  plotLine: "#6c63ff",
  plotFill: "rgba(108, 99, 255, 0.15)",
  gradientHot: "#e74c3c",
  gradientCold: "#3498db",
  vectorDefault: "#f39c12",
} as const;

export const VIZ_SIZES = {
  axisLength: 2,
  arrowHeadRatio: 0.15,
  gridOpacity: 0.4,
  lineWidth: 2,
  labelFontSize: 12,
  controlsFontSize: 11,
} as const;

export const VIZ_DEFAULTS = {
  canvasBackground: "#1a1a2e",
  chartMargin: { top: 20, right: 20, bottom: 40, left: 50 },
} as const;

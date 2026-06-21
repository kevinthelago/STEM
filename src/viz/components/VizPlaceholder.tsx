import { VIZ_COLORS } from "../theme";

export function VizPlaceholder({ type }: { type: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: VIZ_COLORS.textMuted,
        flexDirection: "column",
        gap: 8,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span>
        Unknown visualization type: <code style={{ background: "#222", padding: "2px 6px", borderRadius: 4 }}>{type}</code>
      </span>
      <span style={{ fontSize: 12 }}>This viz type is not yet supported.</span>
    </div>
  );
}

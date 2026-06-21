import { useState } from "react";
import { VIZ_TYPES, getDefaultParams } from "./registry";
import { VizHost } from "./VizHost";
import type { VizType } from "./types";
import { VIZ_COLORS } from "./theme";

const VIZ_LABELS: Record<VizType, string> = {
  vector3d: "3D Vectors",
  matrix_transform: "Matrix Transform",
  function_plot: "Function Plot",
  distribution: "Distribution",
  gradient_descent: "Gradient Descent",
  physics_sim: "Physics Simulation",
};

const VIZ_DESCRIPTIONS: Record<VizType, string> = {
  vector3d: "Visualize vectors in 3D space with rotation and zoom.",
  matrix_transform: "See how a 3×3 matrix transforms the unit cube.",
  function_plot: "Plot f(x) over a domain with interactive parameters.",
  distribution: "Explore probability distributions with sliders.",
  gradient_descent: "Watch gradient descent navigate a loss landscape.",
  physics_sim: "Simulate bodies under gravity and mutual attraction.",
};

interface ModalProps {
  type: VizType;
  onClose: () => void;
}

function VizModal({ type, onClose }: ModalProps) {
  const params = getDefaultParams(type);
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "80vw", height: "70vh", maxWidth: 900,
          background: VIZ_COLORS.surface,
          borderRadius: 12,
          border: `1px solid ${VIZ_COLORS.border}`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${VIZ_COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: VIZ_COLORS.text, fontWeight: 600 }}>{VIZ_LABELS[type]}</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: VIZ_COLORS.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <VizHost payload={{ type, params }} />
        </div>
      </div>
    </div>
  );
}

export function VizGallery() {
  const [openType, setOpenType] = useState<VizType | null>(null);

  return (
    <div style={{ padding: 24, background: VIZ_COLORS.background, minHeight: "100%" }}>
      <h2 style={{ color: VIZ_COLORS.text, marginTop: 0, marginBottom: 24, fontSize: 22 }}>
        Visualization Gallery
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {VIZ_TYPES.map((type) => (
          <div
            key={type}
            onClick={() => setOpenType(type)}
            style={{
              background: VIZ_COLORS.surface,
              border: `1px solid ${VIZ_COLORS.border}`,
              borderRadius: 10,
              cursor: "pointer",
              overflow: "hidden",
              transition: "border-color 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = VIZ_COLORS.primary;
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = VIZ_COLORS.border;
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            {/* Preview */}
            <div style={{ height: 180, pointerEvents: "none" }}>
              <VizHost payload={{ type, params: getDefaultParams(type) }} height={180} />
            </div>
            {/* Card footer */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ color: VIZ_COLORS.text, fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                {VIZ_LABELS[type]}
              </div>
              <div style={{ color: VIZ_COLORS.textMuted, fontSize: 12, lineHeight: 1.4 }}>
                {VIZ_DESCRIPTIONS[type]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {openType && <VizModal type={openType} onClose={() => setOpenType(null)} />}
    </div>
  );
}

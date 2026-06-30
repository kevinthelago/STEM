import { useState, useCallback } from 'react'
import type { VizType } from './types'
import { VIZ_TYPES, getDefaultParams } from './registry'
import { VizHost } from './VizHost'
import { surface, border, text, accent, font } from '@/theme'

const VIZ_LABELS: Record<VizType, string> = {
  vector3d: '3D Vectors',
  matrix_transform: 'Matrix Transform',
  function_plot: 'Function Plot',
  distribution: 'Distribution',
  gradient_descent: 'Gradient Descent',
  physics_sim: 'Physics Simulation',
}

const VIZ_SUBTITLES: Record<VizType, string> = {
  vector3d: '3D · rotate / zoom',
  matrix_transform: 'linear transforms · grid warp',
  function_plot: '2D · f(x) = expression',
  distribution: 'probability · Gaussian / uniform',
  gradient_descent: 'optimization · loss landscape',
  physics_sim: 'elastic collisions · gravity',
}

interface ParamDef {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
}

// Slider-adjustable params for viz types with simple numeric fields
const VIZ_PARAM_DEFS: Partial<Record<VizType, ParamDef[]>> = {
  distribution: [
    { key: 'mu', label: 'μ (mean)', min: -4, max: 4, step: 0.1, default: 0 },
    { key: 'sigma', label: 'σ (std dev)', min: 0.1, max: 3, step: 0.1, default: 1 },
  ],
  gradient_descent: [
    { key: 'learningRate', label: 'learning rate', min: 0.01, max: 0.49, step: 0.01, default: 0.1 },
    { key: 'steps', label: 'steps', min: 5, max: 80, step: 5, default: 30 },
    { key: 'startX', label: 'start x₀', min: -3, max: 3, step: 0.1, default: 2.5 },
    { key: 'startY', label: 'start y₀', min: -3, max: 3, step: 0.1, default: 2.5 },
  ],
}

export interface VisualizeModeProps {
  /** Pre-select a specific viz type, e.g. from a VizChip in Learn. */
  initialVizType?: VizType
  /** Render a "Back to Learn" button that calls this when clicked. */
  onBackToLearn?: () => void
}

export function VisualizeMode({ initialVizType, onBackToLearn }: VisualizeModeProps) {
  const [activeType, setActiveType] = useState<VizType>(
    initialVizType ?? VIZ_TYPES[0]
  )
  const [paramOverrides, setParamOverrides] = useState<
    Partial<Record<VizType, Record<string, number>>>
  >({})

  const handleSelect = useCallback((type: VizType) => {
    setActiveType(type)
  }, [])

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParamOverrides((prev) => ({
        ...prev,
        [activeType]: {
          ...((prev[activeType] as Record<string, number> | undefined) ?? {}),
          [key]: value,
        },
      }))
    },
    [activeType]
  )

  const baseParams = getDefaultParams(activeType)
  const overrides = paramOverrides[activeType] ?? {}
  const mergedParams: Record<string, unknown> = { ...baseParams, ...overrides }
  const paramDefs = VIZ_PARAM_DEFS[activeType] ?? []

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        minHeight: 0,
        background: surface.canvas,
        overflow: 'hidden',
      }}
      data-testid="visualize-mode"
    >
      {/* Gallery sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: surface.panel,
          borderRight: `1px solid ${border.inner}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        data-testid="viz-sidebar"
      >
        <div style={{ padding: '13px 14px 10px', borderBottom: `1px solid ${border.inner}` }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: text.placeholder,
              marginBottom: 3,
              fontFamily: font.mono,
            }}
          >
            Visualizations
          </div>
          <div style={{ fontSize: 11.5, color: text.dimmed, fontFamily: font.ui }}>
            pick a visualization to explore
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {VIZ_TYPES.map((type) => {
            const active = type === activeType
            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 7,
                  width: '100%',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: active ? accent.tint : 'transparent',
                  boxShadow: active ? `inset 2px 0 0 ${accent.primary}` : 'none',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    flexShrink: 0,
                    background: active ? accent.primary : 'transparent',
                    border: active ? 'none' : '1px solid #4f6080',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: active ? text.primary : text.muted,
                      fontWeight: active ? 500 : 400,
                      fontFamily: font.ui,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {VIZ_LABELS[type]}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: active ? text.dimmed : text.placeholder,
                      fontFamily: font.ui,
                    }}
                  >
                    {VIZ_SUBTITLES[type]}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {onBackToLearn && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${border.inner}` }}>
            <button
              onClick={onBackToLearn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: text.muted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 0',
                fontFamily: font.ui,
                width: '100%',
              }}
            >
              <svg
                width={9}
                height={10}
                viewBox="0 0 9 10"
                style={{ transform: 'rotate(180deg)' }}
              >
                <polygon points="0,0 9,5 0,10" fill={accent.primary} />
              </svg>
              Back to Learn
            </button>
          </div>
        )}
      </aside>

      {/* Canvas + optional controls */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Canvas header */}
        <div
          style={{
            height: 48,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 22px',
            borderBottom: `1px solid ${border.inner}`,
            background: surface.panel,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: text.primary, fontFamily: font.ui }}>
            {VIZ_LABELS[activeType]}
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 11, color: text.placeholder }}>
            {activeType}
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 11,
              color: text.muted,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: font.ui,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#43b888' }} />
            live
          </span>
        </div>

        {/* Canvas + controls row */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <VizHost
              payload={{ type: activeType, params: mergedParams }}
              className="viz-mode-canvas"
            />
          </div>

          {paramDefs.length > 0 && (
            <aside
              style={{
                width: 290,
                flexShrink: 0,
                background: surface.panel,
                borderLeft: `1px solid ${border.inner}`,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
              data-testid="viz-controls"
            >
              <div
                style={{
                  padding: '14px 18px 12px',
                  borderBottom: `1px solid ${border.inner}`,
                }}
              >
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: text.primary, fontFamily: font.ui }}
                >
                  Parameters
                </div>
                <div
                  style={{ fontSize: 11, color: text.placeholder, marginTop: 2, fontFamily: font.ui }}
                >
                  drag to adjust
                </div>
              </div>

              <div
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {paramDefs.map((def) => {
                  const value = (overrides[def.key] as number | undefined) ?? def.default
                  const pct = Math.max(
                    0,
                    Math.min(100, ((value - def.min) / (def.max - def.min)) * 100)
                  )
                  return (
                    <div key={def.key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 7,
                        }}
                      >
                        <span style={{ fontFamily: font.mono, fontSize: 12, color: text.muted }}>
                          {def.label}
                        </span>
                        <span style={{ fontFamily: font.mono, fontSize: 12, color: accent.text }}>
                          {value.toFixed(def.step < 0.1 ? 3 : 2)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          borderRadius: 3,
                          background: surface.track,
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${pct}%`,
                            background: accent.primary,
                            borderRadius: 3,
                          }}
                        />
                        <input
                          type="range"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={value}
                          aria-label={def.label}
                          onChange={(e) =>
                            handleParamChange(def.key, parseFloat(e.target.value))
                          }
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default VisualizeMode

import { useState, useCallback, useMemo } from 'react'
import type { VizType } from './types'
import { VIZ_TYPES, getDefaultParams } from './registry'
import { VizHost } from './VizHost'
import { surface, border, text, accent, grade, font } from '@/theme'

const VIZ_LABELS: Record<VizType, string> = {
  eigen_2d: 'Eigenvectors',
  vector3d: '3D Vectors',
  matrix_transform: 'Matrix Transforms',
  function_plot: 'Function Plot',
  distribution: 'Distributions',
  gradient_descent: 'Gradient Descent',
  physics_sim: 'Physics Sim',
}

const VIZ_SUBTITLES: Record<VizType, string> = {
  eigen_2d: '2D · eigen-decomposition',
  vector3d: 'three.js · rotate/zoom',
  matrix_transform: 'linear transforms · grid warp',
  function_plot: '2D · f(x) = expression',
  distribution: 'probability · Gaussian / uniform',
  gradient_descent: 'optimization · loss landscape',
  physics_sim: 'basic mechanics',
}

interface ParamDef {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
  /** path into params, e.g. ['matrix', '0', '0'] */
  path?: string[]
}

const EIGEN_PRESETS: Record<string, [[number, number], [number, number]]> = {
  Symmetric: [[2, 1], [1, 2]],
  Shear: [[1, 1], [0, 1]],
  Scaling: [[3, 0], [0, 1.5]],
  Rotation: [[0.5, -0.866], [0.866, 0.5]],
}

const VIZ_PARAM_DEFS: Partial<Record<VizType, ParamDef[]>> = {
  eigen_2d: [
    { key: 'a11', label: 'a₁₁', min: -3, max: 3, step: 0.1, default: 2, path: ['matrix', '0', '0'] },
    { key: 'a12', label: 'a₁₂', min: -3, max: 3, step: 0.1, default: 1, path: ['matrix', '0', '1'] },
    { key: 'a21', label: 'a₂₁', min: -3, max: 3, step: 0.1, default: 1, path: ['matrix', '1', '0'] },
    { key: 'a22', label: 'a₂₂', min: -3, max: 3, step: 0.1, default: 2, path: ['matrix', '1', '1'] },
  ],
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
  initialVizType?: VizType
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
  const paramDefs = VIZ_PARAM_DEFS[activeType] ?? []

  // Build merged params for the viz host
  const mergedParams = useMemo((): Record<string, unknown> => {
    if (activeType !== 'eigen_2d') return { ...baseParams, ...overrides }

    // For eigen_2d, flatten matrix path overrides back into a matrix structure
    const base = baseParams as { matrix: [[number, number], [number, number]] }
    const mat: [[number, number], [number, number]] = [
      [base.matrix[0][0], base.matrix[0][1]],
      [base.matrix[1][0], base.matrix[1][1]],
    ]
    if ('a11' in overrides) mat[0][0] = (overrides as Record<string, number>).a11
    if ('a12' in overrides) mat[0][1] = (overrides as Record<string, number>).a12
    if ('a21' in overrides) mat[1][0] = (overrides as Record<string, number>).a21
    if ('a22' in overrides) mat[1][1] = (overrides as Record<string, number>).a22
    return { ...baseParams, matrix: mat }
  }, [activeType, baseParams, overrides])

  // Eigen computed values for the readout panel
  const eigenComputed = useMemo(() => {
    if (activeType !== 'eigen_2d') return null
    const mat = mergedParams.matrix as [[number, number], [number, number]]
    const a = mat[0][0]; const b = mat[0][1]
    const c = mat[1][0]; const d = mat[1][1]
    const trace = a + d
    const det = a * d - b * c
    const disc = trace * trace - 4 * det
    if (disc < 0) return { trace, det, lambda1: null, lambda2: null }
    const sqrtDisc = Math.sqrt(disc)
    return {
      trace,
      det,
      lambda1: (trace + sqrtDisc) / 2,
      lambda2: (trace - sqrtDisc) / 2,
    }
  }, [activeType, mergedParams])

  const applyPreset = useCallback((name: string) => {
    const preset = EIGEN_PRESETS[name]
    if (!preset) return
    setParamOverrides((prev) => ({
      ...prev,
      eigen_2d: {
        ...((prev.eigen_2d as Record<string, number> | undefined) ?? {}),
        a11: preset[0][0],
        a12: preset[0][1],
        a21: preset[1][0],
        a22: preset[1][1],
      },
    }))
  }, [])

  const getParamValue = (def: ParamDef): number => {
    const ov = overrides as Record<string, number>
    return def.key in ov ? ov[def.key] : def.default
  }

  const fmt = (n: number) =>
    Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2)

  const showControls = paramDefs.length > 0

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
          width: 266,
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
            Visualization gallery
          </div>
          <div style={{ fontSize: 11.5, color: text.dimmed, fontFamily: font.ui }}>
            pick directly, or open from a &lt;viz&gt; chip
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
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    flexShrink: 0,
                    background: active ? accent.primary : 'transparent',
                    border: active ? 'none' : `1px solid ${text.disabled}`,
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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: grade.correct }} />
            live
          </span>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: text.placeholder,
              padding: '4px 9px',
              border: `1px solid ${border.subtle}`,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ⤢ reset view
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

          {showControls && (
            <aside
              style={{
                width: 308,
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
                  padding: '15px 18px 12px',
                  borderBottom: `1px solid ${border.inner}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: text.primary, fontFamily: font.ui }}>
                  Parameters
                </div>
                <div style={{ fontSize: 11, color: text.placeholder, marginTop: 2, fontFamily: font.ui }}>
                  {activeType === 'eigen_2d' ? 'matrix A — drag or type' : 'drag to adjust'}
                </div>
              </div>

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {paramDefs.map((def) => {
                    const value = getParamValue(def)
                    const pct = Math.max(0, Math.min(100, ((value - def.min) / (def.max - def.min)) * 100))
                    return (
                      <div key={def.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
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
                          <div
                            style={{
                              position: 'absolute',
                              left: `${pct}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: accent.text,
                              boxShadow: `0 0 0 3px ${accent.tint}`,
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="range"
                            min={def.min}
                            max={def.max}
                            step={def.step}
                            value={value}
                            aria-label={def.label}
                            onChange={(e) => handleParamChange(def.key, parseFloat(e.target.value))}
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

                {/* Eigen computed readout */}
                {activeType === 'eigen_2d' && eigenComputed && (
                  <div
                    style={{
                      background: surface.base,
                      border: `1px solid ${border.subtle}`,
                      borderRadius: 9,
                      padding: '13px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: text.placeholder,
                        marginBottom: 9,
                        fontFamily: font.mono,
                      }}
                    >
                      Computed
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: text.muted, fontFamily: font.ui }}>eigenvalues</span>
                      <span style={{ fontFamily: font.mono, fontSize: 12, color: text.primary }}>
                        {eigenComputed.lambda1 !== null
                          ? `${fmt(eigenComputed.lambda1)}, ${fmt(eigenComputed.lambda2!)}`
                          : 'complex'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: text.muted, fontFamily: font.ui }}>det A</span>
                      <span style={{ fontFamily: font.mono, fontSize: 12, color: text.primary }}>
                        {fmt(eigenComputed.det)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: text.muted, fontFamily: font.ui }}>trace A</span>
                      <span style={{ fontFamily: font.mono, fontSize: 12, color: text.primary }}>
                        {fmt(eigenComputed.trace)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Presets for eigen_2d */}
                {activeType === 'eigen_2d' && (
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: text.placeholder,
                        marginBottom: 9,
                        fontFamily: font.mono,
                      }}
                    >
                      Presets
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {Object.keys(EIGEN_PRESETS).map((name) => {
                        const preset = EIGEN_PRESETS[name]
                        const cur = mergedParams.matrix as [[number, number], [number, number]]
                        const isActive =
                          cur[0][0] === preset[0][0] &&
                          cur[0][1] === preset[0][1] &&
                          cur[1][0] === preset[1][0] &&
                          cur[1][1] === preset[1][1]
                        return (
                          <button
                            key={name}
                            onClick={() => applyPreset(name)}
                            style={{
                              fontSize: 11.5,
                              color: isActive ? accent.text : text.muted,
                              padding: '5px 11px',
                              borderRadius: 6,
                              background: isActive ? accent.tint : surface.raised,
                              border: `1px solid ${isActive ? accent.border : border.card}`,
                              cursor: 'pointer',
                              fontFamily: font.ui,
                            }}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Back to Learn chat */}
                {onBackToLearn && (
                  <button
                    onClick={onBackToLearn}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '11px 13px',
                      borderRadius: 9,
                      background: surface.input,
                      border: `1px solid ${border.card}`,
                      cursor: 'pointer',
                      fontFamily: font.ui,
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <svg width={9} height={10} viewBox="0 0 9 10" style={{ transform: 'rotate(180deg)', flexShrink: 0 }}>
                      <polygon points="0,0 9,5 0,10" fill={accent.primary} />
                    </svg>
                    <span style={{ fontSize: 12.5, color: accent.text }}>Back to Learn chat</span>
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default VisualizeMode

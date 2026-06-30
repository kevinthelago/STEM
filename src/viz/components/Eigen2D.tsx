import { useMemo } from 'react'
import type { VizComponentProps } from '../types'
import type { Eigen2DParams } from '../types'

interface EigenResult {
  hasReal: boolean
  lambda1?: number
  lambda2?: number
  v1?: [number, number]
  v2?: [number, number]
  trace: number
  det: number
}

function computeEigen(a: number, b: number, c: number, d: number): EigenResult {
  const trace = a + d
  const det = a * d - b * c
  const disc = trace * trace - 4 * det

  if (disc < 0) return { hasReal: false, trace, det }

  const sqrtDisc = Math.sqrt(Math.max(0, disc))
  const lambda1 = (trace + sqrtDisc) / 2
  const lambda2 = (trace - sqrtDisc) / 2

  const eigenvector = (lam: number): [number, number] => {
    if (Math.abs(b) > 1e-10) {
      const mag = Math.sqrt(b * b + (lam - a) * (lam - a))
      return mag < 1e-10 ? [1, 0] : [b / mag, (lam - a) / mag]
    }
    if (Math.abs(c) > 1e-10) {
      const mag = Math.sqrt((lam - d) * (lam - d) + c * c)
      return mag < 1e-10 ? [1, 0] : [(lam - d) / mag, c / mag]
    }
    return Math.abs(a - lam) < 1e-10 ? [1, 0] : [0, 1]
  }

  return {
    hasReal: true,
    lambda1,
    lambda2,
    v1: eigenvector(lambda1),
    v2: eigenvector(lambda2),
    trace,
    det,
  }
}

function worldToScreen(
  x: number,
  y: number,
  cx: number,
  cy: number,
  scale: number
): [number, number] {
  return [cx + x * scale, cy - y * scale]
}

export function Eigen2D({ params }: VizComponentProps<Eigen2DParams>) {
  const mat = params.matrix ?? [[2, 1], [1, 2]]
  const a = mat[0][0]
  const b = mat[0][1]
  const c = mat[1][0]
  const d = mat[1][1]

  const eigen = useMemo(() => computeEigen(a, b, c, d), [a, b, c, d])

  const W = 560
  const H = 470
  const cx = W / 2
  const cy = H / 2
  const scale = 60

  const toS = (x: number, y: number) => worldToScreen(x, y, cx, cy, scale)

  // Fixed input vector (interesting, not along eigenlines)
  const vx = 1.5
  const vy = 0.4
  const avx = a * vx + b * vy
  const avy = c * vx + d * vy

  // Clamp Av to ±4 range so it doesn't go offscreen
  const avLen = Math.sqrt(avx * avx + avy * avy)
  const maxLen = 3.5
  const [avxClamped, avyClamped] =
    avLen > maxLen ? [avx * (maxLen / avLen), avy * (maxLen / avLen)] : [avx, avy]

  const [vsx, vsy] = toS(vx, vy)
  const [avsx, avsy] = toS(avxClamped, avyClamped)
  const [ox, oy] = toS(0, 0)

  // Arrow head
  function arrowHead(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return ''
    const ux = dx / len
    const uy = dy / len
    const px = -uy
    const py = ux
    const sz = 7
    const base = 3.5
    return `${x2},${y2} ${x2 - ux * sz + px * base},${y2 - uy * sz + py * base} ${x2 - ux * sz - px * base},${y2 - uy * sz - py * base}`
  }

  // Eigenlines: extend from edge to edge
  function eigenLine(evx: number, evy: number): [number, number, number, number] {
    const reach = 4.5
    return [
      ...toS(-evx * reach, -evy * reach),
      ...toS(evx * reach, evy * reach),
    ] as [number, number, number, number]
  }

  // Grid lines: -4 to 4
  const gridLines: number[] = [-4, -3, -2, -1, 1, 2, 3, 4]

  const fmt1 = (n: number) => (Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2))

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        position: 'relative',
      }}
      data-testid="eigen-2d"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', maxWidth: W, maxHeight: H }}
      >
        {/* Grid */}
        <g stroke="#1b1d24" strokeWidth={1}>
          {gridLines.map((i) => {
            const [gx1, gy1] = toS(i, -4.5)
            const [gx2, gy2] = toS(i, 4.5)
            const [hx1, hy1] = toS(-4.5, i)
            const [hx2, hy2] = toS(4.5, i)
            return (
              <g key={i}>
                <line x1={gx1} y1={gy1} x2={gx2} y2={gy2} />
                <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} />
              </g>
            )
          })}
        </g>

        {/* Axes */}
        <g stroke="#33363f" strokeWidth={1.5}>
          <line x1={toS(-4.5, 0)[0]} y1={toS(-4.5, 0)[1]} x2={toS(4.5, 0)[0]} y2={toS(4.5, 0)[1]} />
          <line x1={toS(0, -4.5)[0]} y1={toS(0, -4.5)[1]} x2={toS(0, 4.5)[0]} y2={toS(0, 4.5)[1]} />
        </g>

        {/* Eigenlines */}
        {eigen.hasReal && eigen.v1 && (
          <g>
            {(() => {
              const [x1, y1, x2, y2] = eigenLine(eigen.v1[0], eigen.v1[1])
              return (
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#9a7cff"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  opacity={0.85}
                />
              )
            })()}
          </g>
        )}
        {eigen.hasReal && eigen.v2 && (
          <g>
            {(() => {
              const [x1, y1, x2, y2] = eigenLine(eigen.v2[0], eigen.v2[1])
              return (
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#d2934a"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  opacity={0.85}
                />
              )
            })()}
          </g>
        )}

        {/* Input vector v */}
        <line
          x1={ox} y1={oy} x2={vsx} y2={vsy}
          stroke="#e6e8ee"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <polygon points={arrowHead(ox, oy, vsx, vsy)} fill="#e6e8ee" />

        {/* Av vector */}
        <line
          x1={ox} y1={oy} x2={avsx} y2={avsy}
          stroke="#9a7cff"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <polygon points={arrowHead(ox, oy, avsx, avsy)} fill="#9a7cff" />

        {/* Origin */}
        <circle cx={ox} cy={oy} r={3.5} fill="#e6e8ee" />

        {/* Labels */}
        <text
          x={vsx + 6}
          y={vsy - 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize={12}
          fill="#e6e8ee"
        >
          v
        </text>
        <text
          x={avsx + 6}
          y={avsy - 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize={12}
          fill="#cdbcff"
        >
          Av
        </text>

        {/* Eigenvalue labels at line endpoints */}
        {eigen.hasReal && eigen.v1 && (
          <text
            x={toS(eigen.v1[0] * 3.8, eigen.v1[1] * 3.8)[0] + 4}
            y={toS(eigen.v1[0] * 3.8, eigen.v1[1] * 3.8)[1] - 4}
            fontFamily="JetBrains Mono, monospace"
            fontSize={11}
            fill="#9a7cff"
          >
            λ₁={fmt1(eigen.lambda1!)}
          </text>
        )}
        {eigen.hasReal && eigen.v2 && eigen.lambda2 !== eigen.lambda1 && (
          <text
            x={toS(eigen.v2[0] * 3.8, eigen.v2[1] * 3.8)[0] + 4}
            y={toS(eigen.v2[0] * 3.8, eigen.v2[1] * 3.8)[1] + 12}
            fontFamily="JetBrains Mono, monospace"
            fontSize={11}
            fill="#d2934a"
          >
            λ₂={fmt1(eigen.lambda2!)}
          </text>
        )}

        {/* Complex eigenvalue notice */}
        {!eigen.hasReal && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize={13}
            fill="#9aa0ad"
          >
            complex eigenvalues — no real eigendirections
          </text>
        )}

        {/* Legend */}
        <g>
          <rect
            x={30}
            y={H - 100}
            width={200}
            height={84}
            rx={7}
            fill="rgba(14,15,19,0.75)"
            stroke="#24262e"
          />
          <line x1={44} y1={H - 80} x2={58} y2={H - 80} stroke="#e6e8ee" strokeWidth={2} />
          <text x={66} y={H - 76} fontFamily="JetBrains Mono, monospace" fontSize={11} fill="#9aa0ad">
            input vector v
          </text>
          <line x1={44} y1={H - 62} x2={58} y2={H - 62} stroke="#9a7cff" strokeWidth={2} />
          <text x={66} y={H - 58} fontFamily="JetBrains Mono, monospace" fontSize={11} fill="#9aa0ad">
            Av
          </text>
          <line
            x1={44}
            y1={H - 44}
            x2={58}
            y2={H - 44}
            stroke="#9a7cff"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <text x={66} y={H - 40} fontFamily="JetBrains Mono, monospace" fontSize={11} fill="#9aa0ad">
            eigendirections
          </text>
        </g>
      </svg>
    </div>
  )
}

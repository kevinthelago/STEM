import { useEffect, useState } from 'react'
import { surface, border, accent, text, font } from '@/theme'
import { Button } from '@/lib/components/Button'
import { useSettingsStore } from '@/app/store'
import { claudeProbe } from '@/lib/tauri'
import type { ClaudeProbeResult } from '@/lib/types'

export function Settings() {
  const { settings, dirty, load, update, persist } = useSettingsStore()
  const [probing, setProbing] = useState(false)
  const [probeResult, setProbeResult] = useState<ClaudeProbeResult | null>(null)

  useEffect(() => {
    load()
  }, [load])

  async function handleProbe() {
    setProbing(true)
    try {
      const result = await claudeProbe()
      setProbeResult(result)
      if (result.path) {
        update({ claudePath: result.path })
      }
    } finally {
      setProbing(false)
    }
  }

  const weights = settings.masteryWeights
  const totalWeight =
    weights.problemAccuracy + weights.explainGrade + weights.capstone + weights.retention

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: surface.panel }}>
      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: text.primary, marginBottom: '4px' }}>
            Settings
          </h1>
          <p style={{ fontSize: '13px', color: text.placeholder }}>
            Local-first — all settings stored on your machine.
          </p>
        </div>

        {/* Claude CLI */}
        <Section title="Claude CLI">
          <Field label="Claude executable path">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={settings.claudePath}
                onChange={(e) => update({ claudePath: e.target.value })}
                placeholder="/usr/local/bin/claude"
                style={{
                  flex: 1,
                  height: '36px',
                  padding: '0 12px',
                  background: surface.raised,
                  border: `1px solid ${border.subtle}`,
                  borderRadius: '7px',
                  fontSize: '13px',
                  color: text.secondary,
                  fontFamily: font.mono,
                }}
              />
              <Button variant="secondary" size="sm" onClick={handleProbe} disabled={probing}>
                {probing ? 'Probing…' : 'Auto-detect'}
              </Button>
            </div>
            {probeResult && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: probeResult.found ? '#43b888' : '#e0625f',
                }}
              >
                {probeResult.found
                  ? `✓ Found: ${probeResult.path}${probeResult.version ? ` (${probeResult.version})` : ''}`
                  : '✗ claude not found — install it via npm i -g @anthropic-ai/claude-code'}
              </div>
            )}
          </Field>
        </Section>

        {/* Mastery weights */}
        <Section title="Mastery weights">
          <p style={{ fontSize: '12px', color: text.placeholder, marginBottom: '14px' }}>
            How the four signals combine into a per-topic mastery score. Must sum to 1.0.{' '}
            <span style={{ color: Math.abs(totalWeight - 1) < 0.001 ? '#43b888' : '#e0625f' }}>
              (current: {totalWeight.toFixed(2)})
            </span>
          </p>
          {(
            [
              { key: 'problemAccuracy', label: 'Problem accuracy' },
              { key: 'explainGrade', label: 'Explain / derive' },
              { key: 'capstone', label: 'Capstone projects' },
              { key: 'retention', label: 'Spaced retention' },
            ] as const
          ).map(({ key, label }) => (
            <WeightSlider
              key={key}
              label={label}
              value={weights[key]}
              onChange={(v) =>
                update({ masteryWeights: { ...weights, [key]: v } })
              }
            />
          ))}
        </Section>

        {/* Data */}
        <Section title="Data">
          <Field label="Data directory">
            <input
              type="text"
              value={settings.dataDir}
              onChange={(e) => update({ dataDir: e.target.value })}
              placeholder="~/.stem"
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                background: surface.raised,
                border: `1px solid ${border.subtle}`,
                borderRadius: '7px',
                fontSize: '13px',
                color: text.secondary,
                fontFamily: font.mono,
              }}
            />
          </Field>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Button variant="ghost" size="sm">
              Export backup
            </Button>
            <Button variant="danger" size="sm">
              Reset all data…
            </Button>
          </div>
        </Section>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={persist} disabled={!dirty}>
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: text.placeholder,
          marginBottom: '14px',
          paddingBottom: '8px',
          borderBottom: `1px solid ${border.inner}`,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', color: text.muted }}>{label}</label>
      {children}
    </div>
  )
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange(v: number): void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: text.muted }}>{label}</span>
        <span style={{ fontFamily: font.mono, fontSize: '12px', color: accent.text }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div style={{ position: 'relative', height: '5px', borderRadius: '3px', background: surface.track }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${value * 100}%`,
            background: accent.primary,
            borderRadius: '3px',
          }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            inset: '-4px 0',
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
          }}
        />
      </div>
    </div>
  )
}

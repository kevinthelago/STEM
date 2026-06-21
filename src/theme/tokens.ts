// Design system tokens — single source of truth for all visual primitives.
// Keep this in sync with src/index.css :root variables.

export const surface = {
  base: '#08090c',
  panel: '#0e0f13',
  overlay: '#131419',
  raised: '#1a1c22',
  track: '#22242c',
  input: '#16181d',
  canvas: '#0b0c10',
} as const

export const accent = {
  primary: '#9a7cff',
  text: '#cdbcff',
  tint: 'rgba(154,124,255,0.16)',
  border: 'rgba(154,124,255,0.34)',
  activeBg: 'rgba(154,124,255,0.13)',
} as const

export const text = {
  primary: '#e6e8ee',
  secondary: '#c9cdd8',
  tertiary: '#d7dae2',
  muted: '#9aa0ad',
  dimmed: '#7e8494',
  placeholder: '#626878',
  disabled: '#5b6172',
  separator: '#3a3e48',
} as const

export const border = {
  outer: '#262932',
  inner: '#1e2027',
  subtle: '#24262e',
  card: '#2a2d36',
  user: '#2e313a',
} as const

export const mastery = {
  unstarted: '#5b6172',
  learning: '#d2934a',
  proficient: '#4f93e0',
  mastered: '#43b888',
  prerequisiteWarn: '#a06a3a',
} as const

export const grade = {
  correct: '#43b888',
  correctBg: 'rgba(67,184,136,0.06)',
  partial: '#d2934a',
  partialBg: 'rgba(210,147,74,0.06)',
  wrong: '#e0625f',
  wrongBg: 'rgba(224,98,95,0.06)',
  wrongBorder: '#3a2727',
  wrongInnerBorder: '#2e2122',
} as const

export const font = {
  ui: "'IBM Plex Sans', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

export const radius = {
  sm: '5px',
  md: '6px',
  lg: '7px',
  xl: '8px',
  '2xl': '9px',
  '3xl': '10px',
  '4xl': '11px',
  '5xl': '12px',
  pill: '9999px',
} as const

export const shadow = {
  card: '0 28px 70px rgba(0,0,0,0.55)',
} as const

// Mastery level → display value
export type MasteryLevel = 'unstarted' | 'learning' | 'proficient' | 'mastered'

export function masteryColor(level: MasteryLevel): string {
  return mastery[level]
}

export function masteryLabel(level: MasteryLevel): string {
  const labels: Record<MasteryLevel, string> = {
    unstarted: 'Unstarted',
    learning: 'Learning',
    proficient: 'Proficient',
    mastered: 'Mastered',
  }
  return labels[level]
}

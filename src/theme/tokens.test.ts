import { describe, it, expect } from 'vitest'
import { masteryColor, masteryLabel, surface, accent } from './tokens'

describe('theme tokens', () => {
  it('surface.base is the darkest surface', () => {
    expect(surface.base).toBe('#08090c')
  })

  it('accent.primary is the design-system violet', () => {
    expect(accent.primary).toBe('#9a7cff')
  })

  it('masteryColor returns the correct color for each level', () => {
    expect(masteryColor('unstarted')).toBe('#5b6172')
    expect(masteryColor('learning')).toBe('#d2934a')
    expect(masteryColor('proficient')).toBe('#4f93e0')
    expect(masteryColor('mastered')).toBe('#43b888')
  })

  it('masteryLabel returns a display string', () => {
    expect(masteryLabel('learning')).toBe('Learning')
    expect(masteryLabel('mastered')).toBe('Mastered')
  })
})

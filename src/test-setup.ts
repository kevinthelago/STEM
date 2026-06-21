/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import type React from 'react'

// Mock Tauri API so unit tests don't need a Tauri runtime
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}))

// Stub three.js WebGL context for happy-dom
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three')
  return actual
})

// Stub @react-three/fiber for non-WebGL test env
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ size: { width: 800, height: 600 } })),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Line: () => null,
  Text: () => null,
  Html: ({ children }: { children: React.ReactNode }) => children,
}))

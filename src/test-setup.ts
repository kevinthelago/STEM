import "@testing-library/jest-dom";
import { vi } from "vitest";

// Stub Tauri invoke for unit tests
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Stub three.js WebGL context for jsdom/happy-dom
vi.mock("three", async () => {
  const actual = await vi.importActual<typeof import("three")>("three");
  return actual;
});

// Stub @react-three/fiber for non-WebGL test env
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ size: { width: 800, height: 600 } })),
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Line: () => null,
  Text: () => null,
  Html: ({ children }: { children: React.ReactNode }) => children,
}));

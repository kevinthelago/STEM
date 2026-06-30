// Bridge R3F's ThreeElements into React.JSX.IntrinsicElements.
// R3F 8.x extends the legacy global JSX namespace; this covers the namespace
// that react/jsx-runtime actually exports under React 19 / TypeScript 6.
import type { ThreeElements } from '@react-three/fiber'

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}

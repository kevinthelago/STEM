/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

// Allow plain CSS/less/sass side-effect imports (non-module)
declare module '*.css' {
  const _content: undefined
  export default _content
}

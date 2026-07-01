# Visualize Framework <-> Scenes Contract

Splits ownership between **visualize-core** (the framework/shell) and **viz-scenes**
(the individual visualization implementations), so new scenes never require an edit to
a visualize-core-owned file.

---

## Ownership

- **visualize-core owns**: `src/viz/VizHost.tsx`, `src/viz/VisualizeMode.tsx`,
  `src/viz/VizGallery.tsx`, `src/viz/theme.ts`, and the *mechanism* functions in
  `src/viz/registry.tsx` (`isKnownVizType`, `getDefaultParams`, `VIZ_REGISTRY`,
  `VIZ_TYPES`). It builds the generic shell: canvas host, gallery sidebar, and a
  **generic params-panel renderer** that reads each scene's `paramDefs` from the
  registry metadata (see below) instead of hardcoding per-type slider logic.
- **viz-scenes owns**: every file under `src/viz/components/*.tsx` (one scene each)
  and `src/viz/utils/*` (compute helpers, e.g. `eigenvectors.ts`), plus the **data
  entries** it adds to `src/viz/registry.tsx` and `src/viz/types.ts` -- i.e. viz-scenes
  is the only stream that edits those two files going forward, and only by *appending*
  a new `VizType` key + its param interface + defaults + metadata. It never edits
  visualize-core's shell components.

This keeps `registry.tsx`/`types.ts` a single append-only surface so both streams'
edits land as independent additions rather than conflicting rewrites.

---

## Canvas host -- `VizHost` (already built, `src/viz/VizHost.tsx`)

```tsx
import { VizHost } from '@/viz/VizHost'
import type { VizPayload } from '@/viz/types'

<VizHost payload={{ type: string, params: Record<string, unknown> }}
         width?={number} height?={number} className?={string} />
```

- Resolves `payload.type` via `isKnownVizType` -> looks up `VIZ_REGISTRY[type]` (a
  `React.lazy` component).
- Merges `getDefaultParams(type)` with `payload.params` (payload wins) before
  passing as the `params` prop.
- Unknown `type` renders `VizPlaceholder` -- never throws.

## Scene component contract (`VizComponentProps<P>`, `src/viz/types.ts`)

Every scene component viz-scenes adds must match:

```tsx
export interface VizComponentProps<P = Record<string, unknown>> {
  params: P
}

export function MyScene({ params }: VizComponentProps<MySceneParams>) { /* ... */ }
```

Register it in `registry.tsx` by adding ONE new key to `VIZ_REGISTRY` (lazy import),
ONE new key to `DEFAULTS`, and its `VizType` union member + params interface in
`types.ts`. Do not touch existing keys.

## Controls / params panel

Today `VisualizeMode.tsx` hardcodes `VIZ_PARAM_DEFS` (a `ParamDef[]` per type) and its
own slider UI. Going forward, **each scene supplies its own `paramDefs`** as part of
its registry entry rather than visualize-core hardcoding it per type:

```ts
// in registry.tsx, alongside VIZ_REGISTRY / DEFAULTS -- viz-scenes appends here
export const VIZ_PARAM_DEFS: Partial<Record<VizType, ParamDef[]>> = {
  eigen_2d: [ /* existing */ ],
  my_new_scene: [
    { key: 'foo', label: 'Foo', min: 0, max: 1, step: 0.01, default: 0.5 },
  ],
}
```

`ParamDef` (already defined inline in `VisualizeMode.tsx` -- move to `types.ts`):
```ts
interface ParamDef {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
  path?: string[] // optional: nested path into params, e.g. ['matrix','0','0']
}
```

visualize-core's `VisualizeMode.tsx` reads `VIZ_PARAM_DEFS[activeType]` generically
(as it already does) to render the sliders panel -- a scene with no entry simply shows
no controls panel (`showControls = paramDefs.length > 0`, already implemented).

Also move `VIZ_LABELS` / `VIZ_SUBTITLES` (currently inline in `VisualizeMode.tsx`) into
`registry.tsx` next to `VIZ_REGISTRY`, keyed the same way, so viz-scenes can add a
label/subtitle for its new scene without editing `VisualizeMode.tsx`.

## Build-order note

visualize-core lands the shell + the generic paramDefs-driven controls renderer first;
viz-scenes builds its scenes against this contract in parallel without waiting -- the
existing 7 scene components + their current inline param defs already conform to this
shape and just need the `VIZ_PARAM_DEFS`/`VIZ_LABELS`/`VIZ_SUBTITLES` relocation from
`VisualizeMode.tsx` into `registry.tsx`.
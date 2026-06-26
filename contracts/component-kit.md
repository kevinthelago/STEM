# Shared Component Kit Contract

The canonical interface for every primitive exported from `src/lib/`. Other streams import
from `@/lib` — do **not** reach into `src/lib/components/*.tsx` directly.

---

## Design tokens

All values come from `src/theme/tokens.ts`. Import groups:

```ts
import { surface, accent, text, border, mastery, grade, font, radius, shadow } from '@/theme'
import type { MasteryLevel } from '@/theme'
```

### Surfaces
| Token | Value |
|---|---|
| `surface.base` | `#08090c` |
| `surface.panel` | `#0e0f13` |
| `surface.overlay` | `#131419` |
| `surface.raised` | `#1a1c22` |
| `surface.track` | `#22242c` |
| `surface.input` | `#16181d` |
| `surface.canvas` | `#0b0c10` |

### Accent (violet — primary action colour)
| Token | Value |
|---|---|
| `accent.primary` | `#9a7cff` |
| `accent.text` | `#cdbcff` |
| `accent.tint` | `rgba(154,124,255,0.16)` |
| `accent.border` | `rgba(154,124,255,0.34)` |
| `accent.activeBg` | `rgba(154,124,255,0.13)` |

### Text
| Token | Value |
|---|---|
| `text.primary` | `#e6e8ee` |
| `text.secondary` | `#c9cdd8` |
| `text.tertiary` | `#d7dae2` |
| `text.muted` | `#9aa0ad` |
| `text.dimmed` | `#7e8494` |
| `text.placeholder` | `#626878` |
| `text.disabled` | `#5b6172` |
| `text.separator` | `#3a3e48` |

### Borders
| Token | Value |
|---|---|
| `border.outer` | `#262932` |
| `border.inner` | `#1e2027` |
| `border.subtle` | `#24262e` |
| `border.card` | `#2a2d36` |
| `border.user` | `#2e313a` |

### Mastery (semantic — never use raw hex)
| Token | Value |
|---|---|
| `mastery.unstarted` | `#5b6172` |
| `mastery.learning` | `#d2934a` |
| `mastery.proficient` | `#4f93e0` |
| `mastery.mastered` | `#43b888` |
| `mastery.prerequisiteWarn` | `#a06a3a` |

### Grading (semantic)
| Token | Value |
|---|---|
| `grade.correct` | `#43b888` |
| `grade.correctBg` | `rgba(67,184,136,0.06)` |
| `grade.partial` | `#d2934a` |
| `grade.partialBg` | `rgba(210,147,74,0.06)` |
| `grade.wrong` | `#e0625f` |
| `grade.wrongBg` | `rgba(224,98,95,0.06)` |
| `grade.wrongBorder` | `#3a2727` |
| `grade.wrongInnerBorder` | `#2e2122` |

### Typography
| Token | Value |
|---|---|
| `font.ui` | `'IBM Plex Sans', -apple-system, system-ui, sans-serif` |
| `font.mono` | `'JetBrains Mono', monospace` |

### Radius
| Token | Value |
|---|---|
| `radius.sm` | `5px` |
| `radius.md` | `6px` |
| `radius.lg` | `7px` |
| `radius.xl` | `8px` |
| `radius['2xl']` | `9px` |
| `radius.pill` | `9999px` |

### Shadows
| Token | Value |
|---|---|
| `shadow.card` | `0 28px 70px rgba(0,0,0,0.55)` |

---

## Helper functions (from `@/theme`)

```ts
masteryColor(level: MasteryLevel): string  // → hex colour for that level
masteryLabel(level: MasteryLevel): string  // → 'Unstarted' | 'Learning' | 'Proficient' | 'Mastered'
```

---

## Components

Import all primitives from `@/lib`:

```ts
import {
  Button, Badge, MasteryDot, MasteryBar,
  Input, Card, Slider,
  ProseRenderer,
  EmptyState, LoadingState, ErrorState,
} from '@/lib'
```

---

### `Button`

```tsx
<Button variant="primary" | "secondary" | "ghost" | "danger"
        size="sm" | "md"
        disabled?
        onClick?
        style?>
  …children
</Button>
```

- **primary** — violet fill (`#9a7cff`), white text, use for the single CTA per context
- **secondary** — `surface.raised` bg, `border.card` border — default variant
- **ghost** — transparent bg, `border.subtle` border — low-emphasis actions
- **danger** — red tint bg, red text — destructive actions
- Size `sm` = 30 px height · 12 px text; size `md` = 40 px · 13 px text

---

### `Badge`

```tsx
<Badge style?>…children</Badge>
```

Violet pill — used for review-due count in TopBar and any small numeric label.
`font.mono`, 10 px, `accent.primary` background, `surface.panel` text.

---

### `MasteryDot`

```tsx
<MasteryDot level={MasteryLevel} size?={6} />
```

Coloured circle using the `mastery.*` token for `level`. Default diameter 6 px.

---

### `MasteryBar`

```tsx
<MasteryBar score={0–100} level={MasteryLevel} width?={120} />
```

Horizontal progress bar. Track is `surface.track`, fill is `mastery[level]`. Height 5 px.

---

### `Input`

```tsx
<Input value={string}
       onChange={(v: string) => void}
       placeholder?
       disabled?
       style? />
```

Full-width text input styled to the design system: `surface.input` background, `border.subtle`
border, `accent.primary` focus ring, `text.primary` text, `text.placeholder` placeholder.

---

### `Card`

```tsx
<Card padding?="default" | "none" style?>…children</Card>
```

Surface card with `surface.raised` background, `border.card` border, `radius['2xl']` corners,
and `shadow.card` drop shadow. `padding="default"` adds `20px 22px`.

---

### `Slider`

```tsx
<Slider value={0–100}
        onChange={(v: number) => void}
        min?={0}
        max?={100}
        disabled?
        label?={string} />
```

Violet accent thumb on a `surface.track` rail. Renders an optional label and the current
numeric value. Wraps the native `<input type="range">`.

---

### `ProseRenderer`

```tsx
<ProseRenderer content={string} isStreaming?={false} />
```

Renders a markdown string with KaTeX math support (inline `$…$` and display `$$…$$`).
Uses `react-markdown` + `remark-math` + `rehype-katex`. Inline code is styled with
`accent.text` on `rgba(154,124,255,0.10)` background; fenced code blocks use a dark
panel (`#121419` bg, `border.subtle` border, `font.mono`). Applies `lineHeight: 1.72`
and `text.secondary` body colour.

Optional `isStreaming` prop adds a blinking cursor (used by Learn mode).

---

### `EmptyState`

```tsx
<EmptyState message={string} />
```

Centered layout with muted text at `text.placeholder` / 13 px. Use when a list or view
has no content.

---

### `LoadingState`

```tsx
<LoadingState message?={"Loading…"} />
```

Same centered layout; shows a pulsing `accent.primary` dot + message. Used while async
data is in flight.

---

### `ErrorState`

```tsx
<ErrorState message={string} onRetry?={() => void} />
```

Centered error display with `grade.wrong` tint text and an optional retry `Button`.

---

## Type exports (from `@/lib`)

```ts
import type {
  Subject, Topic, SessionInfo, ChatMessage, VizPayload, ExplainCheckPrompt,
  ProblemKind, Difficulty, GradeResult, Problem, Grade, MasteryUpdate,
  Note, NoteInput, AppSettings, ClaudeProbeResult, ReviewItem,
  AppMode, ActiveView, MessageRole,
} from '@/lib'
```

---

## Tauri command wrappers (from `@/lib`)

```ts
import {
  listSubjects, listTopics, ensureSession,
  sendLearnMessage, requestExplainCheck, submitExplainAnswer,
  generateProblem, submitAnswer, requestHint, revealSolution,
  getNotes, saveNote, deleteNote, searchNotes,
  getSettings, saveSettings, claudeProbe, exportBackup, resetAllData,
  getReviewDue,
  getPtyHistory, writePty,
  onPtyOutput, onTutorChunk,
  onParsedProblem, onParsedGrade, onParsedMastery, onParsedViz,
} from '@/lib'
```

---

## View-component contract

Each view is a React default export accepting `{ topicId?: string }`:

```ts
// example
export default function LearnMode({ topicId }: { topicId?: string }) { … }
```

The router in `src/app/App.tsx` passes `topicId` for mode views.

---

## Path aliases

| Alias | Resolves to |
|---|---|
| `@/lib` | `src/lib/index.ts` |
| `@/theme` | `src/theme/index.ts` |
| `@/app` | `src/app/` |

# Tauri Command Surface — STEM Backend

Complete reference for the 31 Tauri commands exposed by `src-tauri/`. All commands are
invoked via `@tauri-apps/api/core` `invoke()` from the frontend. Errors are returned as
a rejected promise whose value is a plain string.

---

## PTY Session Manager (5 commands)

One persistent PTY session per topic: bash → `claude` launched inside it. Output is
streamed as raw base64 on `pty-data` and as structured tutor events on the `stem://tutor/*`
event channels (see [Tutor Tag Schema](#tutor-tag-schema) below).

### `pty_create`

```ts
invoke('pty_create', { topicId: string, cols: number, rows: number }): Promise<void>
```

Creates a new PTY session for `topicId` (no-op if the session already exists). Spawns
bash → launches `claude --model claude-sonnet-4-6` inside it, then starts a background
reader thread. Throws if `claude` is not found on PATH.

**Events emitted after this call:**
| Event | Payload |
|---|---|
| `pty-data` | `{ topicId: string, data: string }` — raw PTY bytes, base64-encoded |
| `pty-exit` | `{ topicId: string }` — reader EOF (claude exited) |
| `stem://tutor/problem` | See [Tutor Tag Schema](#tutor-tag-schema) |
| `stem://tutor/grade` | See [Tutor Tag Schema](#tutor-tag-schema) |
| `stem://tutor/mastery` | See [Tutor Tag Schema](#tutor-tag-schema) |
| `stem://tutor/viz` | See [Tutor Tag Schema](#tutor-tag-schema) |
| `stem://tutor/parse-error` | `{ kind: 'parseError', tag: string, reason: string, topicId: string }` |

### `pty_write`

```ts
invoke('pty_write', { topicId: string, data: number[] }): Promise<void>
```

Writes raw bytes to the PTY (user keystrokes forwarded from xterm.js). `data` is a
`Uint8Array` / `number[]`.

### `pty_resize`

```ts
invoke('pty_resize', { topicId: string, cols: number, rows: number }): Promise<void>
```

Resizes the PTY to the new terminal dimensions.

### `pty_kill`

```ts
invoke('pty_kill', { topicId: string }): Promise<void>
```

Kills the PTY session and its entire process tree (Windows Job Object / Unix process
group), then removes it from the registry. No-op if the session does not exist.

### `pty_list`

```ts
invoke('pty_list'): Promise<string[]>
```

Returns the `topicId` keys of all currently active PTY sessions.

---

## Tutor Protocol (5 commands)

Each tutor command injects the STEM operating prompt into the session the first time
it is called for a given `topicId` (500 ms grace period before the actual message),
then writes a formatted message to the PTY. All tutor commands require a live PTY
session (call `pty_create` first).

Common parameters shared by all five commands:

| Param | Type | Description |
|---|---|---|
| `topicId` | `string` | Must match an active PTY session |
| `topicTitle` | `string` | Topic title injected into the operating prompt |
| `topicDescription` | `string` | Topic description for the operating prompt |
| `objectives` | `string` | Learning objectives (newline-separated) |

### `tutor_learn`

```ts
invoke('tutor_learn', {
  topicId, topicTitle, topicDescription, objectives,
  concept: string,
}): Promise<void>
```

Asks the tutor to explain `concept`.

### `tutor_problem`

```ts
invoke('tutor_problem', {
  topicId, topicTitle, topicDescription, objectives,
  difficulty?: string,        // e.g. "easy", "hard" — defaults to "appropriate for my level"
}): Promise<void>
```

Asks the tutor to generate a practice problem at the given difficulty.

### `tutor_answer`

```ts
invoke('tutor_answer', {
  topicId, topicTitle, topicDescription, objectives,
  problem: string,
  answer: string,
}): Promise<void>
```

Submits the student's answer to `problem` for grading.

### `tutor_explain`

```ts
invoke('tutor_explain', {
  topicId, topicTitle, topicDescription, objectives,
}): Promise<void>
```

Asks the tutor to explain why the most recent answer was correct or incorrect.

### `tutor_viz`

```ts
invoke('tutor_viz', {
  topicId, topicTitle, topicDescription, objectives,
  concept: string,
}): Promise<void>
```

Asks the tutor for a visualization of `concept`.

---

## Tutor Tag Schema

The tutor parses streaming PTY output for four XML-like tags. Completed blocks are
emitted as Tauri events. All events include `topicId: string` alongside the
type-discriminated `kind` field.

### `<problem>` / `</problem>` → `stem://tutor/problem`

Plain-text problem statement (may include LaTeX: `$...$` inline, `$$...$$` block).

```ts
{
  kind: 'problem',
  content: string,   // trimmed problem text
  topicId: string,
}
```

### `<grade>` / `</grade>` → `stem://tutor/grade`

JSON inside the tag:

```json
{ "score": 85, "correct": true, "feedback": "Good work!" }
```

Event payload:

```ts
{
  kind: 'grade',
  score: number,      // integer 0–100
  correct: boolean,
  feedback: string,   // 1–3 sentences
  topicId: string,
}
```

### `<mastery>` / `</mastery>` → `stem://tutor/mastery`

JSON inside the tag:

```json
{ "level": 0.65, "confidence": 0.8, "notes": "Student understands factoring." }
```

Event payload:

```ts
{
  kind: 'mastery',
  level: number,      // clamped 0.0–1.0
  confidence: number, // clamped 0.0–1.0
  notes: string,
  topicId: string,
}
```

### `<viz>` / `</viz>` → `stem://tutor/viz`

JSON inside the tag. The `type` field selects the renderer:

| `type` | Required fields | Optional fields |
|---|---|---|
| `"2d-plot"` | `fn` (expression string) | `xRange`, `yRange`, `label` |
| `"3d-surface"` | `fn` (f(x,y) expression) | `xRange`, `yRange`, `label` |
| `"3d-vector"` | `vectors` (`{x,y,z,label}[]`) | `origin` |
| `"matrix"` | `rows` (number[][]) | `label` |
| `"graph"` | `nodes` (`{id,label}[]`), `edges` (`{from,to,weight?}[]`) | — |

Event payload:

```ts
{
  kind: 'viz',
  vizType: string,          // one of the five types above
  config: Record<string, unknown>,  // remaining fields from the JSON blob
  topicId: string,
}
```

**Parser behaviour:**
- ANSI escape codes are stripped before tag scanning; raw bytes are still forwarded
  unchanged on `pty-data` for xterm.js.
- Blocks that open but do not close within 5 seconds emit a `stem://tutor/parse-error`
  event and are discarded.
- Unknown `viz` types are rejected with `stem://tutor/parse-error`.

---

## Data Layer — Topics (4 commands)

### Types

```ts
interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string;           // e.g. "math", "physics", "engineering"
  category: string | null;   // e.g. "calculus", "mechanics"
  level: number;             // 0-based depth in the prerequisite DAG
  estimatedMinutes: number | null;
  objectives: string | null; // JSON-encoded string[]
  vizRefs: string | null;    // JSON-encoded string[] of viz component keys
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}

interface NewTopic {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  subject: string;
  category?: string | null;
  level: number;
  estimatedMinutes?: number | null;
  objectives?: string | null;
  vizRefs?: string | null;
}
```

### `db_topics_list`

```ts
invoke('db_topics_list', { subject?: string }): Promise<Topic[]>
```

Lists topics for `subject`. Returns `[]` when `subject` is omitted.

### `db_topics_get`

```ts
invoke('db_topics_get', { id: string }): Promise<Topic>
```

Throws if `id` is not found.

### `db_topics_upsert`

```ts
invoke('db_topics_upsert', { topic: NewTopic }): Promise<void>
```

Insert-or-ignore (idempotent; duplicate `id` is silently skipped).

### `db_topics_delete`

```ts
invoke('db_topics_delete', { id: string }): Promise<void>
```

Deletes the topic and all cascading rows (problem_templates, mastery, etc.).

---

## Data Layer — Mastery (2 commands)

### Types

```ts
interface Mastery {
  id: number;
  topicId: string;
  level: number;                    // 0.0–1.0
  confidence: number;               // 0.0–1.0
  lastAssessedAt: string | null;    // ISO 8601
  updatedAt: string;                // ISO 8601
}

interface NewMastery {
  topicId: string;
  level: number;
  confidence: number;
  lastAssessedAt?: string | null;
}
```

### `db_mastery_get`

```ts
invoke('db_mastery_get', { topicId: string }): Promise<Mastery | null>
```

Returns `null` if no mastery record exists yet for this topic.

### `db_mastery_upsert`

```ts
invoke('db_mastery_upsert', { mastery: NewMastery }): Promise<void>
```

Insert-or-replace by `topicId`.

---

## Data Layer — Practice Attempts (2 commands)

### Types

```ts
interface PracticeAttempt {
  id: number;
  topicId: string;
  problemTemplateId: string | null;
  score: number | null;             // 0.0–100.0
  durationSeconds: number | null;
  attemptedAt: string;              // ISO 8601
  notes: string | null;
}

interface NewPracticeAttempt {
  topicId: string;
  problemTemplateId?: string | null;
  score?: number | null;
  durationSeconds?: number | null;
  notes?: string | null;
}
```

### `db_practice_insert`

```ts
invoke('db_practice_insert', { attempt: NewPracticeAttempt }): Promise<number>
```

Returns the new row's integer `id`.

### `db_practice_list`

```ts
invoke('db_practice_list', { topicId: string }): Promise<PracticeAttempt[]>
```

Returns all attempts for `topicId`, newest first.

---

## Data Layer — Review Schedule (3 commands)

SM-2 spaced-repetition schedule per topic.

### Types

```ts
interface ReviewSchedule {
  id: number;
  topicId: string;
  dueAt: string;            // ISO 8601
  intervalDays: number;     // SM-2 interval
  easeFactor: number;       // SM-2 ease factor (default 2.5)
  reviewCount: number;
  lastReviewedAt: string | null;
}

interface NewReviewSchedule {
  topicId: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
}
```

### `db_review_get`

```ts
invoke('db_review_get', { topicId: string }): Promise<ReviewSchedule | null>
```

Returns `null` if no schedule exists for this topic.

### `db_review_list_due`

```ts
invoke('db_review_list_due', { beforeIso: string }): Promise<ReviewSchedule[]>
```

Returns all topics due for review before `beforeIso` (ISO 8601 datetime), ordered by
`dueAt` ascending.

### `db_review_upsert`

```ts
invoke('db_review_upsert', { schedule: NewReviewSchedule }): Promise<void>
```

Insert-or-replace by `topicId`.

---

## Data Layer — Notes (5 commands)

Full-text search backed by SQLite FTS5.

### Types

```ts
interface Note {
  id: number;
  topicId: string | null;   // null = global note (not tied to a topic)
  title: string;
  body: string;
  tags: string | null;      // JSON-encoded string[]
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

interface NewNote {
  topicId?: string | null;
  title: string;
  body: string;
  tags?: string | null;
}
```

### `db_notes_list`

```ts
invoke('db_notes_list', { topicId?: string }): Promise<Note[]>
```

When `topicId` is provided: returns notes for that topic. When omitted: returns all
notes (via empty-string FTS search).

### `db_notes_insert`

```ts
invoke('db_notes_insert', { note: NewNote }): Promise<number>
```

Returns the new row's integer `id`.

### `db_notes_update`

```ts
invoke('db_notes_update', { id: number, note: NewNote }): Promise<void>
```

Replaces fields for the note at `id`.

### `db_notes_delete`

```ts
invoke('db_notes_delete', { id: number }): Promise<void>
```

### `db_notes_search`

```ts
invoke('db_notes_search', { query: string }): Promise<Note[]>
```

FTS5 full-text search across `title` and `body`. Returns ranked results.

---

## Data Layer — Settings (2 commands)

Key/value store for user preferences. Keys are plain strings; values are always strings
(serialize complex values as JSON before storing).

### `db_settings_get`

```ts
invoke('db_settings_get', { key: string }): Promise<string | null>
```

Returns `null` if `key` has never been set.

### `db_settings_set`

```ts
invoke('db_settings_set', { key: string, value: string }): Promise<void>
```

---

## Data Layer — Problem Templates (2 commands)

Seeded problem stubs used by the Practice mode to initialise new problem cards.

### Types

```ts
interface ProblemTemplate {
  id: string;
  topicId: string;
  difficulty: number;     // 1 = easy, 2 = medium, 3 = hard
  promptTemplate: string; // problem text sent to the tutor
  createdAt: string;      // ISO 8601
}
```

### `db_problem_templates_list`

```ts
invoke('db_problem_templates_list', { topicId: string }): Promise<ProblemTemplate[]>
```

Returns all templates for `topicId`, ordered by `(difficulty, id)`.

### `db_problem_templates_get`

```ts
invoke('db_problem_templates_get', { id: string }): Promise<ProblemTemplate>
```

Throws if `id` is not found.

---

## Utilities (1 command)

### `claude_probe`

```ts
invoke('claude_probe'): Promise<{
  found: boolean;
  path: string | null;
  version: string | null;
}>
```

Detects whether the `claude` CLI is available on PATH. Returns `found: false` with
nulls if not installed. Used by the Settings screen to display installation status.
`version` is the trimmed stdout of `claude --version`.

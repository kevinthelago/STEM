# STEM

![License](https://img.shields.io/github/license/kevinthelago/STEM) ![Last commit](https://img.shields.io/github/last-commit/kevinthelago/STEM)

# Goal

## Overview

# Goal

## Tech stack

# Stack

Mirrors base-studio-code's toolchain (same Tauri 2 + React 19 + Rust foundation), adding a
math-rendering and visualization layer the learning product needs.

## Desktop shell

| Layer | Choice | Version | Notes |
|---|---|---|---|
| App framework | **Tauri** | 2 | Rust backend + system webview; small footprint, native PTY access. Matches base-studio-code. |
| Backend language | **Rust** | edition 2021 | `src-tauri/` commands + a `crates/data` workspace crate. |
| Async runtime | **tokio** | 1 | PTY I/O pumping, async commands. |
| PTY | **portable-pty** | 0.8 | Spawns shell + `claude` CLI in a pseudo-terminal; process-group (Unix) / Job Object (Windows) cleanup so the whole tree dies with the session. |

## Frontend

| Layer | Choice | Version | Notes |
|---|---|---|---|
| UI library | **React** | 19 | |
| Language | **TypeScript** | 6 | |
| Bundler/dev | **Vite** | 8 | |
| Terminal | **xterm.js** (`@xterm/xterm` + fit/webgl addons) | 6 | Renders the raw claude session surface. |
| State | **zustand** | 5 | |
| Icons | **lucide-react** | — | Matches base-studio-code. |
| Markdown | **react-markdown** | 10 | Renders tutor prose; paired with math plugins below. |

## Learning-specific layer (new vs base-studio-code)

| Need | Choice | Notes |
|---|---|---|
| Math rendering | **KaTeX** via `remark-math` + `rehype-katex` | Renders LaTeX the tutor emits inside react-markdown. Fast, no network. |
| 3D visualization | **Three.js** via **@react-three/fiber** (+ **drei**) | 3D vectors, matrix transforms, surfaces, physics scenes. |
| 2D plotting | **D3** (+ optional **Plotly**) | Function plots, distributions, gradient-descent paths. |
| Numeric helpers | small TS utilities (e.g. **mathjs** where needed) | Client-side computation for visualizations; not a CAS. |

## Datastore

- **Primary: SQLite via `rusqlite` 0.40 (`bundled`)** — small, relational, zero-config;
  holds curriculum, topics, mastery, practice history, spaced-repetition schedule, notes.
- **Optional: DuckDB** behind a Cargo feature (as base-studio-code does) — only if heavy
  analytical queries over practice history are ever wanted. Default off.

## Tooling / quality

- **vitest** 4 (frontend tests), **eslint** + **prettier** (matches base-studio-code).
- **Rust:** `cargo test`, `cargo clippy`, `cargo fmt`.
- Edition/toolchain pinned to match base-studio-code to reuse its CI patterns.

## Auth / network

- **No app-managed secrets.** The `claude` CLI owns Claude authentication (the user's
  existing Claude Code login). The only network dependency is whatever the CLI itself
  needs; all learner data stays local.

## Getting started

```bash
git clone https://github.com/kevinthelago/STEM.git
cd STEM
# install dependencies and run the project's build/test/dev commands
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

See [LICENSE](LICENSE).

---

_Scaffolded by base-studio-code._
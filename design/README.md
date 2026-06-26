# Design reference — Learning Platform Design System

This is the **approved Claude Design export** for STEM's UI. Build the frontend to match it.

- `Learning Platform Design System/STEM.dc.html` — the design. Open it in a browser
  (it loads `support.js` from the same folder) to view all screens, components, and states.
- `Learning Platform Design System/support.js` — the Claude Design runtime the HTML needs.
- `Learning Platform Design System/.thumbnail` — preview image.

Tokens to lift from it: surfaces `#08090c` / `#0e0f13`, accent `#9A7CFF`, the mastery/grading
colors, IBM Plex Sans + JetBrains Mono, KaTeX. Centralize these in `src/theme`.

This file is committed to the repo so every worktree gets it on rebase onto `develop`.

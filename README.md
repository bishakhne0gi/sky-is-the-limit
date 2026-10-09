# Sky is the limit

A shared ritual: fold what you carry into a paper plane and breathe it upward. There is no top — only higher.

## Develop
    pnpm install
    pnpm dev            # http://localhost:3000
    pnpm test           # core + web unit tests
    pnpm typecheck
    pnpm build

Dev-only URL params on `/fly`: `?alt=2.45` starts at that lifetime altitude (loop 2, Above the Clouds). In development, `window.__sitl` exposes `{ live, app }` for inspecting per-frame state.

## Structure
- `packages/core` — pure, tested logic: bands, breath/steadiness, lift.
- `apps/web` — Next.js app. `/fly` lazy-loads the React Three Fiber world in `src/world`.
- `legacy/v1.html` — the original single-file piece.
- Design: `docs/superpowers/specs/2026-10-09-sky-is-the-limit-design.md`

## Deploy (web)
Import the repo in Vercel and set **Root Directory** to `apps/web`. Vercel detects pnpm workspaces and Next.js automatically. Multiplayer (Plan 2) will add `NEXT_PUBLIC_SKY_URL`.

## Privacy
Your words never leave your device and are never stored. Progress (altitude, folds, settings) lives in this browser's localStorage.

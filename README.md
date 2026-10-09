# Sky is the limit

Write what you carry on a sheet of paper, watch it fold into a plane, send it up through the rain and the clouds — then fly, endlessly.

## Develop
    pnpm install
    pnpm dev            # http://localhost:3000
    pnpm test
    pnpm typecheck
    pnpm build

In development, `window.__sitl` exposes `{ live, app }` for inspecting per-frame state.

## Structure
- `apps/web` — Next.js app. `/` is the landing page; `/fly` lazy-loads the React Three Fiber world in `src/world`.
- `legacy/v1.html` — the original single-file piece the flight is based on.
- Design: `docs/superpowers/specs/2026-10-09-sky-is-the-limit-design.md`

## Deploy
Import the repo in Vercel and set **Root Directory** to `apps/web`. No environment variables are needed.

## Music
Three calm, beat-free ambient tracks by **The Cynic Project** (cynicmusic.com / pixelsphere.org), all **CC0 1.0** from OpenGameArt. They play as an endless crossfading playlist, muffled on the rainy rooftop and opening fully above the clouds. Details in `apps/web/public/music/CREDITS.txt`.

## Privacy
Your words never leave your device and are never stored. Only your settings (time of day, sound, calm motion) are saved in this browser.

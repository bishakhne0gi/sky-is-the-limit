# Sky Is The Limit — v2 Design

**Date:** 2026-10-09
**Status:** Approved in conversation, pending written-spec review
**Supersedes:** `index.html` (v1, single-file Three.js piece), kept as `legacy/v1.html`

## 1. Intent

A **shared ritual**, not a game or a showcase. A person opens a link, folds a private intention into a paper plane, and flies it upward alongside strangers. The experience should calm someone within seconds, make the presence of others felt without any social pressure, and invite them back.

**Core idea:** *There is no summit — only higher.* The pursuit is endless, and that is the point. You cannot rush your way up; steadiness and each other lift you.

**Success looks like**
- A first-time visitor understands what to do without reading instructions, within ~30 seconds.
- People feel calmer after a session (soft signal: average session length > 5 minutes; return visits).
- Even the first visitor of the day never sees an empty sky.
- It runs on free/hobby tiers at launch scale (a few hundred concurrent people).

**Explicit non-goals (YAGNI)**
- No accounts, no sign-in, no cross-device sync.
- No chat, names, profiles, leaderboards, or visible scores.
- No user text is ever shared, transmitted, or stored on a server.
- No monetization.

## 2. Experience

### 2.1 Psychological grounding (felt, never explained on screen)
- **Resonance-paced breathing:** ~6 breaths/minute calms the nervous system. The control scheme rewards this rhythm.
- **Co-regulation:** people settle in each other's presence. Nearby flyers lift you.
- **Naming an intention:** writing what you carry makes it real. The words stay yours.
- **No punishment:** altitude never decreases. Rushing only pauses progress.

### 2.2 The ritual (opening ~30 s)
1. Scene: a quiet rooftop at dusk, light rain, a glowing city below.
2. Prompt: *"What are you carrying up?"* — a short text field (max 80 characters, optional; an empty field is allowed).
3. Choose a **kind**, which sets the plane's glow color:

| Kind | Color |
|---|---|
| Hope | gold `#ffc65a` |
| Release | silver-blue `#a9c8ff` |
| Courage | ember `#ff7a3d` |
| Love | rose `#ff8fb1` |
| Peace | teal `#5fe0c8` |

4. The paper folds itself into a plane around the words (the words are visibly on the paper), and the player releases it. The words exist only in local memory and are never persisted or transmitted. They live in an in-memory variable for the session.

### 2.3 Altitude bands (one loop)
One **loop** = 5 bands. Altitude within a loop is normalized 0–1. A full loop takes ~9 minutes of steady solo breathing (~6 minutes in company).

| # | Band | Loop range | Look | Story line (shown once per band) |
|---|---|---|---|---|
| 0 | The Ground | 0.00–0.12 | Dusk, rain, city lights below, rooftops | *"Everything heavy starts here."* |
| 1 | The Fog | 0.12–0.32 | Inside the clouds, low visibility, others visible only as glows | *"You can't see far. You don't need to."* |
| 2 | Above the Clouds | 0.32–0.58 | v1's golden cloud sea, birds, the words *Sky · is the · limit* | *"Look how far you've come."* |
| 3 | The Quiet | 0.58–0.82 | Thin deep-blue air, cirrus, slow cloud-whales, sound thins | *"Nothing to prove up here."* |
| 4 | The Stars | 0.82–1.00 | Night, aurora, lanterns, echo constellations | *"There was never a top."* |

**New Dawn:** at the top of The Stars, the scene passes through a sunrise flash into a new loop, starting at the Ground band again with `loop += 1`. Each new dawn unlocks the next fold and adds one persistent world element:

| Loop reached | Fold unlocked | World element added |
|---|---|---|
| 0 (start) | Dart | — |
| 1 | Glider | Birds that join you in band 2 |
| 2 | Crane | Lanterns appear from band 1 upward |
| 3 | Lantern-wing | Shooting stars are more frequent |
| 4+ | Star-kite | Faint aurora in every band |

The player can fly any fold they have unlocked, chosen at the ritual step.

**Story-line rules:** at most one line per band, shown 4 s after entering it, fading in over 1.5 s, held for 5 s, fading out over 2 s. Lines repeat each loop.

**When the ritual happens:** at the start of every session and at every new dawn. On a returning session, the ritual still takes place on the rooftop; after release, the plane makes a ~4 s rising transition to the saved altitude and flight continues from there.

### 2.4 Small moments
- **Breath sync:** two nearby flyers inhaling within 0.5 s of each other for 2 consecutive breaths → a shooting star arcs between them and both receive a short boost (§3.3).
- **Birds** join your plane in formation when you fly near a flock (band 2, loop ≥ 1).
- **Cloud parting** around your plane, carried over from v1.

### 2.5 Sound
- A **generative ambient pad** (Web Audio: detuned oscillators + filtered noise) whose chord, filter, and density change per band. The Quiet is the sparsest.
- A **breath layer:** a soft filtered-noise swell on inhale and release on exhale.
- Muted until the first user gesture (browser policy). A mute toggle is always visible.

## 3. Flight mechanic

### 3.1 Input
- **Hold** (pointer down, touch, or Space) = inhale. **Release** = exhale.
- **Steering:** desktop — the plane eases toward the cursor. Touch — while held, the plane eases toward the finger; while released, it keeps its current heading.
- **Auto-breathe** setting: the plane follows the guide ring automatically (accessibility).
- **Reduced motion** setting (defaults from `prefers-reduced-motion`): calmer camera, fewer particles, no roll.

### 3.2 Steadiness (0–1)
Computed from the last three completed breaths (an inhale plus the following exhale):
- **In range:** inhale 3–6 s and exhale 4–8 s → full credit; partial credit falls off linearly to zero at 1.5 s / 10 s.
- **Consistency:** the coefficient of variation of the last three breath periods; lower is better.
- `steadiness = 0.6 · rangeScore + 0.4 · consistencyScore`, eased toward its target over ~2 s.
- **Rushing:** any inhale or exhale shorter than 1.5 s sets a `flutter` state for 3 s (visual flutter, climb paused).
- Until three breaths exist, steadiness rises slowly from 0.3 so new players still move.

### 3.3 Lift
- `climbRate = baseRate · steadiness · (1 + updraft) · (1 + syncBoost)`, and is 0 while fluttering.
- `baseRate` is tuned so that steadiness 0.85 solo completes a loop in ~9 minutes.
- **Updraft:** +0.15 per real flyer within the proximity radius and +0.075 per echo, capped at +0.60.
- **Sync boost:** +0.5 for 6 s after a breath-sync event.
- Inhale adds a small visual rise. Altitude is monotonic: it never decreases.

### 3.4 Guidance
- On loop 0, a soft ring around the plane breathes at the ideal pace (4 s in, 6 s out).
- It fades out after 3 consecutive steady breaths (steadiness > 0.7), and returns if steadiness stays below 0.3 for 20 s.
- No numbers or scores are shown during flight. Feedback comes from glow brightness, sound, and smoothness of motion.

## 4. Multiplayer

### 4.1 Architecture
Cloudflare Workers with **PartyServer** (Durable Objects). There are three server classes:

- **Lobby** (single instance): assigns skies. Tracks occupancy per sky and the successor link of each sky.
- **Sky** (one per room): up to **30** real flyers, all in the **same band**. It relays state, detects breath sync, fills itself with echoes, and reports altitude gained.
- **Global** (single instance): the shared total of altitude flown and the count of current flyers.

### 4.2 Matchmaking and linked skies
- Sky IDs: `b{band}-{uuid}`.
- On entering a band, the client asks the Lobby `join(band, prevSkyId?)`.
  - If `prevSkyId` is given and that sky has a successor with space, return the successor. Otherwise create a successor for `prevSkyId`, link it, and return it. This keeps companions together as they climb.
  - With no `prevSkyId` (fresh start or new dawn): return the fullest non-full sky for the band, or create one.
- The client hops: it opens the new socket and closes the old one once the new sky's first snapshot arrives. Other planes cross-fade.
- **Lobby bookkeeping:** Sky instances report occupancy to the Lobby on join and leave. Skies empty for more than 10 minutes are forgotten.

### 4.3 Spatial model
- Everyone flies the same forward lane.
- `x ∈ [-1, 1]` is lateral position. Vertical offset is the difference in within-band altitude, scaled to world units.
- Each player gets a small deterministic forward (z) offset from a hash of their ID, so planes don't stack.
- **Proximity** (for updraft and sync) is measured in normalized (x, altitude) space with a radius of 0.25.

### 4.4 Protocol
JSON arrays, kept compact:

- **Client → Sky,** 4 Hz: `[x, bandAlt, heading, inhaling(0|1), steadiness, kind, fold, loop]`
- **Sky → client,** 5 Hz snapshot: `{ t, p: [[id, x, bandAlt, heading, inhaling, steadiness, kind, fold, loop, echo(0|1)], ...] }`
- **Sky → pair,** events: `{ e: "sync", a: idA, b: idB }`
- **Client → Sky,** on leaving a band: `echo` with a path of samples at 1 Hz `[x, bandAlt]` (≤ 180 samples), plus kind, fold, and loop.

**Validation:**
- Messages over 2 KB are dropped. More than 10 messages/s from one connection gets that connection closed.
- `bandAlt` may not increase faster than 2× the maximum possible climb rate. Excess is clamped.
- Unknown fields are ignored.

**Clients:**
- Interpolate remote planes with a 200 ms buffer.
- Compute their own lift locally, using the latest snapshot for updraft.

### 4.5 Echoes
- Each Sky stores up to **50** echo paths per band in Durable Object storage (oldest evicted).
- When a sky has fewer than 5 real flyers, it plays echoes (up to 6 total presences), flagged `echo = 1`. They render translucent.
- Echoes in band 4 also draw as faint constellation lines.
- **Seed echoes:** ~20 hand-generated paths ship with the web app. They are used offline, and before the server has stored any echoes.

### 4.6 Shared total
- Each Sky sends altitude gained to Global every 10 s.
- Global exposes `GET /stats → { feet, flying }`.
- The web landing page fetches it server-side with 30 s revalidation.
- Display: *"Humanity has flown 4,213,880 ft together · 37 flying now."* Altitude converts at 1 loop = 30,000 ft.

### 4.7 Privacy and failure handling
- **Identity:** a random UUID in `localStorage`, used only for reconnection and the z-offset. No IP addresses, words, or accounts are stored.
- **Connection failure:** solo mode with seed echoes. Reconnect with exponential backoff (1 s → 30 s). No error UI beyond a subtle "flying solo" note.
- **Full sky:** the Lobby routes the player elsewhere.

## 5. Persistence (device only)
`localStorage` key `sitl.profile.v1`:
```json
{ "id": "uuid", "lifetimeAlt": 0, "loop": 0, "unlockedFolds": ["dart"], "settings": { "autoBreathe": false, "reducedMotion": null, "muted": false } }
```
- Altitude resumes from the saved position after the ritual (see §2.3, *When the ritual happens*).
- Malformed or missing data resets to defaults.
- All `localStorage` access is wrapped in try/catch, and the app works without storage.

## 6. Technical structure

```
apps/web/        Next.js (App Router, TypeScript)  → Vercel
  app/page.tsx              landing + live total
  app/fly/page.tsx          client-only experience (dynamic import, ssr: false)
  src/world/                R3F components: Sky, CloudSea, Ground (rain/city), Whales,
                            Lanterns, Words, Constellations, Planes, Effects
  src/world/shaders/        GLSL ported from v1
  src/flight/               input → breath tracker → steadiness/lift (uses core)
  src/net/                  SkyClient: lobby join, hop, interpolation, echo fallback
  src/story/                story lines + triggers as data
  src/audio/                generative pad + breath layer
  src/profile/              versioned localStorage profile
  src/ui/                   Ritual, StoryLine, Settings, HUD (CSS modules, v1 glass style)
apps/sky/        Cloudflare Worker + PartyServer (Lobby, Sky, Global) → wrangler
packages/core/   pure TS: constants, bands, steadiness, lift, sync detection, protocol codec
legacy/v1.html   v1 reference
```

**Rendering rules**
- Per-frame work runs in `useFrame` on refs. Flight state lives in a zustand store and is read with `getState()` inside frames, so React does not re-render on every frame.
- A single `loopAlt` value drives palette blending between band presets, the same way v1 blends time-of-day presets.
- Post-processing: bloom plus tone mapping.
- Adaptive pixel ratio as in v1. Mobile uses ~50% of the clouds.
- Performance targets: 60 fps on a recent laptop, 30 fps on a recent phone.

**Configuration:** web uses `NEXT_PUBLIC_SKY_URL`. Sky has none beyond the Durable Object bindings in `wrangler.toml`.

**Commands:** `pnpm dev` (Next + `wrangler dev` together), `pnpm test`, `pnpm e2e`, `pnpm deploy:sky`. The web app deploys through Vercel's Git integration.

## 7. Testing
- **core (Vitest):**
  - steadiness (in-range, rushing/flutter, consistency)
  - lift (updraft cap at 0.60, echo half-weight, sync boost decay, never negative)
  - band and loop mapping, including the new-dawn rollover
  - sync detection (0.5 s window, 2 consecutive breaths)
  - protocol encode/decode and validation
- **sky (Vitest + `@cloudflare/vitest-pool-workers`):**
  - join and the 30-flyer cap
  - successor-sky linking keeps two players together across a band change
  - echoes fill skies with fewer than 5 flyers and are capped at 6
  - echo storage capped at 50
  - climb-rate clamp
  - rate limit and oversize drop
  - Global accumulation
- **web e2e (Playwright):**
  - the landing page renders the total
  - the ritual completes and `/fly` renders a canvas with no console errors
  - two browser contexts against local `wrangler dev` each see the other's plane
  - offline (sky unreachable) falls back to solo with seed echoes
- **Manual:** visual pass of all five bands and a new dawn, plus a frame-rate check on desktop and phone.

## 8. Build order (for the implementation plan)
1. Workspace scaffold, `core` package with tests.
2. Web: port v1 visuals to R3F inside `/fly` (single-player, time-of-day replaced by band blending).
3. Flight mechanic (breath, steadiness, lift, guidance) and profile persistence.
4. Ritual, story lines, the Ground/Fog/Quiet/Stars band elements, new dawn and folds.
5. Audio.
6. Sky server (Lobby, Sky, Global) with tests. SkyClient, echoes, sync events.
7. Landing page with the live total. End-to-end tests. Deploy scripts and README.

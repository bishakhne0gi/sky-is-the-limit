# Sky Is The Limit — v2 Design

**Date:** 2026-10-09 (revised the same day)
**Status:** Approved in conversation
**Builds on:** `legacy/v1.html`, the original single-file piece

## 1. Intent

A soothing, endless flight that begins with a small ritual. You write a note — something you carry, hope for, or want to let go of — watch the paper fold itself into a plane around your words, and send it up into the sky. Then you simply fly: the original v1 experience, calm and infinite.

**Revision note:** an earlier draft of this spec added a breathing mechanic, altitude bands, story lines, echo companions and multiplayer. Those were dropped at the user's request because the original v1 felt more soothing. The ritual (write → fold → send) is what carries forward.

**Non-goals:** multiplayer, accounts, progression, unlocks, scores, story text. Words are never stored or sent anywhere.

## 2. Experience

### 2.1 The ritual (rooftop at dusk)
- **Scene:** a dark, rain-wet rooftop under a storm-cloud ceiling, warm city lights far below, light rain.
- **Prompt:** *"What are you carrying up?"* above a sheet of paper. The textarea allows up to 80 characters, and leaving it empty is fine.
- **Glow:** choose what the note is, which sets the plane's color:

| Kind | Color |
|---|---|
| Hope | `#ffc65a` |
| Release | `#a9c8ff` |
| Courage | `#ff7a3d` |
| Love | `#ff8fb1` |
| Peace | `#5fe0c8` |

- **Fold:** choose one of five, all available from the start: Dart, Glider, Crane, Lantern-wing, Star-kite.
- **Let it go:** the paper folds itself (a CSS fold animation, 1.6 s). The ambient sound starts within this click.
- *"Your words stay on this device."* The words live only in memory for the session. They are never persisted, never put in app state, and never transmitted.

### 2.2 Sending it to the sky (launch, ~6 s)
- The 3D plane appears in the note's color, lifts off the rooftop, and the camera follows it upward through the rain and the cloud deck, then breaks out above the clouds.
- The look cross-fades from the dusk-rain rooftop to the selected time of day as the plane passes through the deck.
- The rain and city lights fade out as you rise.

### 2.3 Flight (the v1 experience)
- **Steering:** move to steer. The plane follows the cursor, the camera banks gently, and the clouds part around the cursor and plane.
- **Soaring:** hold (mouse, touch, or Space) to soar. Speed goes from 38 to 115, the field of view widens from 62° to 74°, the camera lifts slightly, and the clouds part more.
- **The world:**
  - an endless sea of clouds with cumulus towers
  - wingtip contrails
  - flocks of birds (not at night)
  - the words *Sky · is the · limit* appearing in the mist and dissolving into embers as you fly through them
  - rising lanterns at dusk and night
  - stars, aurora and shooting stars at night
  - high cirrus streaming overhead
- **Time of day:** pills for Dawn · Day · Dusk · Night · Endless. Endless cycles through the four every 10 s with slow cross-fades and is the default. The choice is saved.
- **Altimeter:** bottom-left, starting at 30,000 ft and climbing forever (`speed × 3.2` ft/s).
- **Write another:** a pill fades the view to night blue for about 0.6 s and returns to the rooftop for a new note.
- **Idle autopilot:** if the pointer hasn't moved for 4 s, the plane drifts on gentle curves so the loop stays alive.

### 2.4 Sound
- **Wind:** filtered noise whose level and pitch rise with speed (from v1).
- **Pad:** a soft generative chord per time of day (dusk-rain chord on the rooftop), cross-faded on changes.
- **Lifecycle:** starts in the *Let it go* gesture; mute toggle; suspends when leaving `/fly`; resumes when the page becomes visible again, or on the next pointer press.

### 2.5 Accessibility and robustness
- **Calm motion:** a toggle that defaults to the OS `prefers-reduced-motion` setting. It removes camera roll and bob.
- **Holding:**
  - Only the primary button or touch triggers it; a right-click never sticks it on.
  - Multi-touch holds while any finger is down.
  - It releases on pointercancel, blur, and when the tab is hidden.
- **Keyboard:** Space on a focused button activates the button rather than soaring. Space while typing in the note types a space.
- **Selection:** no text selection or long-press callout on the flight surface.
- **Frame time:** clamped to 0.1 s per step so a resumed tab never jumps. Adaptive pixel ratio steps down below ~40 fps and ignores stalls longer than 0.2 s. Coarse-pointer devices render half the clouds.

## 3. Persistence
`localStorage` key `sitl.profile.v2`:
```json
{ "id": "uuid", "settings": { "timeOfDay": "auto", "muted": false, "reducedMotion": null } }
```
- `timeOfDay` is one of `dawn | day | dusk | night | auto`.
- All access goes through try/catch. Blocked, full or corrupt storage falls back to defaults.

## 4. Technical structure
```
apps/web/  Next.js (App Router, TS) → Vercel
  app/page.tsx                 landing
  app/fly/page.tsx             client-only experience
  src/lib/                     constants (kinds, folds), env helpers, rng
  src/profile/                 profile load/save/validate
  src/state/store.ts           phase, kind, fold, settings
  src/flight/                  live frame state, hold input, flight loop (launch + cruise)
  src/world/                   palettes (time of day + rooftop), launch curve, sky, clouds, planes,
                               rooftop/city/rain, words, birds, lanterns, shooting stars, effects
  src/audio/                   wind + pad engine
  src/ui/                      Ritual, Hud (pills, altimeter, chips), Veil
legacy/v1.html
```
- **Rendering:** React Three Fiber, with per-frame state in a mutable `live` object.
- **Dependency pins:** Next.js 16.4, React 19.3, three 0.186, @react-three/fiber 9.8, @react-three/postprocessing 3.1, zustand 5, TypeScript 5.9, Vitest 5.

## 5. Testing
- **Unit tests (Vitest)** for the pure modules:
  - palettes: blending and the Endless schedule
  - the launch curve and the inside-the-deck factor
  - the cloud field
  - hold input (primary-only, multi-touch, cancel/blur)
  - profile parsing and the whitelist (never words)
  - store transitions
  - the frame budget
  - pad parameters
  - shooting-star timing
- **Browser pass:** ritual → send → flight → write another, plus each time of day.

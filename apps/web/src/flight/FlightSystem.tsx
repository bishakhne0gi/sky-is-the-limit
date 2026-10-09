'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BreathTracker, MAX_DT, advanceAltitude, climbRate, climbStep, countNear, syncBoostAt, updraft } from '@sitl/core';
import { persistNow } from '@/profile/persist';
import { useApp } from '@/state/store';
import { setLiveAltitude } from './altitude';
import { attachInput } from './attachInput';
import { BreathInput } from './breathInput';
import { GuideVisibility, guidePhase } from './guide';
import { live } from './live';

const LAUNCH_SECONDS = 4;
const ease = (x: number) => x * x * (3 - 2 * x);

export function FlightSystem() {
  const gl = useThree((s) => s.gl);
  const input = useMemo(() => new BreathInput(), []);
  const tracker = useRef<BreathTracker | null>(null);
  const guide = useRef<GuideVisibility | null>(null);
  const launch = useRef<{ from: number; to: number; start: number } | null>(null);
  const saveTimer = useRef(0);

  useEffect(() => attachInput(gl.domElement, input), [gl, input]);
  useEffect(() => {
    const save = () => persistNow();
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, []);

  useFrame((state, rawDt) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    live.time = t;
    const app = useApp.getState();

    if (app.phase === 'loading' || app.phase === 'ritual') {
      live.inhaling = false;
      live.flutter = false;
      launch.current = null;
      if (live.lifetimeAlt !== Math.floor(app.savedAlt)) setLiveAltitude(Math.floor(app.savedAlt));
      return;
    }

    if (app.phase === 'launching') {
      const L = (launch.current ??= { from: Math.floor(app.savedAlt), to: app.savedAlt, start: t });
      const k = Math.min(1, (t - L.start) / LAUNCH_SECONDS);
      setLiveAltitude(L.from + (L.to - L.from) * ease(k));
      if (k >= 1) {
        launch.current = null;
        tracker.current = new BreathTracker(t);
        guide.current = new GuideVisibility(live.loop);
        app.setFlying();
      }
      return;
    }

    // Flying.
    const tr = (tracker.current ??= new BreathTracker(t));
    const gv = (guide.current ??= new GuideVisibility(live.loop));
    const wantInhale = app.settings.autoBreathe ? guidePhase(t).inhaling : input.held;
    if (wantInhale) tr.press(t);
    else tr.release(t);
    const snap = tr.update(t);
    live.inhaling = snap.inhaling;
    live.steadiness = snap.steadiness;
    live.flutter = snap.flutter;
    live.inhaleStartedAt = snap.inhaleStartedAt;
    live.guideVisible = gv.update(t, snap.steadiness);

    live.near = countNear({ x: live.pointer.x, alt: live.bandProgress }, live.others);
    const rate = climbRate({
      steadiness: snap.steadiness,
      updraft: updraft(live.near.real, live.near.echo),
      syncBoost: syncBoostAt(t, live.lastSyncAt),
      flutter: snap.flutter,
    });
    const next = advanceAltitude(live.lifetimeAlt, climbStep(rate, dt));
    setLiveAltitude(next.lifetimeAlt);

    if (next.loopsCrossed > 0) {
      app.newDawn(next.lifetimeAlt);
      tracker.current = null;
      guide.current = null;
      persistNow();
      return;
    }
    if ((saveTimer.current += dt) > 5) {
      saveTimer.current = 0;
      app.setSavedAlt(live.lifetimeAlt);
      persistNow();
    }
  }, -2);

  return null;
}

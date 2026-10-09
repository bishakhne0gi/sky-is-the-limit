'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MAX_DT } from '@/lib/constants';
import { useApp } from '@/state/store';
import { LAUNCH_SECONDS, launchBlend } from '@/world/launch';
import { attachInput } from './attachInput';
import { HoldInput } from './holdInput';
import { live } from './live';

const IDLE_SECONDS = 4;

/** Phase timing (ritual → launch → flight), hold-to-soar, idle autopilot and the altimeter. */
export function FlightSystem() {
  const gl = useThree((s) => s.gl);
  const input = useMemo(() => new HoldInput(), []);
  const launchStart = useRef<number | null>(null);

  useEffect(() => attachInput(gl.domElement, input), [gl, input]);

  useFrame((state, rawDt) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    live.time = t;
    const phase = useApp.getState().phase;

    if (phase === 'loading' || phase === 'ritual') {
      launchStart.current = null;
      live.launchK = 0;
      live.skyWeight = 0;
      live.holding = false;
      return;
    }

    if (phase === 'launching') {
      const start = (launchStart.current ??= t);
      live.launchK = Math.min(1, (t - start) / LAUNCH_SECONDS);
      live.skyWeight = launchBlend(live.launchK);
      live.holding = false;
      if (live.launchK >= 1) {
        live.altitude = 30000;
        useApp.getState().setFlying();
      }
      return;
    }

    // Flying.
    live.launchK = 1;
    live.skyWeight = 1;
    live.holding = input.held;
    if (t - live.lastMove > IDLE_SECONDS) {
      live.pointerRaw.set(Math.sin(t * 0.23) * 0.55 + Math.sin(t * 0.07) * 0.2, 0.1 + Math.sin(t * 0.31) * 0.45);
    }
    live.altitude += live.speed * dt * 3.2;
  }, -2);

  return null;
}

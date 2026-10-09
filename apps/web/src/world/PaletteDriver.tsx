'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MAX_DT } from '@/lib/constants';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { insideDeck } from './launch';
import { applyPalette } from './livePalette';
import { PRESETS, ROOFTOP, autoTimeOfDay, mixPalette, type Palette, type TimeOfDay } from './timeOfDay';

/** Eases the sky toward the chosen time of day, blends it with the rooftop look, and thickens fog inside the deck. */
export function PaletteDriver() {
  const current = useRef<Palette>(PRESETS.dawn);
  useFrame((state, rawDt) => {
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    const setting = useApp.getState().settings.timeOfDay;
    const time: TimeOfDay = setting === 'auto' ? autoTimeOfDay(state.clock.elapsedTime) : setting;
    const rate = setting === 'auto' ? 0.55 : 1.8;
    current.current = mixPalette(current.current, PRESETS[time], 1 - Math.exp(-rate * dt));
    const p = mixPalette(ROOFTOP, current.current, live.skyWeight);
    const inside = insideDeck(live.camera.y);
    applyPalette({ ...p, fogNear: p.fogNear + (15 - p.fogNear) * inside, fogFar: p.fogFar + (260 - p.fogFar) * inside });
    live.padKey = live.skyWeight < 0.5 ? 'rooftop' : time;
  }, -1);
  return null;
}

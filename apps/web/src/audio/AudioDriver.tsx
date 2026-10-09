'use client';
import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { getEngine } from './engine';

/** Feeds the engine each frame; suspends on leaving /fly; resumes after interruptions (tab return, next press). */
export function AudioDriver() {
  useEffect(() => {
    const engine = getEngine();
    engine.resume();
    const onVisible = () => { if (document.hidden) engine.suspend(); else engine.resume(); };
    const onPress = () => engine.resume();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pointerdown', onPress);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pointerdown', onPress);
      engine.suspend();
    };
  }, []);
  useFrame((state) => getEngine().update(live.skyWeight, live.speed, useApp.getState().settings.muted, state.clock.elapsedTime));
  return null;
}

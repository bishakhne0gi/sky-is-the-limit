'use client';
import { useFrame } from '@react-three/fiber';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { getEngine } from './engine';

export function AudioDriver() {
  useFrame(() => getEngine().update(live.loopAlt, live.inhaling, live.steadiness, useApp.getState().settings.muted));
  return null;
}

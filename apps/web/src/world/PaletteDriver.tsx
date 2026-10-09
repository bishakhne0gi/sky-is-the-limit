'use client';
import { useFrame } from '@react-three/fiber';
import { live } from '@/flight/live';
import { applyPalette } from './livePalette';
import { paletteAt } from './palette';

export function PaletteDriver() {
  useFrame(() => applyPalette(paletteAt(live.loopAlt), live.loop), -1);
  return null;
}

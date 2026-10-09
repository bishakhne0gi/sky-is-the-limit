'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { FrameBudget } from './frameBudget';

/** Steps the pixel ratio down (to a 0.75 floor) while the average frame time exceeds 1/40 s. */
export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const budget = useMemo(() => new FrameBudget(), []);
  const dpr = useRef(typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5));
  useFrame((_, dt) => {
    if (budget.sample(dt) && dpr.current > 0.75 && !document.hidden) {
      dpr.current = Math.max(0.75, dpr.current - 0.25);
      setDpr(dpr.current);
    }
  });
  return null;
}

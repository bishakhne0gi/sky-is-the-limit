'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

/** Steps the pixel ratio down (to a 0.75 floor) while the average frame time exceeds 1/40 s. */
export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, dpr: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5) });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt; a.n++;
    if (a.t < 2.5) return;
    const avg = a.t / a.n;
    a.t = 0; a.n = 0;
    if (avg > 1 / 40 && a.dpr > 0.75 && !document.hidden) {
      a.dpr = Math.max(0.75, a.dpr - 0.25);
      setDpr(a.dpr);
    }
  });
  return null;
}

'use client';
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { setLiveAltitude } from '@/flight/altitude';
import { FlightSystem } from '@/flight/FlightSystem';
import { safeLocalStorage } from '@/lib/env';
import { loadProfile } from '@/profile/profile';
import { useApp } from '@/state/store';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CameraRig } from './CameraRig';
import { CloudSea } from './clouds/CloudSea';
import { Effects } from './Effects';
import { Lights } from './Lights';
import { PaletteDriver } from './PaletteDriver';
import { BreathRing } from './planes/BreathRing';
import { PlayerPlane } from './planes/PlayerPlane';
import { Rooftop } from './ground/Rooftop';
import { SkyDome } from './sky/SkyDome';

/** Dev-only: /fly?alt=2.45 starts at that lifetime altitude. */
function devAltitude(): number | null {
  if (process.env.NODE_ENV === 'production') return null;
  const v = Number(new URLSearchParams(window.location.search).get('alt'));
  return Number.isFinite(v) && v >= 0 ? v : null;
}

export default function Experience() {
  useEffect(() => {
    const p = loadProfile(safeLocalStorage());
    const dev = devAltitude();
    if (dev !== null) { p.lifetimeAlt = dev; p.loop = Math.floor(dev); }
    useApp.getState().hydrate(p);
    setLiveAltitude(dev ?? Math.floor(p.lifetimeAlt));
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).has('skip')) {
      useApp.getState().release('hope', useApp.getState().fold);
    }
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        dpr={[0.75, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 62, near: 0.1, far: 3000 }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; }}
        style={{ touchAction: 'none' }}
      >
        <FlightSystem />
        <PaletteDriver />
        <CameraRig />
        <Lights />
        <SkyDome />
        <CloudSea />
        <Rooftop />
        <PlayerPlane />
        <BreathRing />
        <AdaptiveQuality />
        <Effects />
      </Canvas>
    </div>
  );
}

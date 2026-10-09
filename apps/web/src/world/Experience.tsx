'use client';
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { AudioDriver } from '@/audio/AudioDriver';
import { getEngine } from '@/audio/engine';
import { FlightSystem } from '@/flight/FlightSystem';
import { live } from '@/flight/live';
import { safeLocalStorage } from '@/lib/env';
import { loadProfile } from '@/profile/profile';
import { useApp } from '@/state/store';
import { Overlay } from '@/ui/Overlay';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CameraRig } from './CameraRig';
import { CloudSea } from './clouds/CloudSea';
import { Effects } from './Effects';
import { Birds } from './elements/Birds';
import { Lanterns } from './elements/Lanterns';
import { ShootingStars } from './elements/ShootingStars';
import { Words } from './elements/Words';
import { City } from './ground/City';
import { Rain } from './ground/Rain';
import { Rooftop } from './ground/Rooftop';
import { Lights } from './Lights';
import { PaletteDriver } from './PaletteDriver';
import { PlayerPlane } from './planes/PlayerPlane';
import { SkyDome } from './sky/SkyDome';

export default function Experience() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') Object.assign(window, { __sitl: { live, app: useApp } });
    useApp.getState().hydrate(loadProfile(safeLocalStorage()));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
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
        <City />
        <Rain />
        <Rooftop />
        <Words />
        <Birds />
        <Lanterns />
        <ShootingStars />
        <PlayerPlane />
        <AudioDriver />
        <AdaptiveQuality />
        <Effects />
      </Canvas>
      <Overlay onRelease={() => getEngine().start()} />
    </div>
  );
}

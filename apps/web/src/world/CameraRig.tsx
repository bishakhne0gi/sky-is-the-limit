'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MAX_DT } from '@/lib/constants';
import { live } from '@/flight/live';
import { prefersReducedMotion } from '@/lib/env';
import { useApp } from '@/state/store';
import { CRUISE_Y, ROOFTOP_Y, launchCameraY } from './launch';

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const st = useRef({ x: 0, y: ROOFTOP_Y, z: 0, roll: 0, fov: 62, speed: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    const t = state.clock.elapsedTime;
    const s = st.current;
    const app = useApp.getState();
    const reduced = app.settings.reducedMotion ?? prefersReducedMotion();
    const phase = app.phase;
    const k = (rate: number) => 1 - Math.exp(-rate * dt);

    live.pointer.lerp(live.pointerRaw, k(8));
    live.pointerSlow.lerp(live.pointerRaw, k(1.6));

    const targetSpeed = phase === 'ritual' || phase === 'loading' ? 0 : live.holding ? 115 : 38;
    s.speed += (targetSpeed - s.speed) * k(live.holding ? 1.4 : 0.9);
    live.speed = s.speed;
    s.z -= s.speed * dt;

    const px = s.x;
    const flying = phase === 'flying';
    s.x += (live.pointerSlow.x * (flying ? 34 : 6) - s.x) * k(1.2);
    if (phase === 'launching') {
      s.y = launchCameraY(live.launchK) + live.pointerSlow.y * 2;
    } else {
      const targetY = flying ? CRUISE_Y + live.pointerSlow.y * 9 + (live.holding ? 3 : 0) : ROOFTOP_Y + live.pointerSlow.y * 2;
      // Snap on large jumps (back to the rooftop, hidden by the veil); ease otherwise.
      s.y = Math.abs(targetY - s.y) > 40 ? targetY : s.y + (targetY - s.y) * k(1.4);
    }
    const vx = (s.x - px) / Math.max(dt, 1e-3);
    s.roll += ((reduced ? 0 : -vx * 0.012) - s.roll) * k(3);

    camera.position.set(s.x, s.y + (reduced ? 0 : Math.sin(t * 1.3) * 0.15), s.z);
    look.set(s.x + live.pointerSlow.x * 6, s.y + 1.5 + live.pointerSlow.y * 2, s.z - 60);
    camera.lookAt(look);
    camera.rotateZ(s.roll);
    s.fov += ((live.holding ? 74 : 62) - s.fov) * k(2);
    camera.fov = s.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    live.camera.x = s.x; live.camera.y = s.y; live.camera.z = s.z;
  }, -1);
  return null;
}

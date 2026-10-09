'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MAX_DT } from '@sitl/core';
import { live } from '@/flight/live';
import { prefersReducedMotion } from '@/lib/env';
import { useApp } from '@/state/store';
import { cameraBaseY } from './altitudeRig';

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const st = useRef({ x: 0, y: cameraBaseY(0), z: 0, roll: 0, fov: 62, speed: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    const t = state.clock.elapsedTime;
    const s = st.current;
    const app = useApp.getState();
    const reduced = app.settings.reducedMotion ?? prefersReducedMotion();
    const ritual = app.phase === 'ritual' || app.phase === 'loading';
    const k = (rate: number) => 1 - Math.exp(-rate * dt);

    live.pointer.lerp(live.pointerRaw, k(8));
    live.pointerSlow.lerp(live.pointerRaw, k(1.6));

    const targetSpeed = ritual ? 0 : live.inhaling ? 46 : 38;
    s.speed += (targetSpeed - s.speed) * k(1);
    s.z -= s.speed * dt;
    const px = s.x;
    s.x += (live.pointerSlow.x * (ritual ? 6 : 34) - s.x) * k(1.2);
    const targetY = cameraBaseY(live.loopAlt) + live.pointerSlow.y * (ritual ? 2 : 7) + (live.inhaling ? 2 : 0);
    // Snap on a new-dawn jump (hidden behind the dawn flash); ease otherwise.
    s.y = Math.abs(targetY - s.y) > 40 ? targetY : s.y + (targetY - s.y) * k(1.4);
    const vx = (s.x - px) / Math.max(dt, 1e-3);
    s.roll += ((reduced ? 0 : -vx * 0.012) - s.roll) * k(3);

    camera.position.set(s.x, s.y + (reduced ? 0 : Math.sin(t * 1.3) * 0.15), s.z);
    look.set(s.x + live.pointerSlow.x * 6, s.y + 1.5 + live.pointerSlow.y * 2, s.z - 60);
    camera.lookAt(look);
    camera.rotateZ(s.roll);
    s.fov += ((live.inhaling ? 66 : 62) - s.fov) * k(2);
    camera.fov = s.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    live.camera.x = s.x; live.camera.y = s.y; live.camera.z = s.z;
  }, -1);
  return null;
}

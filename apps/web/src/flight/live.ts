import * as THREE from 'three';
import type { BandIndex, Presence } from '@sitl/core';

/** Mutable per-frame state. Read and written inside useFrame only; never drives React renders. */
export const live = {
  time: 0,
  lifetimeAlt: 0,
  loop: 0,
  loopAlt: 0,
  band: 0 as BandIndex,
  bandProgress: 0,
  steadiness: 0.3,
  inhaling: false,
  flutter: false,
  inhaleStartedAt: null as number | null,
  guideVisible: false,
  /** Raw pointer in NDC, eased fast (pointer) and slow (pointerSlow) by CameraRig. */
  pointerRaw: new THREE.Vector2(0, 0.1),
  pointer: new THREE.Vector2(0, 0.1),
  pointerSlow: new THREE.Vector2(0, 0.1),
  camera: { x: 0, y: 0, z: 0 },
  plane: new THREE.Vector3(),
  near: { real: 0, echo: 0 },
  /** Other planes in normalized space. EchoPlanes writes echoes; Plan 2 adds real flyers. */
  others: [] as Presence[],
  lastSyncAt: null as number | null,
};

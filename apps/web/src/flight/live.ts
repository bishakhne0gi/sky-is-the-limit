import * as THREE from 'three';

/** Mutable per-frame state. Read and written inside useFrame only; never drives React renders. */
export const live = {
  time: 0,
  /** Seconds (live.time) of the last real pointer movement; drives the idle autopilot. */
  lastMove: -10,
  holding: false,
  speed: 0,
  /** Altimeter in feet; climbs forever while flying. */
  altitude: 30000,
  /** Launch progress 0..1 and how far the look has moved from rooftop (0) to sky (1). */
  launchK: 0,
  skyWeight: 0,
  /** Raw pointer in NDC, eased fast (pointer) and slow (pointerSlow) by CameraRig. */
  pointerRaw: new THREE.Vector2(0, 0.1),
  pointer: new THREE.Vector2(0, 0.1),
  pointerSlow: new THREE.Vector2(0, 0.1),
  camera: { x: 0, y: 0, z: 0 },
  plane: new THREE.Vector3(),
};

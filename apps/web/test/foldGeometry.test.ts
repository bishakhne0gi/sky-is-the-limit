import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FOLDS } from '@sitl/core';
import { foldGeometry } from '@/world/planes/foldGeometry';

describe('foldGeometry', () => {
  it.each(FOLDS)('%s is a finite triangle soup within a 5-unit span', (fold) => {
    const g = foldGeometry(fold);
    const pos = g.getAttribute('position');
    expect(pos.count % 3).toBe(0);
    expect(pos.count).toBeGreaterThanOrEqual(9);
    for (let i = 0; i < pos.array.length; i++) expect(Number.isFinite(pos.array[i])).toBe(true);
    g.computeBoundingBox();
    const size = g.boundingBox!.getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.y, size.z)).toBeLessThanOrEqual(5);
  });
  it('caches geometries', () => {
    expect(foldGeometry('crane')).toBe(foldGeometry('crane'));
  });
});

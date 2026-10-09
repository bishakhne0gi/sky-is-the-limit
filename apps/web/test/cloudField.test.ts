import { describe, expect, it } from 'vitest';
import { AHEAD, L, createSortWork, generatePuffs, wrapPuff, writeSortedPuffs } from '@/world/clouds/cloudField';
import { createRng } from '@/lib/rng';

describe('cloudField', () => {
  it('keeps a puff stationary in world space as the camera moves (between wraps)', () => {
    const p = { x: 10, y: 0, z: -100, s: 20, seed: 0.5 };
    const a = wrapPuff(p, 0, 0), b = wrapPuff(p, 0, -20);
    expect(b.z).toBeCloseTo(a.z, 6); // world z is p.z shifted by a constant; it must not move
    expect(b.x).toBeCloseTo(a.x, 6);
  });
  it('wraps a puff to the far distance once it is AHEAD units behind the camera', () => {
    const p = { x: 0, y: 0, z: -100, s: 20, seed: 0.5 };
    // At camZ = 0 the puff sits at world z = -70; it wraps when the camera passes z = -100.
    expect(wrapPuff(p, 0, -99).rel).toBeLessThan(AHEAD);
    const wrapped = wrapPuff(p, 0, -101);
    expect(wrapped.rel).toBeGreaterThan(L - 5);
    expect(wrapped.z).toBeLessThan(-101 - L + AHEAD + 5);
  });
  it('writes instances sorted far → near and fades puffs behind the camera', () => {
    const puffs = generatePuffs(0.2, createRng(1));
    const work = createSortWork(puffs.length);
    const pos = new Float32Array(puffs.length * 3), data = new Float32Array(puffs.length * 4);
    writeSortedPuffs(puffs, work, pos, data, 0, -333);
    for (let j = 1; j < puffs.length; j++) expect(pos[j * 3 + 2]!).toBeGreaterThanOrEqual(pos[(j - 1) * 3 + 2]! - 1e-3);
    for (let j = 0; j < puffs.length; j++) if (pos[j * 3 + 2]! > -333) expect(data[j * 4 + 2]).toBe(0);
  });
  it('scales count by density', () => {
    expect(generatePuffs(0.5, createRng(1)).length).toBeLessThan(generatePuffs(1, createRng(1)).length * 0.6);
  });
});

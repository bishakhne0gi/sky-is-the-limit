import { describe, expect, it } from 'vitest';
import { FOLD_SHAPES, LOOP, SEND, bezier, bezierAngle, foldShape, sceneAt } from '@/landing/paperPlane';

describe('foldShape', () => {
  it('is the flat sheet at 0 and the plane at 1', () => {
    expect(foldShape(0)).toEqual(FOLD_SHAPES[0]);
    expect(foldShape(1)).toEqual(FOLD_SHAPES[FOLD_SHAPES.length - 1]);
  });
  it('passes through every fold stage in order', () => {
    const stages = FOLD_SHAPES.length - 1;
    for (let i = 0; i <= stages; i++) expect(foldShape(i / stages)).toEqual(FOLD_SHAPES[i]);
  });
  it('keeps both halves as 4-point polygons and clamps input', () => {
    for (const k of [-1, 0.37, 0.5, 2, Number.NaN]) {
      const s = foldShape(k);
      expect(s.left).toHaveLength(4);
      expect(s.right).toHaveLength(4);
      for (const [x, y] of [...s.left, ...s.right]) { expect(Number.isFinite(x)).toBe(true); expect(Number.isFinite(y)).toBe(true); }
    }
  });
});

describe('bezier', () => {
  const p = [[0, 100], [0, 0], [100, 0], [100, 100]] as const;
  it('hits the endpoints', () => {
    expect(bezier(p, 0)).toEqual([0, 100]);
    expect(bezier(p, 1)).toEqual([100, 100]);
  });
  it('gives the heading along the curve in radians', () => {
    expect(bezierAngle(p, 0)).toBeCloseTo(-Math.PI / 2, 5); // straight up
    expect(bezierAngle(p, 0.5)).toBeCloseTo(0, 5);          // level at the top
  });
});

describe('sceneAt', () => {
  it('runs appear → write → fold → fly → rest, then loops', () => {
    expect(sceneAt(0.2, LOOP).phase).toBe('appear');
    expect(sceneAt(LOOP.appear + 0.1, LOOP).phase).toBe('write');
    expect(sceneAt(LOOP.appear + LOOP.write + 0.1, LOOP).phase).toBe('fold');
    expect(sceneAt(LOOP.appear + LOOP.write + LOOP.fold + 0.1, LOOP).phase).toBe('fly');
    expect(sceneAt(LOOP.appear + LOOP.write + LOOP.fold + LOOP.fly + 0.1, LOOP).phase).toBe('rest');
    const total = LOOP.appear + LOOP.write + LOOP.fold + LOOP.fly + LOOP.rest;
    expect(sceneAt(total + 0.2, LOOP)).toMatchObject({ phase: 'appear', cycle: 1 });
  });
  it('reports progress 0..1 within the phase', () => {
    const s = sceneAt(LOOP.appear + LOOP.write + LOOP.fold / 2, LOOP);
    expect(s.k).toBeCloseTo(0.5, 5);
  });
  it('the send sequence is quick and does not loop', () => {
    const total = SEND.appear + SEND.write + SEND.fold + SEND.fly;
    expect(total).toBeLessThan(4);
    expect(sceneAt(total + 5, SEND, false).phase).toBe('done');
  });
});

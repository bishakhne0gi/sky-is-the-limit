import { describe, expect, it } from 'vitest';
import { PRESETS, ROOFTOP, TIMES, autoTimeOfDay, mixPalette } from '@/world/timeOfDay';

describe('time-of-day palettes', () => {
  it('has a preset for each time of day', () => {
    expect(TIMES).toEqual(['dawn', 'day', 'dusk', 'night']);
    for (const t of TIMES) expect(PRESETS[t].top).toHaveLength(3);
  });
  it('mixPalette returns the endpoints at 0 and 1', () => {
    expect(mixPalette(ROOFTOP, PRESETS.day, 0)).toEqual(ROOFTOP);
    expect(mixPalette(ROOFTOP, PRESETS.day, 1)).toEqual(PRESETS.day);
  });
  it('mixPalette interpolates colours and numbers', () => {
    const m = mixPalette(PRESETS.dawn, PRESETS.night, 0.5);
    expect(m.stars).toBeCloseTo((PRESETS.dawn.stars + PRESETS.night.stars) / 2, 9);
    expect(m.top[0]).toBeCloseTo((PRESETS.dawn.top[0] + PRESETS.night.top[0]) / 2, 9);
  });
  it('clamps t', () => {
    expect(mixPalette(ROOFTOP, PRESETS.day, 5)).toEqual(PRESETS.day);
    expect(mixPalette(ROOFTOP, PRESETS.day, Number.NaN)).toEqual(ROOFTOP);
  });
  it('Endless cycles dawn → day → dusk → night every 10 s', () => {
    expect(autoTimeOfDay(0)).toBe('dawn');
    expect(autoTimeOfDay(10.5)).toBe('day');
    expect(autoTimeOfDay(25)).toBe('dusk');
    expect(autoTimeOfDay(35)).toBe('night');
    expect(autoTimeOfDay(41)).toBe('dawn');
  });
  it('night has stars and lanterns; day has neither', () => {
    expect(PRESETS.night.stars).toBe(1);
    expect(PRESETS.night.lanterns).toBe(1);
    expect(PRESETS.day.stars).toBe(0);
    expect(PRESETS.day.lanterns).toBe(0);
    expect(PRESETS.night.birds).toBe(0);
  });
});

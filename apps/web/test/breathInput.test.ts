import { describe, expect, it } from 'vitest';
import { BreathInput } from '@/flight/breathInput';

describe('BreathInput', () => {
  it('holds while any pointer is down (multi-touch)', () => {
    const i = new BreathInput();
    i.pointerDown(1); i.pointerDown(2); i.pointerUp(1);
    expect(i.held).toBe(true);
    i.pointerUp(2);
    expect(i.held).toBe(false);
  });
  it('releases on pointercancel', () => {
    const i = new BreathInput();
    i.pointerDown(7); i.pointerCancel(7);
    expect(i.held).toBe(false);
  });
  it('releases everything on blur (tab hidden, window switch)', () => {
    const i = new BreathInput();
    i.pointerDown(1); i.keyDown('Space'); i.blur();
    expect(i.held).toBe(false);
  });
  it('treats Space as a breath key and ignores other keys', () => {
    const i = new BreathInput();
    i.keyDown('KeyA');
    expect(i.held).toBe(false);
    i.keyDown('Space');
    expect(i.held).toBe(true);
    i.keyUp('Space');
    expect(i.held).toBe(false);
  });
  it('ignores an up for a pointer it never saw', () => {
    const i = new BreathInput();
    i.pointerDown(1); i.pointerUp(99);
    expect(i.held).toBe(true);
  });
});

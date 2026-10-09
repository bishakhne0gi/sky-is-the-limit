import { describe, expect, it } from 'vitest';
import { HoldInput } from '@/flight/holdInput';

describe('HoldInput', () => {
  it('holds while any primary pointer is down (multi-touch)', () => {
    const i = new HoldInput();
    i.pointerDown(1); i.pointerDown(2); i.pointerUp(1);
    expect(i.held).toBe(true);
    i.pointerUp(2);
    expect(i.held).toBe(false);
  });
  it('ignores non-primary buttons so a right-click never sticks', () => {
    const i = new HoldInput();
    i.pointerDown(1, 2);
    expect(i.held).toBe(false);
  });
  it('releases on pointercancel', () => {
    const i = new HoldInput();
    i.pointerDown(7); i.pointerCancel(7);
    expect(i.held).toBe(false);
  });
  it('releases everything on blur (tab hidden, window switch)', () => {
    const i = new HoldInput();
    i.pointerDown(1); i.keyDown('Space'); i.blur();
    expect(i.held).toBe(false);
  });
  it('treats Space as the hold key and ignores other keys', () => {
    const i = new HoldInput();
    i.keyDown('KeyA');
    expect(i.held).toBe(false);
    i.keyDown('Space');
    expect(i.held).toBe(true);
    i.keyUp('Space');
    expect(i.held).toBe(false);
  });
});

import { live } from './live';
import type { BreathInput } from './breathInput';

/** Breath press on the canvas; steering from pointer position; release on up/cancel/blur/hidden. */
export function attachInput(el: HTMLElement, input: BreathInput): () => void {
  const isUi = (e: Event) => e.target instanceof Element && e.target.closest('[data-ui]') !== null;
  const isTyping = (e: Event) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  const steer = (e: PointerEvent) => {
    if (isUi(e)) return;
    live.pointerRaw.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  const down = (e: PointerEvent) => { steer(e); input.pointerDown(e.pointerId); };
  const up = (e: PointerEvent) => input.pointerUp(e.pointerId);
  const cancel = (e: PointerEvent) => input.pointerCancel(e.pointerId);
  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || isTyping(e) || e.repeat) return;
    e.preventDefault();
    input.keyDown(e.code);
  };
  const keyUp = (e: KeyboardEvent) => input.keyUp(e.code);
  const blur = () => input.blur();
  const visibility = () => { if (document.hidden) input.blur(); };

  el.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', steer);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    el.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', steer);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('blur', blur);
    document.removeEventListener('visibilitychange', visibility);
  };
}

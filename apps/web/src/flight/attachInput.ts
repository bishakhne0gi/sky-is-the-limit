import { live } from './live';
import type { HoldInput } from './holdInput';

/** Hold on the canvas; steering from pointer position; release on up/cancel/blur/hidden. */
export function attachInput(el: HTMLElement, input: HoldInput): () => void {
  const isUi = (e: Event) => e.target instanceof Element && e.target.closest('[data-ui]') !== null;
  const isControl = (e: Event) =>
    e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement;
  const steer = (e: PointerEvent) => {
    if (isUi(e)) return;
    live.pointerRaw.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    live.lastMove = live.time;
  };
  const down = (e: PointerEvent) => { steer(e); input.pointerDown(e.pointerId, e.button); };
  const up = (e: PointerEvent) => input.pointerUp(e.pointerId);
  const cancel = (e: PointerEvent) => input.pointerCancel(e.pointerId);
  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || isControl(e) || e.repeat) return;
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

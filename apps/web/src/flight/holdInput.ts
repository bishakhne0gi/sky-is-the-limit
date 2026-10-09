/** Hold-to-soar state: held while any primary pointer or Space is down. Pure, so it can be tested without a DOM. */
export class HoldInput {
  held = false;
  private pointers = new Set<number>();
  private key = false;

  /** `button` is PointerEvent.button; only the primary button (0) holds, so a right-click can never stick. */
  pointerDown(id: number, button = 0) { if (button !== 0) return; this.pointers.add(id); this.sync(); }
  pointerUp(id: number) { this.pointers.delete(id); this.sync(); }
  pointerCancel(id: number) { this.pointerUp(id); }
  keyDown(code: string) { if (code === 'Space') { this.key = true; this.sync(); } }
  keyUp(code: string) { if (code === 'Space') { this.key = false; this.sync(); } }
  blur() { this.pointers.clear(); this.key = false; this.sync(); }

  private sync() { this.held = this.pointers.size > 0 || this.key; }
}

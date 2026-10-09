/** Input state for the breath: held while any pointer or Space is down. Pure, so it can be tested without a DOM. */
export class BreathInput {
  held = false;
  private pointers = new Set<number>();
  private key = false;

  pointerDown(id: number) { this.pointers.add(id); this.sync(); }
  pointerUp(id: number) { this.pointers.delete(id); this.sync(); }
  pointerCancel(id: number) { this.pointerUp(id); }
  keyDown(code: string) { if (code === 'Space') { this.key = true; this.sync(); } }
  keyUp(code: string) { if (code === 'Space') { this.key = false; this.sync(); } }
  blur() { this.pointers.clear(); this.key = false; this.sync(); }

  private sync() { this.held = this.pointers.size > 0 || this.key; }
}

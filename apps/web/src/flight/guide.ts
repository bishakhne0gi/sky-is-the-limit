export const GUIDE_IN = 4;
export const GUIDE_OUT = 6;
const PERIOD = GUIDE_IN + GUIDE_OUT;
const ease = (x: number) => x * x * (3 - 2 * x);

export function guidePhase(t: number): { inhaling: boolean; scale: number } {
  const c = ((t % PERIOD) + PERIOD) % PERIOD;
  if (c < GUIDE_IN) return { inhaling: true, scale: ease(c / GUIDE_IN) };
  return { inhaling: false, scale: 1 - ease((c - GUIDE_IN) / GUIDE_OUT) };
}

/** Loop 0 starts with the guide; 30 s steady (> 0.7) hides it; 20 s lost (< 0.3) brings it back. */
export class GuideVisibility {
  visible: boolean;
  private steadySince: number | null = null;
  private lostSince: number | null = null;

  constructor(loop: number) {
    this.visible = loop === 0;
  }

  update(t: number, steadiness: number): boolean {
    this.steadySince = steadiness > 0.7 ? (this.steadySince ?? t) : null;
    this.lostSince = steadiness < 0.3 ? (this.lostSince ?? t) : null;
    if (this.visible && this.steadySince !== null && t - this.steadySince >= 30) this.visible = false;
    if (!this.visible && this.lostSince !== null && t - this.lostSince >= 20) this.visible = true;
    return this.visible;
  }
}

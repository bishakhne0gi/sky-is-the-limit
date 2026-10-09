/** Frames longer than this are stalls (throttled/occluded window, tab switch), not GPU load. */
const STALL = 0.2;

/** Averages frame time over 2.5 s windows; `sample` returns true when quality should step down. */
export class FrameBudget {
  private t = 0;
  private n = 0;

  sample(dt: number): boolean {
    if (!(dt > 0) || dt > STALL) return false;
    this.t += dt;
    this.n++;
    if (this.t < 2.5) return false;
    const avg = this.t / this.n;
    this.t = 0;
    this.n = 0;
    return avg > 1 / 40;
  }
}

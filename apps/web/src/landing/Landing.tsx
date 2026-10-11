'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { prefersReducedMotion } from '@/lib/env';
import { LOOP, SEND, bezier, bezierAngle, foldShape, sceneAt, type Curve, type Pt, type Timing } from './paperPlane';
import styles from './landing.module.css';

const IMAGE = { w: 1672, h: 941 };
/** Where the sheet appears, in image coordinates: beside the loose papers on the left. */
const ORIGIN = { u: 0.205, v: 0.71 };
const NOTES = ['let go of yesterday', 'the courage to begin', 'a quieter mind', 'someone I miss', 'more than enough', 'the sky is the limit'];
const TITLE = 'Sky is the limit';
const SPARKS = Array.from({ length: 16 }, (_, i) => ({ x: 52 + ((i * 37) % 44), y: 30 + ((i * 53) % 42), d: (i * 0.73) % 6, s: 3 + (i % 3) }));

const poly = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const easeInOut = (k: number) => (1 - Math.cos(Math.PI * k)) / 2;

function wrap(text: string): string[] {
  const words = text.split(' '), lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + w).length <= 11) lines[lines.length - 1] = last + ' ' + w;
    else lines.push(w);
  }
  return lines.slice(0, 3);
}

export function Landing() {
  const router = useRouter();
  const hero = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const plane = useRef<SVGGElement>(null);
  const left = useRef<SVGPolygonElement>(null);
  const right = useRef<SVGPolygonElement>(null);
  const crease = useRef<SVGLineElement>(null);
  const note = useRef<SVGGElement>(null);
  const reveal = useRef<SVGRectElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const trailMask = useRef<SVGPathElement>(null);
  const [lines, setLines] = useState<string[]>(wrap(NOTES[0]!));
  const [sending, setSending] = useState(false);
  const send = useRef<{ start: number } | null>(null);

  useEffect(() => {
    router.prefetch('/fly');
    if (prefersReducedMotion()) return;
    let raf = 0, cycle = -1, curve: Curve = [[0, 0], [0, 0], [0, 0], [0, 0]], scale = 0.6, length = 1;
    const t0 = performance.now();

    const layout = (variant: number) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      svg.current?.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      const r = hero.current!.getBoundingClientRect();
      const ox = Math.min(vw * 0.86, Math.max(vw * 0.14, r.left + ORIGIN.u * r.width));
      const oy = Math.min(vh * 0.85, Math.max(vh * 0.45, r.top + ORIGIN.v * r.height));
      // Rise from the papers, sweep beneath the headline and button, and leave toward the clouds on the right.
      const bend = [0.58, 0.66, 0.62][variant % 3]!;
      curve = [[ox, oy], [ox + vw * 0.05, oy - vh * 0.26], [vw * bend, vh * 0.6], [vw * 1.08, vh * (0.3 + (variant % 2) * 0.05)]];
      scale = Math.max(0.42, Math.min(0.7, vw / 2000));
      const d = `M${curve[0].join(',')} C${curve[1].join(',')} ${curve[2].join(',')} ${curve[3].join(',')}`;
      trail.current?.setAttribute('d', d);
      trailMask.current?.setAttribute('d', d);
      length = trailMask.current?.getTotalLength() ?? 1;
      trailMask.current?.setAttribute('stroke-dasharray', `${length} ${length}`);
    };

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const sendStart = send.current?.start;
      const timing: Timing = sendStart !== undefined ? SEND : LOOP;
      const s = sceneAt(sendStart !== undefined ? (now - sendStart) / 1000 : t, timing, sendStart === undefined);
      if (s.phase === 'done') { router.push('/fly'); return; }
      if (s.cycle !== cycle && sendStart === undefined) {
        cycle = s.cycle;
        setLines(wrap(NOTES[cycle % NOTES.length]!));
        layout(cycle);
      }

      const fold = s.phase === 'fold' ? s.k : s.phase === 'fly' || s.phase === 'rest' ? 1 : 0;
      const shape = foldShape(fold);
      left.current?.setAttribute('points', poly(shape.left));
      right.current?.setAttribute('points', poly(shape.right));
      right.current?.setAttribute('fill', fold > 0.4 ? '#ece5d6' : '#f6f1e6');
      crease.current?.setAttribute('y2', String(190 - 32 * fold));
      note.current?.setAttribute('opacity', String(s.phase === 'fold' ? Math.max(0, 1 - s.k * 3) : s.phase === 'appear' || s.phase === 'write' ? 1 : 0));
      reveal.current?.setAttribute('width', String(s.phase === 'write' ? 140 * s.k : s.phase === 'appear' ? 0 : 140));

      let x = curve[0][0], y = curve[0][1], rot = Math.sin(t * 1.6) * 3, sc = scale, op = 1;
      if (s.phase === 'appear') { y += 18 * (1 - s.k); sc *= 0.9 + 0.1 * s.k; op = s.k; }
      else if (s.phase === 'write' || s.phase === 'fold') { y += Math.sin(t * 1.2) * 3; }
      else if (s.phase === 'fly') {
        const e = easeInOut(s.k);
        [x, y] = bezier(curve, e);
        rot = ((bezierAngle(curve, Math.max(0.001, e)) + Math.PI / 2) * 180) / Math.PI;
        sc = scale * (1 - 0.65 * e);
        op = 1 - Math.max(0, (e - 0.85) / 0.15);
        trailMask.current?.setAttribute('stroke-dashoffset', String(length * (1 - e)));
      } else if (s.phase === 'rest') { op = 0; }
      if (s.phase !== 'fly') trailMask.current?.setAttribute('stroke-dashoffset', String(s.phase === 'rest' ? 0 : length));
      trail.current?.setAttribute('opacity', String(s.phase === 'rest' ? 0.9 * (1 - s.k) : s.phase === 'fly' ? 0.9 : 0));
      plane.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${sc.toFixed(3)}) translate(-70 -95)`);
      plane.current?.setAttribute('opacity', op.toFixed(3));
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => layout(Math.max(0, cycle));
    layout(0);
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [router]);

  const begin = () => {
    if (sending) return;
    setSending(true);
    if (prefersReducedMotion()) { router.push('/fly'); return; }
    setLines(wrap('here I go'));
    send.current = { start: performance.now() };
  };

  return (
    <main className={styles.page}>
      <div ref={hero} className={styles.hero} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.image} src="/landing/hero.webp" alt="" width={IMAGE.w} height={IMAGE.h} fetchPriority="high" />
        <div className={styles.sun} />
        <div className={styles.rays} />
        {SPARKS.map((p, i) => (
          <span key={i} className={styles.spark} style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s` } as CSSProperties} />
        ))}
      </div>

      <svg ref={svg} className={styles.paper} aria-hidden="true">
        <defs>
          <mask id="trail-reveal" maskUnits="userSpaceOnUse">
            <path ref={trailMask} fill="none" stroke="#fff" strokeWidth="8" />
          </mask>
          <clipPath id="note-reveal"><rect ref={reveal} x="0" y="0" width="0" height="190" /></clipPath>
        </defs>
        <path ref={trail} className={styles.trail} mask="url(#trail-reveal)" fill="none" opacity="0" />
        <g ref={plane} className={styles.plane} opacity="0">
          <polygon ref={left} fill="#fffdf8" stroke="rgba(80,70,50,.22)" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon ref={right} fill="#f6f1e6" stroke="rgba(80,70,50,.22)" strokeWidth="1.2" strokeLinejoin="round" />
          <line ref={crease} x1="70" y1="0" x2="70" y2="190" stroke="rgba(60,50,30,.16)" strokeWidth="1" />
          <g ref={note}>
            {[48, 78, 108, 138, 168].map((y) => <line key={y} x1="14" x2="126" y1={y} y2={y} stroke="rgba(90,130,200,.18)" strokeWidth="1" />)}
            <g clipPath="url(#note-reveal)">
              {lines.map((l, i) => (
                <text key={i} x="70" y={72 + i * 30} textAnchor="middle" className={styles.handwriting}>{l}</text>
              ))}
            </g>
          </g>
        </g>
      </svg>

      <section className={styles.copy}>
        <h1 className={styles.title} aria-label={TITLE}>
          {TITLE.split('').map((c, i) => (
            <span key={i} aria-hidden="true" style={{ '--i': i } as CSSProperties}>{c === ' ' ? ' ' : c}</span>
          ))}
        </h1>
        <p className={styles.lede}>Write what you carry. Fold it into a plane. Let the sky take it.</p>
        <button type="button" className={styles.begin} onClick={begin} disabled={sending}>{sending ? 'Sending…' : 'Begin'}</button>
      </section>

      <p className={styles.credit}>
        Music by <a href="https://cynicmusic.com" target="_blank" rel="noreferrer">The Cynic Project</a> · CC0
      </p>
    </main>
  );
}

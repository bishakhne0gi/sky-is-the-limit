'use client';
import { useEffect, useState } from 'react';
import { live } from '@/flight/live';
import { prefersReducedMotion } from '@/lib/env';
import { persistNow } from '@/profile/persist';
import { useApp } from '@/state/store';
import type { TimeSetting } from '@/world/timeOfDay';
import styles from './ui.module.css';

const PILLS: { key: TimeSetting; label: string; icon: string }[] = [
  { key: 'dawn', label: 'Dawn', icon: 'M12 3v3M4.9 8.9l1.4 1.4M19.1 8.9l-1.4 1.4M3 16h18M7 16a5 5 0 0 1 10 0M8 20h8' },
  { key: 'day', label: 'Day', icon: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' },
  { key: 'dusk', label: 'Dusk', icon: 'M12 10V3M8.5 6.5 12 10l3.5-3.5M3 16h18M7 16a5 5 0 0 1 10 0M8 20h8' },
  { key: 'night', label: 'Night', icon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' },
  { key: 'auto', label: 'Endless', icon: 'M12 12c-2-2.7-3.6-4-5.5-4a4 4 0 0 0 0 8c1.9 0 3.5-1.3 5.5-4zm0 0c2 2.7 3.6 4 5.5 4a4 4 0 0 0 0-8c-1.9 0-3.5 1.3-5.5 4z' },
];

function Altimeter() {
  const [ft, setFt] = useState(live.altitude);
  useEffect(() => {
    const id = window.setInterval(() => setFt(live.altitude), 100);
    return () => window.clearInterval(id);
  }, []);
  return <div className={styles.alt}>Altitude<b>{Math.floor(ft).toLocaleString('en-US')}<i>ft</i></b></div>;
}

export function Hud() {
  const settings = useApp((s) => s.settings);
  const phase = useApp((s) => s.phase);
  const [veil, setVeil] = useState(0);
  const [hinted, setHinted] = useState(false);
  const calm = settings.reducedMotion ?? prefersReducedMotion();

  useEffect(() => { if (phase === 'flying' && !hinted) { const id = window.setTimeout(() => setHinted(true), 14000); return () => window.clearTimeout(id); } }, [phase, hinted]);

  const set = (s: Partial<typeof settings>) => { useApp.getState().updateSettings(s); persistNow(); };
  const writeAnother = () => {
    if (calm) { useApp.getState().writeAnother(); return; }
    setVeil(Date.now());
    window.setTimeout(() => useApp.getState().writeAnother(), 650);
  };

  return (
    <>
      {phase === 'flying' && (
        <nav className={styles.pills} data-ui aria-label="Time of day">
          {PILLS.map((p) => (
            <button key={p.key} type="button" className={styles.pill} aria-pressed={settings.timeOfDay === p.key} onClick={() => set({ timeOfDay: p.key })}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={p.icon} /></svg><span>{p.label}</span>
            </button>
          ))}
        </nav>
      )}
      {phase === 'flying' && <Altimeter />}
      {phase === 'flying' && !hinted && <p className={styles.hint}>Move to steer · hold to soar</p>}
      <div className={styles.hud} data-ui>
        {phase === 'flying' && <button type="button" className={styles.chip} onClick={writeAnother}>Write another</button>}
        <button type="button" className={styles.chip} aria-pressed={!settings.muted} onClick={() => set({ muted: !settings.muted })}>{settings.muted ? 'Sound off' : 'Sound on'}</button>
        <button type="button" className={styles.chip} aria-pressed={calm} onClick={() => set({ reducedMotion: !calm })}>Calm motion</button>
      </div>
      {veil > 0 && <div key={veil} className={styles.veil} onAnimationEnd={() => setVeil(0)} />}
    </>
  );
}

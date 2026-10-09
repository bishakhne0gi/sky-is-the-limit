'use client';
import { persistNow } from '@/profile/persist';
import { useApp } from '@/state/store';
import styles from './ui.module.css';

export function Hud() {
  const settings = useApp((s) => s.settings);
  const phase = useApp((s) => s.phase);
  const loop = useApp((s) => s.loop);
  const toggle = (k: 'muted' | 'autoBreathe' | 'reducedMotion') => {
    const s = useApp.getState().settings;
    const next = k === 'muted' ? { muted: !s.muted }
      : k === 'autoBreathe' ? { autoBreathe: !s.autoBreathe }
      : { reducedMotion: !(s.reducedMotion ?? false) };
    useApp.getState().updateSettings(next);
    persistNow();
  };
  return (
    <>
      {phase === 'flying' && loop === 0 && <p className={styles.hint}>Hold to breathe in · release to glide</p>}
      <div className={styles.hud} data-ui>
        <button type="button" className={styles.chip} aria-pressed={!settings.muted} onClick={() => toggle('muted')}>{settings.muted ? 'Sound off' : 'Sound on'}</button>
        <button type="button" className={styles.chip} aria-pressed={settings.autoBreathe} onClick={() => toggle('autoBreathe')}>Auto-breathe</button>
        <button type="button" className={styles.chip} aria-pressed={settings.reducedMotion === true} onClick={() => toggle('reducedMotion')}>Calm motion</button>
      </div>
    </>
  );
}

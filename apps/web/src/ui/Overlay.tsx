'use client';
import { useApp } from '@/state/store';
import { Hud } from './Hud';
import { Ritual } from './Ritual';
import styles from './ui.module.css';

export function Overlay({ onRelease }: { onRelease?: () => void }) {
  const phase = useApp((s) => s.phase);
  return (
    <div className={styles.layer}>
      {phase === 'ritual' && <Ritual onRelease={onRelease} />}
      <Hud />
    </div>
  );
}

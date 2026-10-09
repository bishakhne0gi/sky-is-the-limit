'use client';
import { useApp } from '@/state/store';
import { DawnFlash } from './DawnFlash';
import { Hud } from './Hud';
import { Ritual } from './Ritual';
import { StoryLine } from './StoryLine';
import styles from './ui.module.css';

export function Overlay({ onRelease }: { onRelease?: () => void }) {
  const phase = useApp((s) => s.phase);
  return (
    <div className={styles.layer}>
      <StoryLine />
      {phase === 'ritual' && <Ritual onRelease={onRelease} />}
      <DawnFlash />
      <Hud />
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { StoryMemory } from '@/story/storyMemory';
import { useApp } from '@/state/store';
import styles from './ui.module.css';

export function StoryLine() {
  const memory = useMemo(() => new StoryMemory(), []);
  const band = useApp((s) => s.band);
  const loop = useApp((s) => s.loop);
  const phase = useApp((s) => s.phase);
  const [line, setLine] = useState<{ key: string; text: string } | null>(null);

  useEffect(() => {
    if (phase !== 'flying') return;
    const text = memory.take(loop, band);
    if (text) setLine({ key: `${loop}:${band}`, text });
  }, [band, loop, phase, memory]);

  if (!line || phase === 'ritual') return null;
  return <p key={line.key} className={styles.story} onAnimationEnd={() => setLine(null)}>{line.text}</p>;
}

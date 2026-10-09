'use client';
import { useApp } from '@/state/store';
import styles from './ui.module.css';

export function DawnFlash() {
  const dawnAt = useApp((s) => s.dawnAt);
  if (!dawnAt) return null;
  return <div key={dawnAt} className={styles.dawn} />;
}

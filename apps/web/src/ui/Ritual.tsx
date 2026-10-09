'use client';
import { useState, type CSSProperties } from 'react';
import { FEET_PER_LOOP, KINDS, KIND_ORDER, type Fold, type Kind } from '@sitl/core';
import { setIntention } from '@/flight/intention';
import { useApp } from '@/state/store';
import styles from './Ritual.module.css';

const KIND_LABEL: Record<Kind, string> = { hope: 'Hope', release: 'Release', courage: 'Courage', love: 'Love', peace: 'Peace' };
const FOLD_LABEL: Record<Fold, string> = { dart: 'Dart', glider: 'Glider', crane: 'Crane', lanternwing: 'Lantern-wing', starkite: 'Star-kite' };

export function Ritual({ onRelease }: { onRelease?: () => void }) {
  const savedAlt = useApp((s) => s.savedAlt);
  const loop = useApp((s) => s.loop);
  const unlocked = useApp((s) => s.unlockedFolds);
  const [words, setWords] = useState('');
  const [kind, setKind] = useState<Kind>(useApp.getState().kind);
  const [fold, setFold] = useState<Fold>(unlocked[unlocked.length - 1] ?? 'dart');
  const [folding, setFolding] = useState(false);

  const release = () => {
    setIntention(words);
    setFolding(true);
    onRelease?.();
    window.setTimeout(() => {
      useApp.getState().release(kind, fold);
      setFolding(false);
      setWords('');
    }, 1600);
  };

  return (
    <div className={styles.ritual} data-ui>
      <div className={styles.card}>
        {savedAlt > 0 && (
          <p className={styles.risen}>
            You have risen {Math.floor(savedAlt * FEET_PER_LOOP).toLocaleString('en-US')} ft{loop > 0 ? ` · dawn ${loop + 1}` : ''}
          </p>
        )}
        <h2 className={styles.prompt}>What are you carrying up?</h2>
        <div className={`${styles.paper} ${folding ? styles.folding : ''}`} style={{ '--glow': KINDS[kind] } as CSSProperties}>
          <textarea
            value={words}
            maxLength={80}
            onChange={(e) => setWords(e.target.value)}
            placeholder="A few words, or nothing at all"
            aria-label="What you are carrying"
            disabled={folding}
          />
        </div>
        <div className={styles.row} role="radiogroup" aria-label="Kind of intention">
          {KIND_ORDER.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={k === kind} className={styles.choice} onClick={() => setKind(k)} style={{ '--c': KINDS[k] } as CSSProperties}>
              <span className={styles.dot} />{KIND_LABEL[k]}
            </button>
          ))}
        </div>
        {unlocked.length > 1 && (
          <div className={styles.row} role="radiogroup" aria-label="Fold">
            {unlocked.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={f === fold} className={styles.choice} onClick={() => setFold(f)}>{FOLD_LABEL[f]}</button>
            ))}
          </div>
        )}
        <button type="button" className={styles.release} onClick={release} disabled={folding}>Let it go</button>
        <p className={styles.note}>Your words stay on this device.</p>
      </div>
    </div>
  );
}

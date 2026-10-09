export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function safeLocalStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isCoarsePointer(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}

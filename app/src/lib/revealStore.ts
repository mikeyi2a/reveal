import { useEffect, useState } from 'react';

export interface ProjectorState {
  ref: string;
  text: string;
  /** Per-verse text, used by the projector to render numbered lines. */
  verses?: string[];
  book?: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  updatedAt: number;
}

const KEY = 'reveal:projector';

export function writeProjectorState(state: ProjectorState | null): void {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — degrade silently */
  }
}

export function readProjectorState(): ProjectorState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProjectorState) : null;
  } catch {
    return null;
  }
}

/**
 * Shared projector state that survives across separate browser tabs/windows.
 * The operator console and the projector are distinct routes (often distinct
 * screens), so we sync through localStorage + the `storage` event rather than
 * in-memory React state — no backend required.
 */
export function useProjectorState(): [ProjectorState | null, (s: ProjectorState | null) => void] {
  const [state, setState] = useState<ProjectorState | null>(() => readProjectorState());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(readProjectorState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const set = (s: ProjectorState | null) => {
    writeProjectorState(s);
    setState(s);
  };

  return [state, set];
}

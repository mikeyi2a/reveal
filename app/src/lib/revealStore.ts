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

/**
 * Opens the standalone projector route in a separate browser window — intended
 * to be dragged onto a second monitor (then F11 to fullscreen). The operator
 * app stays fully interactive on the primary screen; live updates stream over
 * to the new window via the shared localStorage sync in `useProjectorState`.
 *
 * Returns the opened window (or null if the browser blocked the popup — which
 * happens when this isn't called directly from a user click).
 */
export function openProjectorWindow(): Window | null {
  const features = [
    'width=1280',
    'height=720',
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'resizable=yes',
  ].join(',');
  const base = `${window.location.origin}${window.location.pathname}`;
  const url = base.endsWith('/') ? `${base}projector` : `${base.replace(/\/[^/]*$/, '/')}projector`;
  const win = window.open(url, 'reveal-projector', features);
  if (win) win.focus();
  return win;
}

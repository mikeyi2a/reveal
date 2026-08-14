import { useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * The single build output (`dist/`) is loaded by both a plain browser and the
 * native Tauri shell — there is no separate native build target — so which
 * sync mechanism to use can only be decided at runtime, not build time.
 * `isTauri()` is a safe property check (`!!globalThis.isTauri`) that returns
 * false with no Tauri runtime present, so this is harmless in the web build.
 */
const PROJECTOR_EVENT = 'reveal:projector';

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
 * Shared projector state that survives across separate windows. The operator
 * console and the projector are distinct routes (often distinct screens), so
 * this needs a real cross-window transport, not in-memory React state.
 *
 * Two transports, chosen at runtime:
 *  - Web: localStorage + the `storage` event. Same-origin browser tabs only.
 *  - Native (Tauri): `emit`/`listen`. localStorage's `storage` event has only
 *    ever been exercised across browser tabs in one process — it is NOT
 *    verified to fire reliably across two separate native WebviewWindow
 *    instances, and this app cannot glitch mid-service. Tauri's event system
 *    is the purpose-built, IPC-based mechanism for exactly this, so the
 *    native build doesn't gamble on the untested path.
 */
export function useProjectorState(): [ProjectorState | null, (s: ProjectorState | null) => void] {
  // Start blank on a fresh console load — don't restore a previously displayed
  // verse from localStorage, or it looks like stale detection data on page load.
  // The sync mechanism still works for live cross-window updates either way;
  // we just don't read it back as the initial state. Same on both transports.
  const [state, setState] = useState<ProjectorState | null>(null);

  useEffect(() => {
    if (isTauri()) {
      let unlisten: (() => void) | undefined;
      let cancelled = false;
      listen<ProjectorState>(PROJECTOR_EVENT, (event) => setState(event.payload)).then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });
      return () => {
        cancelled = true;
        unlisten?.();
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(readProjectorState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const set = (s: ProjectorState | null) => {
    if (isTauri()) {
      void emit(PROJECTOR_EVENT, s);
    } else {
      writeProjectorState(s);
    }
    // Update local state directly regardless of transport — same reasoning
    // as the web path already had: the sync event only reliably reaches
    // *other* windows, so the window that made the change updates itself here.
    setState(s);
  };

  return [state, set];
}

/** Window label for the native projector `WebviewWindow` — must match the
 *  entry in `src-tauri/capabilities/default.json`'s `windows` array. */
const PROJECTOR_WINDOW_LABEL = 'projector';

/**
 * Opens the standalone projector route in a separate window — intended to be
 * dragged onto a second monitor (then F11 to fullscreen). The operator app
 * stays fully interactive on the primary screen; live updates stream over to
 * the new window via `useProjectorState`'s sync (localStorage on web, Tauri
 * events natively).
 *
 * Web: `window.open()` with a *named* target, so calling this again while the
 * popup is already open just refocuses it rather than opening a duplicate.
 * Native: replicates that same reuse behavior — looks up an existing
 * `"projector"`-labeled WebviewWindow and focuses it before ever creating a
 * new one.
 */
export async function openProjectorWindow(): Promise<void> {
  if (isTauri()) {
    const existing = await WebviewWindow.getByLabel(PROJECTOR_WINDOW_LABEL);
    if (existing) {
      await existing.setFocus();
      return;
    }
    const win = new WebviewWindow(PROJECTOR_WINDOW_LABEL, {
      url: '/projector',
      title: 'Reveal — Projector',
      width: 1280,
      height: 720,
      resizable: true,
    });
    win.once('tauri://error', (e) => console.error('[revealStore] failed to create projector window', e));
    return;
  }

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
  win?.focus();
}

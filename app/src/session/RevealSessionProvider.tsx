import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  ReferenceStabilizer,
  scanText,
  formatReference,
  type Confidence,
} from '../lib/referenceScanner';
import { ensureBibleLoaded, buildVerseDetection, type VerseDetection, type VerseBatch } from '../lib/verseLookup';
import { useProjectorState, type ProjectorState } from '../lib/revealStore';
import { useWhisperTranscription, type WhisperStatus, type WhisperBackend, type TranscriptSegment } from '../hooks/useWhisperTranscription';
import useAudioLevel from '../hooks/useAudioLevel';

/** One queue entry per displayable batch. A wide reading (e.g. Romans 8:1-24)
 *  becomes several entries: the primary batch gets emphasis styling, the rest
 *  render as their own plain cards beneath it. Confirming or dismissing one
 *  entry never touches the others. */
export interface VerseDetectionQueueItem {
  id: string;
  detection: VerseDetection;
  batch: VerseBatch;
  isPrimary: boolean;
  confidence: Confidence;
}

interface LiveState {
  mic: boolean;
  video: boolean;
  system: boolean;
}

export interface RevealSessionValue {
  /** True while a session is live. Starts when any console tab is opened;
   *  only cleared by `endSession()` (the End Session button + confirm modal). */
  active: boolean;
  startSession: () => void;
  endSession: () => void;

  segments: TranscriptSegment[];
  whisperStatus: WhisperStatus;
  whisperBackend: WhisperBackend | null;
  whisperError: string | null;
  modelLoadMs: number | null;
  micLevel: MutableRefObject<number>;

  sessionSeconds: number;

  detectionQueue: VerseDetectionQueueItem[];
  recentDetections: VerseDetectionQueueItem[];
  unresolvedRef: string | null;

  autoPush: boolean;
  setAutoPush: (v: boolean) => void;

  live: LiveState;
  setLive: React.Dispatch<React.SetStateAction<LiveState>>;

  projector: ProjectorState | null;
  setProjectorState: (s: ProjectorState | null) => void;

  manualQuery: string;
  setManualQuery: (s: string) => void;
  displayItem: (item: VerseDetectionQueueItem) => void;
  dismissItem: (id: string) => void;
  runManualSearch: () => void;
  displayLatencyMs: number | null;

  pendingVerse: VerseDetectionQueueItem | null;
}

const RevealSessionContext = createContext<RevealSessionValue | null>(null);

// Routes that count as "in the console". Visiting any of them starts a
// session; leaving them (or the app) does NOT end it — only End Session does.
const CONSOLE_ROUTES = ['/dashboard', '/audio-setup', '/theme-studio'];

export function RevealSessionProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);

  const [projector, setProjectorState] = useProjectorState();
  const [detectionQueue, setDetectionQueue] = useState<VerseDetectionQueueItem[]>([]);
  const [recentDetections, setRecentDetections] = useState<VerseDetectionQueueItem[]>([]);
  const [unresolvedRef, setUnresolvedRef] = useState<string | null>(null);
  const [bibleReady, setBibleReady] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [live, setLive] = useState<LiveState>({ mic: true, video: false, system: false });
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [manualQuery, setManualQuery] = useState('');
  const [displayLatencyMs, setDisplayLatencyMs] = useState<number | null>(null);
  const displayStartRef = useRef<number | null>(null);

  // Resources only run while a session is active, so navigating away (or to
  // the Landing / Projector) keeps the same session alive instead of tearing
  // down the mic, the model, and the elapsed timer.
  const { level: micLevel } = useAudioLevel(live.mic && active);
  const { segments, status: whisperStatus, backend: whisperBackend, error: whisperError, modelLoadMs } =
    useWhisperTranscription(active);

  const stabilizerRef = useRef(new ReferenceStabilizer());
  const scannedFinalIdsRef = useRef(new Set<string>());

  // The newest detection is the last item in the FIFO queue; it carries the
  // BorderBeam emphasis on the dashboard. Confirming/dismissing removes items,
  // so "newest" naturally advances as the operator works the queue.
  const pendingVerse = detectionQueue[detectionQueue.length - 1] ?? null;

  // Auto-start when the operator opens any console tab. We deliberately never
  // auto-stop on route change — the session outlives tab switches.
  const isConsoleRoute = CONSOLE_ROUTES.includes(pathname);
  useEffect(() => {
    if (isConsoleRoute && !active) setActive(true);
  }, [isConsoleRoute, active]);

  // Elapsed-time clock — only runs while the session is live.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  // The Bible ships as its own lazily-loaded chunk; it resolves long before
  // Whisper finishes downloading, so gating detection on it costs nothing.
  useEffect(() => {
    let cancelled = false;
    ensureBibleLoaded()
      .then(() => {
        if (!cancelled) setBibleReady(true);
      })
      .catch((err) => console.error('[verseLookup] failed to load bundled Bible', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const projectBatch = (d: VerseDetection, b: VerseBatch) => {
    setProjectorState({
      ref: b.ref.toUpperCase(),
      text: b.text,
      verses: b.verses,
      verseStart: b.verseStart,
      book: d.book,
      chapter: d.chapter,
      updatedAt: Date.now(),
    });
  };

  const toQueueItems = (d: VerseDetection, confidence: Confidence): VerseDetectionQueueItem[] =>
    d.batches.map((b, i) => ({
      id: `${d.fullRef}-${b.ref}-${Date.now()}-${i}`,
      detection: d,
      batch: b,
      isPrimary: i === 0,
      confidence,
    }));

  // Scans transcript segments for Bible references, splits wide readings into
  // batches of 8 (capped at 24), and either queues them for manual confirm or
  // auto-pushes the primary batch when Auto-push is on.
  useEffect(() => {
    if (!bibleReady) return;

    const enqueue = (items: VerseDetectionQueueItem[]) => {
      setDetectionQueue((prev) => {
        const filtered = items.filter((ni) => !prev.some((p) => p.batch.ref === ni.batch.ref));
        return [...prev, ...filtered].slice(-12);
      });
    };

    const queueDetectedRef = (ref: ReturnType<typeof scanText>[number]) => {
      const detection = buildVerseDetection(ref);
      if (!detection) {
        // The bundled Bible is complete, so an unresolvable reference means a
        // mis-transcription ("John 99:1"). Surface it instead of dropping it.
        console.info('[referenceScanner] no such passage:', formatReference(ref));
        setUnresolvedRef(formatReference(ref));
        return;
      }
      setUnresolvedRef(null);

      if (autoPush) {
        // Auto-push the primary batch; leave the remaining parts as their own
        // cards so the operator can click them on if the preacher reads on.
        projectBatch(detection, detection.batches[0]);
        enqueue(toQueueItems(detection, ref.confidence).slice(1));
        return;
      }

      enqueue(toQueueItems(detection, ref.confidence));
    };

    for (const seg of segments) {
      if (!seg.final || scannedFinalIdsRef.current.has(seg.id)) continue;
      scannedFinalIdsRef.current.add(seg.id);
      // Scan ALL references in a finalized segment (not just the last one),
      // so multiple verses spoken in a single sentence both queue.
      const refs = scanText(seg.text);
      for (const ref of refs) queueDetectedRef(ref);
    }

    const latest = segments[segments.length - 1];
    if (latest && !latest.final) {
      const confirmed = stabilizerRef.current.update(latest.text);
      if (confirmed) queueDetectedRef(confirmed);
    } else {
      stabilizerRef.current.reset();
    }
  }, [segments, autoPush, bibleReady, projectBatch, toQueueItems]);

  // Displays a batch to the projector, then drops it from the queue and logs it
  // to recently detected so it can be re-projected. Times the round trip from
  // the operator's click to the projector state committing, so the dashboard's
  // "Display Latency" card reflects real on-screen delay (not model load time).
  const displayItem = (item: VerseDetectionQueueItem) => {
    displayStartRef.current = performance.now();
    projectBatch(item.detection, item.batch);
    setDetectionQueue((prev) => prev.filter((i) => i.id !== item.id));
    setRecentDetections((prev) => [item, ...prev].slice(0, 5));
  };

  // Compute display latency once the projector state actually commits.
  useEffect(() => {
    if (projector && displayStartRef.current != null) {
      setDisplayLatencyMs(performance.now() - displayStartRef.current);
      displayStartRef.current = null;
    }
  }, [projector]);

  const dismissItem = (id: string) => {
    setDetectionQueue((prev) => prev.filter((i) => i.id !== id));
  };

  // Manual search: type a reference ("Romans 8:28-30") to force a detection
  // without waiting for the preacher to speak it. Tagged 100% — a deliberate
  // operator action, never a guess.
  const runManualSearch = () => {
    const q = manualQuery.trim();
    if (!q) return;
    const refs = scanText(q);
    if (refs.length === 0) {
      setUnresolvedRef(q);
      return;
    }
    let anyResolved = false;
    for (const ref of refs) {
      const detection = buildVerseDetection(ref);
      if (!detection) {
        setUnresolvedRef(formatReference(ref));
        continue;
      }
      anyResolved = true;
      setUnresolvedRef(null);
      setDetectionQueue((prev) => {
        const items = toQueueItems(detection, 'manual');
        const filtered = items.filter((ni) => !prev.some((p) => p.batch.ref === ni.batch.ref));
        return [...prev, ...filtered].slice(-12);
      });
    }
    if (anyResolved) setManualQuery('');
  };

  const startSession = () => setActive(true);

  // The ONLY way a session ends. Tears down the live state, wipes the queue,
  // resets the clock, and clears the projector wall.
  const endSession = () => {
    setActive(false);
    setDetectionQueue([]);
    setRecentDetections([]);
    setUnresolvedRef(null);
    setSessionSeconds(0);
    setAutoPush(false);
    setLive({ mic: true, video: false, system: false });
    setManualQuery('');
    scannedFinalIdsRef.current.clear();
    stabilizerRef.current.reset();
    setProjectorState(null);
    setDisplayLatencyMs(null);
    displayStartRef.current = null;
  };

  const value: RevealSessionValue = {
    active,
    startSession,
    endSession,
    segments,
    whisperStatus,
    whisperBackend,
    whisperError,
    modelLoadMs,
    micLevel,
    sessionSeconds,
    detectionQueue,
    recentDetections,
    unresolvedRef,
    autoPush,
    setAutoPush,
    live,
    setLive,
    projector,
    setProjectorState,
    manualQuery,
    setManualQuery,
    displayItem,
    dismissItem,
    runManualSearch,
    displayLatencyMs,
    pendingVerse,
  };

  return <RevealSessionContext.Provider value={value}>{children}</RevealSessionContext.Provider>;
}

export function useRevealSession(): RevealSessionValue {
  const ctx = useContext(RevealSessionContext);
  if (!ctx) throw new Error('useRevealSession must be used within a RevealSessionProvider');
  return ctx;
}

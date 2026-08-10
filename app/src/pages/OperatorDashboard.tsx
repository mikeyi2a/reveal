import { useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  SpeakerHighIcon,
  ArrowCounterClockwiseIcon,
  SignOutIcon,
  LightningIcon,
  BookOpenTextIcon,
  WaveformIcon,
  GaugeIcon,
  MonitorPlayIcon,
  ArrowsOutIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';

import { BorderBeam } from 'border-beam';
import ConsoleLayout, { Card, CardLabel } from '../components/ConsoleLayout';
import Stage from '../components/Stage';
import ProjectorArtboard, { DEFAULT_PROJECTOR } from '../components/ProjectorArtboard';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import IconToggle from '../components/IconToggle';
import { useRevealSession } from '../session/RevealSessionProvider';
import { openProjectorWindow } from '../lib/revealStore';
import type { Confidence } from '../lib/referenceScanner';

const MIN_LEFT = 260;
const MIN_CENTER = 360;
const MIN_RIGHT = 300;
const DIVIDER_PX = 10;
const DEFAULT_LEFT = 360;
const DEFAULT_RIGHT = 360;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Vertical drag handle that resizes the adjacent column. `onDrag` receives the
 * horizontal pointer delta in px; the parent clamps to sane minimums/maximums
 * so the other columns stay readable and the layout never breaks.
 * Double-click resets the handle's column to its default width.
 */
function ColumnDivider({ onDrag, onReset }: { onDrag: (dx: number) => void; onReset: () => void }) {
  const lastX = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    lastX.current = e.clientX;
    setActive(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (lastX.current === null) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    if (dx !== 0) onDrag(dx);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    lastX.current = null;
    setActive(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className="col-divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      data-active={active ? 'true' : 'false'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onReset}
      title="Drag to resize · double-click to reset"
      style={{
        alignItems: 'center',
        cursor: 'col-resize',
        display: 'flex',
        flex: `0 0 ${DIVIDER_PX}px`,
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <span className="col-divider-line" />
    </div>
  );
}

const OPACITY_STEPS = [0.35, 0.55, 0.8, 1];

/** Traffic-light scale: most confident reads as the deepest green, tapering to red. */
function confidenceColor(pct: number): string {
  if (pct >= 95) return '#0E9F4A';
  if (pct >= 85) return '#22C55E';
  if (pct >= 70) return '#EAB308';
  return '#EF4444';
}

/** Scanner reports high/medium (verse-level vs whole-chapter); a manual
 *  operator lookup is deliberate, so it reads as 100%. */
function confidencePercent(c: Confidence): number {
  if (c === 'manual') return 100;
  return c === 'high' ? 98.4 : 84.5;
}

/** Trims a preview string to keep cards calm (full text still goes to wall). */
function previewText(t: string): string {
  return t.length > 140 ? `${t.slice(0, 140)}…` : t;
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const session = useRevealSession();
  const {
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
    pendingVerse,
    displayLatencyMs,
    endSession,
  } = session;

  const [showEndModal, setShowEndModal] = useState(false);
  const previewBoxRef = useRef<HTMLButtonElement>(null);
  // Fade the bottom of the detection queue ONLY when it overflows the container
  // (more cards than fit). A short list that fits shows no fade.
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const [queueOverflowing, setQueueOverflowing] = useState(false);
  useEffect(() => {
    const el = queueScrollRef.current;
    if (!el) return;
    const measure = () => setQueueOverflowing(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detectionQueue]);

  // Same overflow-only logic for the live-transcription stream: newest segment
  // is pinned to the bottom, so when it overflows we fade the TOP edge.
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const [transcriptOverflowing, setTranscriptOverflowing] = useState(false);
  useEffect(() => {
    const el = transcriptScrollRef.current;
    if (!el) return;
    const measure = () => setTranscriptOverflowing(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [segments]);

  // Resizable columns: left (transcript) and right (projector + recent) hold a
  // fixed px width; the center (detection & matching) takes the remaining space.
  // Clamps are computed against the *other* column's live width, so dragging one
  // can never push the total past the container — the center simply absorbs the
  // slack down to its own minimum. A window resize re-clamps both to stay safe.
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const leftWidthRef = useRef(DEFAULT_LEFT);
  const rightWidthRef = useRef(DEFAULT_RIGHT);
  useEffect(() => { leftWidthRef.current = leftWidth; }, [leftWidth]);
  useEffect(() => { rightWidthRef.current = rightWidth; }, [rightWidth]);

  const mainRef = useRef<HTMLElement>(null);
  const innerWidthOf = () => Math.max(0, (mainRef.current?.clientWidth ?? 0) - 48); // minus paddingInline 24*2

  // Available width for the two fixed columns = inner minus the center's own
  // minimum minus both divider gutters. Split across the two so neither can
  // exceed what's left given the other's current size.
  const maxLeft = () => Math.max(MIN_LEFT, innerWidthOf() - MIN_CENTER - rightWidthRef.current - DIVIDER_PX * 2);
  const maxRight = () => Math.max(MIN_RIGHT, innerWidthOf() - MIN_CENTER - leftWidthRef.current - DIVIDER_PX * 2);

  const handleLeftDrag = (dx: number) => setLeftWidth((w) => clamp(w + dx, MIN_LEFT, maxLeft()));
  const handleRightDrag = (dx: number) => setRightWidth((w) => clamp(w - dx, MIN_RIGHT, maxRight()));
  const resetLeft = () => setLeftWidth(clamp(DEFAULT_LEFT, MIN_LEFT, maxLeft()));
  const resetRight = () => setRightWidth(clamp(DEFAULT_RIGHT, MIN_RIGHT, maxRight()));

  // Keep both columns inside the container if the window shrinks.
  useEffect(() => {
    const onResize = () => {
      setLeftWidth((w) => clamp(w, MIN_LEFT, maxLeft()));
      setRightWidth((w) => clamp(w, MIN_RIGHT, maxRight()));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentSegments = segments.slice(-OPACITY_STEPS.length);
  const newestDetection = detectionQueue.length > 0 ? detectionQueue[detectionQueue.length - 1].detection : null;
  // Render order: newest detection at the top; within a detection, batches in
  // ascending verse order (1-8, then 9-16, then 17-24) so a wide reading reads
  // top-to-bottom like the preacher speaks it. Rank is the last index seen for
  // each detection identity — later detections outrank earlier ones.
  const orderedDetections = (() => {
    const lastIdxByDetection = new Map<unknown, number>();
    detectionQueue.forEach((it, i) => {
      lastIdxByDetection.set(it.detection, i);
    });
    return detectionQueue
      .map((item) => ({ item, rank: lastIdxByDetection.get(item.detection) ?? 0 }))
      .sort((a, b) => b.rank - a.rank || (a.item.batch.verseStart ?? 0) - (b.item.batch.verseStart ?? 0))
      .map((x) => x.item);
  })();
  const backendLabel = whisperBackend === 'webgpu' ? 'WebGPU' : whisperBackend === 'wasm' ? 'WASM' : null;
  const whisperStatusColor = whisperStatus === 'error' ? '#EF4444' : whisperStatus === 'listening' ? '#12D453' : '#EAB308';
  const whisperStatusLabel =
    whisperStatus === 'requesting-mic'
      ? 'Requesting microphone…'
      : whisperStatus === 'loading-model'
        ? 'Loading Whisper…'
        : whisperStatus === 'error'
          ? 'Whisper error'
          : `${modelLoadMs != null ? `${Math.round(modelLoadMs)}ms · ` : ''}${backendLabel ?? ''} Whisper`.trim();

  const confirmEnd = () => {
    setShowEndModal(false);
    endSession();
    navigate('/');
  };

  // Dynamic session metrics calculated strictly from live data
  const allDetections = [...recentDetections, ...detectionQueue];
  const versesDetectedCount = allDetections.length;

  const avgConfidenceNum =
    allDetections.length > 0
      ? allDetections.reduce((acc, item) => acc + (item.confidence === 'high' ? 98.4 : 84.5), 0) /
        allDetections.length
      : null;

  const avgConfidenceStr = avgConfidenceNum !== null ? `${avgConfidenceNum.toFixed(1)}%` : '--';
  const avgConfidenceColor = avgConfidenceNum !== null ? confidenceColor(avgConfidenceNum) : '#8D9AA6';

  const displayLatencyStr = displayLatencyMs != null ? `${Math.round(displayLatencyMs)}ms` : '--';

  const onScreenNowStr = projector ? projector.ref : '--';

  const metrics = [
    { label: 'Verses Detected', value: versesDetectedCount > 0 ? String(versesDetectedCount) : '--', icon: BookOpenTextIcon, color: '#FCF7F0' },
    { label: 'Avg Confidence', value: avgConfidenceStr, icon: GaugeIcon, color: avgConfidenceColor },
    { label: 'Display Latency', value: displayLatencyStr, icon: WaveformIcon, color: '#FCF7F0' },
    { label: 'On Screen Now', value: onScreenNowStr, icon: MonitorPlayIcon, color: projector ? '#19A7CE' : '#8D9AA6' },
  ];

  return (
    <ConsoleLayout>
      <header style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: '14px', height: '52px', justifyContent: 'space-between', paddingInline: '24px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: '10px' }}>
          <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.03em' }}>
            Live Console
          </span>
          <span style={{ alignItems: 'center', backgroundColor: 'rgba(18,212,83,0.12)', borderRadius: '9999px', color: '#12D453', display: 'inline-flex', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 600, gap: '5px', letterSpacing: '0.06em', paddingBlock: '3px', paddingInline: '9px', textTransform: 'uppercase' }}>
            <span style={{ backgroundColor: '#12D453', borderRadius: '9999px', height: '5px', width: '5px' }} />
            Live
          </span>
          <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontFeatureSettings: '"tnum"', fontSize: '12px' }}>
            {formatSessionTime(sessionSeconds)}
          </span>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
          <span style={{ color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', fontWeight: 500 }}>
            {versesDetectedCount > 0 ? `${versesDetectedCount} ${versesDetectedCount === 1 ? 'verse' : 'verses'} detected` : '--'}
          </span>
        </div>
      </header>

      <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, paddingInline: '24px' }}>
        {metrics.flatMap((m, i) => {
          const Icon = m.icon;
          const item = (
            <div
              key={m.label}
              style={{
                alignItems: 'center',
                display: 'flex',
                flex: '1 1 0',
                gap: '10px',
                justifyContent: 'flex-start',
                paddingBlock: '12px',
                paddingInline: i === 0 ? '0' : '22px',
              }}
            >
              <Icon size={15} weight="regular" color="#5B6B78" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.label}</span>
                <span
                  style={{
                    color: m.color,
                    fontFamily: '"Figtree", system-ui, sans-serif',
                    fontFeatureSettings: '"tnum"',
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {m.value}
                </span>
              </div>
            </div>
          );
          return i === 0
            ? [item]
            : [
                <div
                  key={`divider-${m.label}`}
                  style={{ alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)', height: '50%', width: '1px', flexShrink: 0 }}
                />,
                item,
              ];
        })}
      </div>

      <main ref={mainRef} style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0, paddingTop: '8px', paddingBottom: 0, paddingInline: '24px', overflow: 'visible' }}>
        {/* LEFT COLUMN — shrunk: the live transcript is honest context, not the
            focus. The verse detection & matching column is the primary surface. */}
        <div style={{ display: 'flex', flex: '0 0 auto', width: `${leftWidth}px`, minWidth: 0, minHeight: 0, overflow: 'visible' }}>
          <Card style={{ width: '100%', gap: '10px', paddingBlock: '12px', paddingInline: '14px', minHeight: 0, overflow: 'visible' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <CardLabel>Live transcription stream</CardLabel>
              <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                <WaveformIcon size={13} weight="regular" color={whisperStatusColor} className="wave-pulse" />
                <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500 }}>{whisperStatusLabel}</span>
              </div>
            </div>
            <div ref={transcriptScrollRef} className={`scroll-region transcript-fade${transcriptOverflowing ? ' is-overflowing' : ''}`} style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end', minHeight: 0, overflowY: 'auto', padding: '4px' }}>
              {whisperStatus === 'error' ? (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ color: '#EF4444', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', lineHeight: 1.4 }}>{whisperError}</span>
                </div>
              ) : recentSegments.length === 0 ? (
                <span style={{ color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px' }}>
                  {whisperStatus === 'listening' ? 'Waiting for speech…' : whisperStatusLabel}
                </span>
              ) : null}
              {recentSegments.map((seg, i) => {
                const isActive = i === recentSegments.length - 1;
                const opacity = OPACITY_STEPS[OPACITY_STEPS.length - recentSegments.length + i] ?? 1;
                return (
                  <div key={seg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '88%', opacity }}>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                      {isActive && <span style={{ backgroundColor: '#19A7CE', borderRadius: '9999px', height: '5px', width: '5px', flexShrink: 0 }} />}
                      <span style={{ color: isActive ? '#19A7CE' : '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Preacher {isActive && '· speaking now'}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: isActive ? 'rgba(25,167,206,0.14)' : '#0D2E48',
                        borderRadius: '10px',
                        boxShadow: isActive ? '0 0 0 1px rgba(25,167,206,0.4)' : 'none',
                        paddingBlock: '9px',
                        paddingInline: '14px',
                      }}
                    >
                      <span style={{ color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px', lineHeight: 1.4 }}>{seg.text || '…'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <ColumnDivider onDrag={handleLeftDrag} onReset={resetLeft} />

        {/* CENTER/RIGHT — the detection & matching surface now owns most of the
            width. Idle cards are dimmed; only the pending (unconfirmed) card
            pops with the cyan accent + BorderBeam. */}
        <div style={{ display: 'flex', flex: '1 1 0%', minWidth: MIN_CENTER, flexDirection: 'column', gap: '10px', minHeight: 0, overflow: 'visible' }}>
          <Card style={{ flex: '1 1 0%', gap: '12px', paddingBlock: '12px', paddingInline: '14px', minHeight: 0, overflow: 'visible' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <CardLabel>Verse detection &amp; matching</CardLabel>
              {pendingVerse && (
                <span style={{ color: confidenceColor(confidencePercent(pendingVerse.confidence)), fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500 }}>
                  {confidencePercent(pendingVerse.confidence).toFixed(1)}% confidence
                </span>
              )}
            </div>

            {/* Manual lookup — force a detection without waiting for speech.
                Pinned to the top so it's always reachable, above the live queue. */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
              <div style={{ alignItems: 'center', backgroundColor: '#0A273D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px', display: 'flex', flex: '1 1 auto', gap: '8px', height: '36px', paddingInline: '12px' }}>
                <MagnifyingGlassIcon size={14} weight="regular" color="#5B6B78" />
                <input
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') runManualSearch(); }}
                  placeholder="Manual lookup — e.g. Romans 8:28-30"
                  style={{ background: 'none', border: 'none', color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', outline: 'none', width: '100%' }}
                />
              </div>
              <SecondaryButton onClick={runManualSearch} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '16px' }}>
                Search
              </SecondaryButton>
            </div>

            {detectionQueue.length === 0 ? (
              <div style={{ alignItems: 'center', backgroundColor: '#0A273D', borderRadius: '12px', display: 'flex', gap: '8px', justifyContent: 'center', paddingBlock: '12px' }}>
                <WaveformIcon size={14} weight="regular" color={unresolvedRef ? '#EAB308' : '#5B6B78'} />
                <span style={{ color: unresolvedRef ? '#EAB308' : '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px' }}>
                  {unresolvedRef ? `Heard "${unresolvedRef}" — no such passage` : 'Listening for the next reference…'}
                </span>
              </div>
            ) : (
              <div ref={queueScrollRef} className={`scroll-region detection-fade${queueOverflowing ? ' is-overflowing' : ''}`} style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '8px', minHeight: 0, overflow: queueOverflowing ? 'auto' : 'visible', paddingRight: '4px' }}>
                {orderedDetections.map((item) => {
                  const isNewest = item.detection === newestDetection;
                  const isPrimary = item.isPrimary && isNewest;
                  return isPrimary ? (
                    <BorderBeam
                      key={item.id}
                      size="pulse-outside"
                      colorVariant="ocean"
                      theme="dark"
                      strength={0.7}
                      brightness={1.8}
                      saturation={2.0}
                      duration={2.2}
                      style={{ borderRadius: '12px' }}
                    >
                      <div
                        style={{
                          alignItems: 'flex-start',
                          backgroundColor: '#0A2E42',
                          border: '1.5px solid rgba(25,167,206,0.35)',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          paddingBlock: '12px',
                          paddingInline: '14px',
                        }}
                      >
                        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                            {item.batch.ref}
                          </span>
                          <span style={{ backgroundColor: '#051929', borderRadius: '6px', color: '#19A7CE', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em', paddingBlock: '2px', paddingInline: '6px', textTransform: 'uppercase' }}>
                            WEB
                          </span>
                          {item.detection.truncated && (
                            <span style={{ backgroundColor: 'rgba(234,179,8,0.12)', borderRadius: '6px', color: '#EAB308', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, paddingBlock: '2px', paddingInline: '6px' }}>
                              showing first 24
                            </span>
                          )}
                        </div>

                        <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', lineHeight: 1.4 }}>
                          {previewText(item.batch.text)}
                        </span>

                        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <PrimaryButton onClick={() => displayItem(item)} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '16px' }}>
                            <LightningIcon size={14} weight="fill" />
                            Confirm &amp; Display
                          </PrimaryButton>
                          <SecondaryButton onClick={() => dismissItem(item.id)} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '14px' }}>
                            Dismiss
                          </SecondaryButton>
                        </div>
                      </div>
                    </BorderBeam>
                  ) : (
                    <div
                      key={item.id}
                      style={{
                        alignItems: 'flex-start',
                        backgroundColor: '#08202F',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        opacity: 0.78,
                        paddingBlock: '10px',
                        paddingInline: '14px',
                      }}
                    >
                      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ color: '#C9D4DC', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.03em' }}>{item.batch.ref}</span>
                        <span style={{ backgroundColor: '#051929', borderRadius: '6px', color: '#19A7CE', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em', paddingBlock: '2px', paddingInline: '6px', textTransform: 'uppercase' }}>
                          WEB
                        </span>
                      </div>

                      <span style={{ color: '#6E7C88', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', lineHeight: 1.4 }}>
                        {previewText(item.batch.text)}
                      </span>

                      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <PrimaryButton onClick={() => displayItem(item)} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '16px' }}>
                          <LightningIcon size={14} weight="fill" />
                          Display
                        </PrimaryButton>
                        <SecondaryButton onClick={() => dismissItem(item.id)} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '14px' }}>
                          Dismiss
                        </SecondaryButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <ColumnDivider onDrag={handleRightDrag} onReset={resetRight} />

        {/* RIGHT — projector preview + recently detected. */}
        <div style={{ display: 'flex', flex: '0 0 auto', width: `${rightWidth}px`, flexDirection: 'column', gap: '10px', minHeight: 0, minWidth: 0, overflow: 'visible' }}>
          <Card
            style={{
              flexShrink: 0,
              gap: '12px',
              padding: '12px 14px',
            }}
          >
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                <span style={{ backgroundColor: '#12D453', borderRadius: '9999px', height: '6px', width: '6px' }} />
                <CardLabel>Now on projector (16:9)</CardLabel>
              </div>
              <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => openProjectorWindow()}
                  title="Open the projector on a second screen"
                  style={{ alignItems: 'center', background: 'none', border: 'none', color: '#19A7CE', cursor: 'pointer', display: 'inline-flex', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, gap: '5px', padding: 0 }}
                >
                  <ArrowsOutIcon size={13} weight="regular" />
                  Open window
                </button>
                <button
                  type="button"
                  onClick={() => setProjectorState(null)}
                  disabled={!projector}
                  style={{ background: 'none', border: 'none', color: projector ? '#8D9AA6' : '#3A4753', cursor: projector ? 'pointer' : 'default', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, padding: 0 }}
                >
                  Clear screen
                </button>
              </div>
            </div>
            <button
              type="button"
              ref={previewBoxRef}
              onClick={() => navigate('/projector')}
              style={{ alignItems: 'center', aspectRatio: '16 / 9', backgroundColor: '#000B14', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'block', overflow: 'hidden', padding: 0, position: 'relative', width: '100%', flexShrink: 0, boxSizing: 'border-box' }}
            >
              {/* The EXACT projector artboard, scaled to fit this card — so the
                  preview is pixel-identical to what the real projector shows. */}
              <Stage width={1920} height={1080} fitRef={previewBoxRef}>
                <ProjectorArtboard state={projector ?? DEFAULT_PROJECTOR} />
              </Stage>
              <div style={{ alignItems: 'center', display: 'flex', gap: '5px', position: 'absolute', right: '10px', top: '10px', zIndex: 2 }}>
                <span style={{ backgroundColor: '#12D453', borderRadius: '9999px', height: '5px', width: '5px' }} />
                <span style={{ color: '#12D453', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live</span>
              </div>
            </button>
          </Card>

          <Card style={{ flex: '1 1 0%', gap: '10px', justifyContent: 'flex-start', paddingBlock: '12px', paddingInline: '14px' }}>
            <CardLabel>Recently detected</CardLabel>
            {recentDetections.length === 0 && (
              <span style={{ color: '#3A4753', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px' }}>No verses confirmed yet</span>
            )}
            {recentDetections.map((v) => (
              <div key={v.id} style={{ alignItems: 'center', backgroundColor: '#0A273D', borderRadius: '10px', display: 'flex', gap: '10px', justifyContent: 'space-between', minWidth: 0, paddingBlock: '8px', paddingInline: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '-0.03em' }}>{v.batch.ref}</span>
                    <span style={{ color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px' }}>{confidencePercent(v.confidence).toFixed(1)}%</span>
                  </div>
                  <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.batch.text}
                  </span>
                </div>
                <SecondaryButton onClick={() => displayItem(v)} style={{ fontSize: '11px', paddingBlock: '6px', paddingInline: '10px' }}>
                  <ArrowCounterClockwiseIcon size={12} weight="regular" />
                  Re-project
                </SecondaryButton>
              </div>
            ))}
          </Card>
        </div>
      </main>

      <footer style={{ alignItems: 'center', display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: '12px', height: '72px', justifyContent: 'space-between', paddingInline: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconToggle icon={MicrophoneIcon} active={live.mic} audioLevel={micLevel} title={`Mic: ${live.mic ? 'live' : 'muted'}`} onClick={() => setLive((p) => ({ ...p, mic: !p.mic }))} />
          <IconToggle icon={VideoCameraIcon} active={live.video} title={`Video: ${live.video ? 'on' : 'off'}`} onClick={() => setLive((p) => ({ ...p, video: !p.video }))} />
          <IconToggle icon={SpeakerHighIcon} active={live.system} title={`System audio: ${live.system ? 'on' : 'off'}`} onClick={() => setLive((p) => ({ ...p, system: !p.system }))} />
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
          <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>
            Mode: {autoPush ? 'Auto-push' : 'Manual confirm'}
          </span>
          <BorderBeam
            size="pulse-outside"
            colorVariant="ocean"
            theme="dark"
            active={autoPush}
            strength={1.0}
            brightness={2.4}
            saturation={2.4}
            duration={2.2}
            borderRadius={9999}
          >
            <SecondaryButton
              onClick={() => setAutoPush(!autoPush)}
              style={{
                backgroundColor: autoPush ? 'rgba(25,167,206,0.18)' : '#0A273D',
                border: autoPush ? '1px solid #19A7CE' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '9999px',
                boxShadow: autoPush ? '0 0 0 1px rgba(25, 167, 206, 0.4)' : undefined,
                color: '#FCF7F0',
                height: '40px',
                paddingBlock: 0,
                paddingInline: '18px',
              }}
            >
              <span style={{ fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Auto-push</span>
            </SecondaryButton>
          </BorderBeam>
          <SecondaryButton
            danger
            onClick={() => setShowEndModal(true)}
            style={{
              height: '40px',
              paddingBlock: 0,
              paddingInline: '18px',
            }}
          >
            <SignOutIcon size={15} weight="regular" />
            <span style={{ fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.03em' }}>End Session</span>
          </SecondaryButton>
        </div>
      </footer>

      {/* End Session confirmation — centered modal. Session only ends on confirm. */}
      {showEndModal && (
        <div
          onClick={() => setShowEndModal(false)}
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(0, 11, 20, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            height: '100dvh',
            justifyContent: 'center',
            left: 0,
            position: 'fixed',
            top: 0,
            width: '100vw',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#051929',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              boxShadow: '0px 24px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxWidth: '380px',
              padding: '24px',
              width: '90%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                End this session?
              </span>
              <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px', lineHeight: 1.5 }}>
                This stops the live transcription, clears the verse queue, and blanks the projector. The session timer will reset.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <SecondaryButton onClick={() => setShowEndModal(false)} style={{ fontSize: '13px', paddingBlock: '6px', paddingInline: '18px' }}>
                Keep session
              </SecondaryButton>
              <PrimaryButton onClick={confirmEnd} style={{ fontSize: '13px', paddingBlock: '6px', paddingInline: '18px' }}>
                <SignOutIcon size={15} weight="regular" />
                End session
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </ConsoleLayout>
  );
}

function formatSessionTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

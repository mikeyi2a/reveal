import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { BorderBeam } from 'border-beam';
import { SignOutIcon, MicrophoneIcon, VideoCameraIcon, SpeakerHighIcon, BookOpenTextIcon, GaugeIcon, WaveformIcon, MonitorPlayIcon, CaretDownIcon } from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';

import { DEFAULT_PROJECTOR } from '../components/ProjectorArtboard';
import { useRevealSession, type QueuedVerse, type VerseDetectionQueueItem } from '../session/RevealSessionProvider';
import Sidebar, { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '../components/Sidebar';
import { openProjectorWindow } from '../lib/revealStore';
import type { Confidence, DetectedReference } from '../lib/referenceScanner';
import {
  FADER_FILL,
  FADER_READOUT,
  FADER_THUMB,
  FADER_TRACK,
  FONT_MONO,
  FONT_UI,
  FX_CELL_ARMED,
  FX_CELL_OFF,
  FX_LAMP_DARK,
  FX_LAMP_LIT,
  INPUT_WELL,
  SCREEN_GLOSS,
  SCREEN_HOUSING,
  SCREEN_INSET,
  SCREEN_PHOSPHOR,
  SCREEN_VERSE_FG,
  SCREEN_VIGNETTE,
  SECONDARY_RIM_LIT,
  SWITCHER_LIT,
  SWITCHER_LIT_EDGE,
  SWITCHER_PANEL,
  SWITCHER_PANEL_FG,
  SWITCHER_PANEL_SELECTED_BG,
  SWITCHER_PANEL_SELECTED_FG,
  type ControlState,
} from '../lib/groove';

const OPACITY_STEPS = [0.35, 0.55, 0.8, 1];

/**
 * Breathing room for the primary card's BorderBeam glow. A scrolling box always
 * clips at its scrollport — `overflow-y: auto` forces `overflow-x: auto` (CSS
 * spec) — so the glow can only survive as padding *inside* the scroller, with
 * an equal negative margin on the wrapper so the cards still sit flush with the
 * lookup row above. See AGENTS.md rule 1.
 *
 * These are sized to the beam's *core* glow only (`::before`, inset -10px
 * scaled, + 3px blur ≈ 10px). The outer `[data-beam-bloom]` layer is disabled
 * on this card — at inset -30px scaled 0.9 it bleeds 19px before its 22.5px
 * blur even starts, which no gutter can hold without overlapping the Detection
 * Tuning card 16px below. See BEAM_GLOW_TIGHT.
 */
const QUEUE_BLEED_X = 16;
const QUEUE_BLEED_Y = 12;

/**
 * Height of the bottom fade, and the scroll-end room reserved beneath the last
 * card. Without the reserved space the final card sits permanently under the
 * gradient and can never be read in full; with it, scrolling to the bottom
 * parks that card just above the fade. Mirrored into CSS as --queue-fade so the
 * mask and the padding can't drift apart.
 */
const QUEUE_FADE = 28;

/**
 * Keeps the beam to its animated stroke plus a tight core halo. Without this
 * the bloom layer is clipped by the queue scrollport on the top and sides.
 */
const BEAM_GLOW_TIGHT = { '--beam-bloom-opacity': 0 } as CSSProperties;

const c = {
  app: '#09090B',
  rail: '#0C0C0E',
  card: '#141417',
  cardAlt: '#141416',
  fill: '#1C1C20',
  black: '#0A0A0B',
  text: '#F5F5F4',
  textSoft: '#C7C7CC',
  muted: '#8A8A91',
  quiet: '#6B6B72',
  dim: '#5B5B62',
  steel: '#5B6B78',
  accent: '#19A7CE',
  success: '#12D453',
  danger: '#F87171',
};

function confidenceColor(pct: number): string {
  if (pct >= 95) return c.success;
  if (pct >= 85) return '#22C55E';
  if (pct >= 70) return '#EAB308';
  return '#EF4444';
}

function confidencePercent(value: Confidence): number {
  if (value === 'manual') return 100;
  return value === 'high' ? 98.4 : 84.5;
}

function previewText(text: string): string {
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}

function formatSessionTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function refLabel(ref: DetectedReference): string {
  const verses =
    ref.verseStart != null
      ? `:${ref.verseStart}${ref.verseEnd != null && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ''}`
      : '';
  return `${ref.book} ${ref.chapter}${verses}`;
}

function Card({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: c.card,
        borderRadius: '12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        color: c.muted,
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        lineHeight: '14px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

/**
 * Primary · G3 edge-lit. FROZEN (AGENTS.md rule 2) — these values and the
 * 36px block height are not to be re-tuned without an explicit ask.
 */
const PRIMARY_EDGE_LIT: Record<ControlState, CSSProperties> = {
  rest: {
    backgroundImage:
      'linear-gradient(in oklab 180deg, oklab(63.2% -0.082 -0.078) 0%, oklab(48.3% -0.062 -0.063) 62%, oklab(55.8% -0.073 -0.069) 100%)',
    boxShadow:
      '#FFFFFFBF 0px 1.5px 0px inset, #FFFFFF2E 0px -1px 0px inset, #7DE8FF4D 0px -7px 9px -5px inset, #0000009E 0px 4px 9px -3px, #0A5A73 0px 0px 0px 1px',
    color: '#04212C',
  },
  hover: {
    backgroundImage:
      'linear-gradient(in oklab 180deg, oklab(67.5% -0.087 -0.081) 0%, oklab(52.3% -0.069 -0.064) 62%, oklab(60.3% -0.081 -0.069) 100%)',
    boxShadow:
      '#FFFFFFD9 0px 1.5px 0px inset, #FFFFFF38 0px -1px 0px inset, #7DE8FF61 0px -7px 9px -5px inset, #0000009E 0px 6px 13px -3px, #0B6178 0px 0px 0px 1px',
    color: '#04212C',
  },
  pressed: {
    backgroundImage:
      'linear-gradient(in oklab 180deg, oklab(43.6% -0.056 -0.058) 0%, oklab(51.8% -0.067 -0.067) 70%, oklab(57.6% -0.079 -0.059) 100%)',
    boxShadow:
      '#00121CAD 0px 3px 5px inset, #FFFFFF1F 0px -0.5px 0px inset, #7DE8FF33 0px -5px 7px -5px inset, #084F66 0px 0px 0px 1px',
    color: '#04212C',
  },
  disabled: {
    backgroundImage:
      'linear-gradient(in oklab 180deg, oklab(27.9% -0.015 -0.020) 0%, oklab(24.7% -0.014 -0.018) 100%)',
    boxShadow: '#FFFFFF0F 0px 0.5px 0px inset, #16222A 0px 0px 0px 1px',
    color: '#5B6B78',
    opacity: 0.6,
  },
};

function ActionButton({
  children,
  onClick,
  variant = 'secondary',
  style,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger';
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const state: ControlState = disabled ? 'disabled' : isPressed ? 'pressed' : isHovered ? 'hover' : 'rest';

  const baseByVariant: Record<NonNullable<typeof variant>, CSSProperties> = {
    primary: {
      ...PRIMARY_EDGE_LIT[state],
      fontFamily: FONT_UI,
      fontSize: '13px',
      fontWeight: 600,
      paddingBlock: '10px',
      paddingInline: '20px',
    },
    // Secondary is one material in every slot (Dismiss / Stage / Search /
    // Display). Its disabled look is a full recipe, so it opts out of the
    // generic dimming below rather than stacking two dim treatments.
    secondary: {
      ...SECONDARY_RIM_LIT[state],
      height: '36px',
      opacity: 1,
      paddingInline: '16px',
    },
    accent: {
      backgroundColor: '#19A7CE29',
      boxShadow: `inset 0 0 0 0.5px ${c.accent}`,
      color: c.accent,
      fontWeight: 600,
      height: '36px',
      paddingInline: '16px',
    },
    danger: {
      backgroundColor: '#EF44441F',
      color: c.danger,
      height: '36px',
      paddingInline: '18px',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        alignItems: 'center',
        border: 'none',
        borderRadius: '9999px',
        boxSizing: 'border-box',
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: FONT_UI,
        fontSize: '12px',
        fontWeight: 500,
        gap: '6px',
        justifyContent: 'center',
        lineHeight: '16px',
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        ...baseByVariant[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function FooterToggle({ active, title, onClick, audioLevel, icon: Icon }: { active: boolean; title: string; onClick: () => void; audioLevel?: React.MutableRefObject<number>; icon?: React.ComponentType<IconProps> }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioLevel || !active) return;
    let raf = 0;
    const tick = () => {
      if (fillRef.current) fillRef.current.style.height = `${Math.min(100, Math.max(0, Math.round(audioLevel.current * 280)))}%`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, audioLevel]);

  // 01 · OPERATE — same lit/seated pair as the translation switcher and the
  // auto-push cell: on is the lit cyan cap, off sits recessed in its housing.
  // The material carries the state, so no beam is needed on top of it.
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={title}
      title={title}
      onClick={onClick}
      style={{
        ...(active ? SWITCHER_LIT : FX_CELL_OFF),
        alignItems: 'center',
        border: 'none',
        borderRadius: '9999px',
        boxSizing: 'border-box',
        display: 'flex',
        flexShrink: 0,
        height: '38px',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        position: 'relative',
        transition: 'box-shadow 0.18s ease, background-image 0.18s ease',
        width: '38px',
      }}
    >
      {audioLevel && active && (
        <span
          ref={fillRef}
          style={{
            // Reads as level rising *through* the lit cap — a cyan fill would
            // disappear against the cyan gradient underneath.
            backgroundColor: 'rgba(233, 250, 255, 0.30)',
            bottom: 0,
            height: '0%',
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            transition: 'height 0.04s ease-out',
            width: '100%',
          }}
        />
      )}
      {Icon && (
        <Icon
          size={18}
          weight={active ? 'fill' : 'regular'}
          color={active ? '#CFEEFF' : '#79818B'}
          style={{ position: 'relative', zIndex: 1 }}
        />
      )}
    </button>
  );
}

/**
 * Auto-push mode cell. The only retrofit that adds meaning rather than texture:
 * cyan across the console means "you confirmed it", amber means the system is
 * armed and will push without you. That distinction has to be legible from the
 * back of a room, which is why armed carries a real glow and not a hairline.
 * Amber is deliberately the one non-cyan accent in the console.
 */
function AutoPushCell({ armed, onClick }: { armed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={armed}
      onClick={onClick}
      style={{
        ...(armed ? FX_CELL_ARMED : FX_CELL_OFF),
        alignItems: 'center',
        border: 'none',
        borderRadius: '9999px',
        boxSizing: 'border-box',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: FONT_MONO,
        fontSize: '11.5px',
        fontWeight: armed ? 700 : 500,
        gap: '9px',
        height: '38px',
        letterSpacing: '0.08em',
        lineHeight: '14px',
        paddingInline: '20px',
        transition: 'box-shadow 0.18s ease, background-image 0.18s ease, color 0.18s ease',
      }}
    >
      <span aria-hidden style={armed ? FX_LAMP_LIT : FX_LAMP_DARK} />
      AUTO-PUSH
    </button>
  );
}

function Metric({ label, value, active, color, icon: Icon }: { label: string; value: string; active?: boolean; color?: string; icon?: React.ComponentType<IconProps> }) {
  return (
    <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flex: '1 1 0', gap: '10px', paddingBlock: '6px', paddingInline: label === 'Verses detected' ? 0 : '22px' }}>
      {Icon && <Icon size={18} weight={active ? 'fill' : 'regular'} color={active ? c.accent : c.steel} style={{ flexShrink: 0 }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <span style={{ color: c.muted, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', lineHeight: '14px', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ color: color ?? c.text, fontFamily: '"Figtree", system-ui, sans-serif', fontFeatureSettings: '"tnum"', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: '28px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/**
 * Only the WEB text ships with the app (`data/web-bible.json`), so the other
 * translations are listed but not selectable — a switcher that silently failed
 * to switch would be worse than one that shows what is coming.
 */
const TRANSLATIONS = [
  { id: 'WEB', available: true },
  { id: 'NIV', available: false },
  { id: 'KJV', available: false },
] as const;

/**
 * Translation switcher — 01 · OPERATE. The pill is a fixed size whether open
 * or closed; the option panel is a fully detached floating card below it
 * (own radius, own cast shadow, small gap) rather than a shell fused to the
 * button — merging the two made the open state feel like the control itself
 * was changing shape.
 */
function TranslationSwitcher() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 20 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...SWITCHER_LIT,
          alignItems: 'center',
          border: 'none',
          borderRadius: '9999px',
          boxSizing: 'border-box',
          display: 'inline-flex',
          flexShrink: 0,
          fontFamily: FONT_MONO,
          fontSize: '11px',
          fontWeight: 600,
          gap: '9px',
          height: '38px',
          justifyContent: 'center',
          lineHeight: '14px',
          paddingInline: '13px',
        }}
      >
        WEB
        <CaretDownIcon size={9} weight="bold" color={SWITCHER_LIT_EDGE} style={{ rotate: open ? '180deg' : '0deg' }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            ...SWITCHER_PANEL,
            borderRadius: '12px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            left: 0,
            minWidth: '112px',
            padding: '6px',
            position: 'absolute',
            top: 'calc(100% + 6px)',
          }}
        >
          {TRANSLATIONS.map((t) => {
            const selected = t.id === 'WEB';
            return (
              <div
                key={t.id}
                role="option"
                aria-selected={selected}
                aria-disabled={!t.available}
                title={t.available ? undefined : 'Not bundled yet — WEB only'}
                style={{
                  alignItems: 'center',
                  backgroundColor: selected ? SWITCHER_PANEL_SELECTED_BG : 'transparent',
                  borderRadius: '8px',
                  color: selected ? SWITCHER_PANEL_SELECTED_FG : SWITCHER_PANEL_FG,
                  cursor: t.available ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  flexShrink: 0,
                  fontFamily: FONT_MONO,
                  fontSize: '12px',
                  fontWeight: selected ? 600 : 500,
                  height: '30px',
                  justifyContent: 'space-between',
                  lineHeight: '16px',
                  opacity: t.available ? 1 : 0.55,
                  paddingInline: '10px',
                }}
              >
                {t.id}
                {selected && (
                  <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden style={{ flexShrink: 0 }}>
                    <path d="M1 4.5L4 7.5L10 1.5" fill="none" stroke={SWITCHER_PANEL_SELECTED_FG} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VerseBadge() {
  return (
    <span style={{ backgroundColor: '#0D0D0F', borderRadius: '6px', color: c.accent, fontFamily: FONT_MONO, fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em', lineHeight: '12px', paddingBlock: '2px', paddingInline: '6px' }}>
      WEB
    </span>
  );
}

function VerseCard({
  item,
  primary,
  onDisplay,
  onDismiss,
  onStage,
}: {
  item: VerseDetectionQueueItem;
  primary: boolean;
  onDisplay: () => void;
  onDismiss: () => void;
  onStage: () => void;
}) {
  const body = (
    <div
      style={{
        alignSelf: 'stretch',
        backgroundColor: primary ? '#19A7CE1A' : c.fill,
        borderRadius: '12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        gap: '12px',
        minHeight: '158px',
        overflow: 'clip',
        paddingBlock: '18px',
        paddingInline: '16px',
        position: 'relative',
      }}
    >
      {primary && (
        <div
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle farthest-corner at 50% 50% in oklab, oklab(67.7% -0.089 -0.083 / 20%) 0%, oklab(67.7% -0.089 -0.083 / 6%) 45%, oklab(19.3% 0.002 -0.006 / 0%) 72%)',
            height: '380px',
            left: '50%',
            pointerEvents: 'none',
            position: 'absolute',
            top: '20%',
            transform: 'translate(-50%, -50%)',
            width: '380px',
          }}
        />
      )}
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px', position: 'relative' }}>
        <span style={{ color: c.text, fontFamily: '"Figtree", system-ui, sans-serif', fontSize: primary ? '26px' : '20px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: primary ? '30px' : '24px' }}>
          {item.batch.ref}
        </span>
        <VerseBadge />
        {item.detection.truncated && (
          <span style={{ backgroundColor: 'rgba(234,179,8,0.12)', borderRadius: '6px', color: '#EAB308', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, lineHeight: '12px', paddingBlock: '2px', paddingInline: '6px' }}>
            showing first 24
          </span>
        )}
      </div>
      <span style={{ color: '#B4B4BA', display: '-webkit-box', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', lineHeight: '150%', overflow: 'hidden', position: 'relative', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
        {previewText(item.batch.text)}
      </span>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px', position: 'relative' }}>
        {primary ? (
          <ActionButton onClick={onDisplay} variant="primary" style={{ color: '#FFFFFF' }}>
            Confirm &amp; display
          </ActionButton>
        ) : (
          <ActionButton onClick={onDisplay} variant="accent">
            Display
          </ActionButton>
        )}
        <ActionButton onClick={onDismiss} variant="secondary">
          Dismiss
        </ActionButton>
        <ActionButton onClick={onStage} variant="secondary">
          Stage
        </ActionButton>
      </div>
    </div>
  );

  if (!primary) return body;

  return (
    <BorderBeam
      size="pulse-outside"
      colorVariant="ocean"
      theme="dark"
      strength={0.7}
      brightness={1.8}
      saturation={2.0}
      duration={2.2}
      style={{ ...BEAM_GLOW_TIGHT, borderRadius: '12px', flexShrink: 0 }}
    >
      {body}
    </BorderBeam>
  );
}

function SliderRow({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  currentVal,
  onChange,
}: {
  label: string;
  value: string;
  min?: number;
  max?: number;
  step?: number;
  currentVal: number;
  onChange: (val: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));

  // 01 · OPERATE — recessed track, lit fill, raised beveled thumb. The value is
  // readable from the light as well as the number. The real <input type="range">
  // sits transparent on top so keyboard and pointer behaviour stay native.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#C4CBD3', fontFamily: FONT_UI, fontSize: '11.5px', lineHeight: '16px' }}>{label}</span>
        <span style={FADER_READOUT}>{value}</span>
      </div>
      <div style={{ ...FADER_TRACK, position: 'relative', width: '100%' }}>
        <div style={{ ...FADER_FILL, height: '8px', left: 0, position: 'absolute', top: 0, width: `${pct}%` }} />
        <span
          aria-hidden
          style={{
            ...FADER_THUMB,
            left: `${pct}%`,
            pointerEvents: 'none',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            cursor: 'pointer',
            height: '20px',
            left: 0,
            margin: 0,
            opacity: 0,
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
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
    belowThresholdRef,
    autoPush,
    setAutoPush,
    confidenceThreshold,
    setConfidenceThreshold,
    autoPushDelay,
    setAutoPushDelay,
    sensitivity,
    setSensitivity,
    live,
    setLive,
    projector,
    manualQuery,
    setManualQuery,
    displayItem,
    dismissItem,
    runManualSearch,
    pendingVerse,
    displayLatencyMs,
    endSession,
    serviceQueue,
    stageVerse,
    dismissQueuedVerse,
    displayQueuedVerse,
    reorderQueuedVerse,
  } = session;

  const [showEndModal, setShowEndModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [queueTab, setQueueTab] = useState<'queue' | 'recent'>('queue');
  const [dragId, setDragId] = useState<string | null>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const queueContentRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const [queueOverflowing, setQueueOverflowing] = useState(false);
  const [transcriptOverflowing, setTranscriptOverflowing] = useState(false);

  useEffect(() => {
    const el = queueScrollRef.current;
    const content = queueContentRef.current;
    if (!el || !content) return;
    // Measure the cards' own laid-out height, NOT el.scrollHeight. The primary
    // card's BorderBeam renders a bloom element at `position:absolute;
    // inset:-30px`, and an absolutely-positioned descendant still counts toward
    // an ancestor's scrollable overflow — so a single card that fits perfectly
    // reported ~19px of overflow (its own glow) and painted a false fade.
    // The bloom overflows the content div without changing its height.
    // clientHeight includes the beam gutter and the reserved fade room, neither
    // of which is usable card space.
    const usable = () => el.clientHeight - (QUEUE_BLEED_Y * 2 + QUEUE_FADE);
    const measure = () => setQueueOverflowing(content.offsetHeight > usable() + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(content);
    return () => ro.disconnect();
  }, [detectionQueue, live.mic]);

  useEffect(() => {
    const el = transcriptScrollRef.current;
    if (!el) return;
    const measure = () => setTranscriptOverflowing(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [segments, live.mic, whisperStatus, whisperError]);

  const recentSegments = segments.slice(-OPACITY_STEPS.length);
  const orderedDetections = (() => {
    const lastIdxByDetection = new Map<unknown, number>();
    detectionQueue.forEach((it, i) => lastIdxByDetection.set(it.detection, i));
    return detectionQueue
      .map((item) => ({ item, rank: lastIdxByDetection.get(item.detection) ?? 0 }))
      .sort((a, b) => b.rank - a.rank || (a.item.batch.verseStart ?? 0) - (b.item.batch.verseStart ?? 0))
      .map((x) => x.item);
  })();

  const backendLabel = whisperBackend === 'webgpu' ? 'WebGPU' : whisperBackend === 'wasm' ? 'WASM' : null;
  const whisperStatusLabel =
    whisperStatus === 'requesting-mic'
      ? 'Requesting microphone...'
      : whisperStatus === 'loading-model'
        ? 'Loading Whisper...'
        : whisperStatus === 'error'
          ? 'Whisper error'
          : `${modelLoadMs != null ? `${Math.round(modelLoadMs)}ms · ` : ''}${backendLabel ?? ''} Whisper`.trim();

  const allDetections = [...recentDetections, ...detectionQueue];
  const versesDetectedCount = allDetections.length;
  const avgConfidenceNum =
    allDetections.length > 0
      ? allDetections.reduce((acc, item) => acc + (item.confidence === 'high' ? 98.4 : 84.5), 0) / allDetections.length
      : null;
  const avgConfidenceStr = avgConfidenceNum !== null ? `${avgConfidenceNum.toFixed(1)}%` : '--';
  const displayLatencyStr = displayLatencyMs != null ? `${Math.round(displayLatencyMs)}ms` : '--';
  const displayState = projector ?? DEFAULT_PROJECTOR;

  const stageDetected = (item: VerseDetectionQueueItem) => {
    stageVerse(
      {
        book: item.detection.book,
        chapter: item.detection.chapter,
        verseStart: item.detection.verseStart ?? undefined,
        verseEnd: item.detection.verseEnd ?? undefined,
      },
      { addedFrom: 'detection' },
    );
  };

  const confirmEnd = () => {
    setShowEndModal(false);
    endSession();
    navigate('/');
  };

  return (
    <div
      style={{
        backgroundColor: c.app,
        boxSizing: 'border-box',
        color: c.text,
        display: 'flex',
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: '12px',
        fontSynthesis: 'none',
        height: '100dvh',
        lineHeight: '16px',
        MozOsxFontSmoothing: 'grayscale',
        overflow: 'clip',
        WebkitFontSmoothing: 'antialiased',
        width: '100%',
      }}
    >
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      <div style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', height: '100%', marginLeft: `${sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}px`, minWidth: 0 }}>
        <header style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '52px', justifyContent: 'space-between', paddingInline: '32px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
            <span style={{ color: c.text, fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: '20px' }}>
              Live Console
            </span>
            <span style={{ alignItems: 'center', backgroundColor: '#12D4531F', borderRadius: '9999px', color: c.success, display: 'inline-flex', fontSize: '10px', fontWeight: 600, gap: '6px', letterSpacing: '0.06em', lineHeight: '12px', paddingBlock: '4px', paddingLeft: '8px', paddingRight: '10px', textTransform: 'uppercase' }}>
              <span style={{ backgroundColor: c.success, borderRadius: '9999px', height: '6px', width: '6px' }} />
              Live
            </span>
            <span style={{ color: c.muted, fontFamily: FONT_MONO, fontSize: '12px', lineHeight: '16px' }}>{formatSessionTime(sessionSeconds)}</span>
          </div>
          <span style={{ color: c.text, fontSize: '12px', fontWeight: 500, lineHeight: '16px' }}>
            {versesDetectedCount > 0 ? `${versesDetectedCount} ${versesDetectedCount === 1 ? 'verse' : 'verses'} detected` : '--'}
          </span>
        </header>

        <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, marginTop: '8px', paddingInline: '32px' }}>
          <Metric label="Verses detected" value={versesDetectedCount > 0 ? String(versesDetectedCount) : '--'} icon={BookOpenTextIcon} />
          <span style={{ alignSelf: 'center', backgroundColor: '#FFFFFF14', flexShrink: 0, height: '34px', width: '1px' }} />
          <Metric label="Avg confidence" value={avgConfidenceStr} color={avgConfidenceNum !== null ? confidenceColor(avgConfidenceNum) : c.text} icon={GaugeIcon} />
          <span style={{ alignSelf: 'center', backgroundColor: '#FFFFFF14', flexShrink: 0, height: '34px', width: '1px' }} />
          <Metric label="Display latency" value={displayLatencyStr} icon={WaveformIcon} />
          <span style={{ alignSelf: 'center', backgroundColor: '#FFFFFF14', flexShrink: 0, height: '34px', width: '1px' }} />
          <Metric label="On screen now" value={projector ? displayState.ref : '--'} active={!!projector} color={c.text} icon={MonitorPlayIcon} />
        </div>

        <main style={{ boxSizing: 'border-box', display: 'flex', flex: '1 1 0%', gap: '16px', margin: '8px 28px', minHeight: 0, overflow: 'hidden' }}>
          <Card style={{ flex: '0 0 400px', gap: '14px', minHeight: 0, paddingBottom: '12px', paddingInline: '12px', paddingTop: '16px', width: '400px' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <Label>Live transcription</Label>
              <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                <span style={{ backgroundColor: live.mic ? c.accent : '#EAB308', borderRadius: '9999px', height: '6px', width: '6px' }} />
                <span style={{ color: c.muted, fontSize: '11px', lineHeight: '14px' }}>{live.mic ? 'Listening' : 'Muted'}</span>
              </div>
            </div>
            <div className={`transcript-fade${transcriptOverflowing ? ' is-overflowing' : ''}`} style={{ display: 'flex', flex: '1 1 0%', minHeight: 0, overflow: 'visible' }}>
              <div ref={transcriptScrollRef} className="scroll-region" style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '10px', justifyContent: 'flex-end', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
                {!live.mic ? (
                  <div style={{ backgroundColor: 'rgba(234,179,8,0.08)', borderRadius: '10px', paddingBlock: '9px', paddingInline: '13px' }}>
                    <span style={{ color: '#EAB308', fontSize: '13px', lineHeight: '140%' }}>Microphone is muted. Use the footer control to resume detection.</span>
                  </div>
                ) : whisperStatus === 'error' ? (
                  <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '10px', paddingBlock: '9px', paddingInline: '13px' }}>
                    <span style={{ color: '#EF4444', fontSize: '13px', lineHeight: '140%' }}>{whisperError}</span>
                  </div>
                ) : recentSegments.length === 0 ? (
                  <span style={{ color: c.dim, fontSize: '12px' }}>{whisperStatus === 'listening' ? 'Waiting for speech...' : whisperStatusLabel}</span>
                ) : null}
                {recentSegments.map((seg, i) => {
                  const active = i === recentSegments.length - 1;
                  const opacity = OPACITY_STEPS[OPACITY_STEPS.length - recentSegments.length + i] ?? 1;
                  return (
                    <div key={seg.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px', opacity }}>
                      <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                        {active && <span style={{ backgroundColor: c.accent, borderRadius: '9999px', flexShrink: 0, height: '5px', width: '5px' }} />}
                        <span style={{ color: active ? c.accent : c.quiet, fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', lineHeight: '12px', textTransform: 'uppercase' }}>
                          Preacher{active ? ' · speaking now' : ''}
                        </span>
                      </div>
                      <div style={{ backgroundColor: active ? '#19A7CE1F' : c.fill, borderRadius: '10px', paddingBlock: '9px', paddingInline: '13px' }}>
                        <span style={{ color: active ? c.text : c.textSoft, fontSize: '13px', lineHeight: '140%' }}>{seg.text || '...'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <div style={{ alignItems: 'stretch', display: 'flex', flex: '1 1 796px', flexDirection: 'column', gap: '16px', minHeight: 0, minWidth: '520px' }}>
            <Card style={{ flex: '1 1 0%', gap: '14px', minHeight: 0, paddingBlock: '12px', paddingInline: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                  <Label>Verse detection &amp; matching</Label>
                  {pendingVerse && (
                    <span style={{ color: confidenceColor(confidencePercent(pendingVerse.confidence)), fontSize: '11px', fontWeight: 500, lineHeight: '14px' }}>
                      {confidencePercent(pendingVerse.confidence).toFixed(1)}% confidence
                    </span>
                  )}
                </div>
                {/* Transport bar: one input, one action. The field sinks, the
                    button rises — lit state beside solid action. "Add to queue"
                    lives on the result card as "Stage" instead. */}
                <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                  <TranslationSwitcher />
                  <div style={{ ...INPUT_WELL, alignItems: 'center', borderRadius: '9999px', display: 'flex', flex: '1 1 0%', height: '38px', paddingInline: '16px' }}>
                    <input
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') runManualSearch();
                      }}
                      placeholder="Manual lookup — e.g. Romans 8:28-30"
                      className="lookup-input"
                      style={{ background: 'none', border: 'none', color: c.text, fontFamily: FONT_UI, fontSize: '12px', outline: 'none', width: '100%' }}
                    />
                  </div>
                  <ActionButton onClick={runManualSearch} variant="secondary" style={{ height: '38px' }}>
                    Search
                  </ActionButton>
                </div>
                {orderedDetections.length === 0 ? (
                  <div style={{ alignItems: 'center', backgroundColor: c.fill, borderRadius: '12px', display: 'flex', gap: '8px', justifyContent: 'center', padding: '14px' }}>
                    <span style={{ backgroundColor: live.mic ? '#8A8A92' : '#EAB308', borderRadius: '9999px', flexShrink: 0, height: '6px', width: '6px' }} />
                    <span style={{ color: live.mic ? c.textSoft : '#EAB308', fontSize: '12px', lineHeight: '16px' }}>
                      {!live.mic
                        ? 'Microphone is muted -- live detection paused'
                        : unresolvedRef
                          ? `Heard "${unresolvedRef}" -- no such passage`
                          : belowThresholdRef
                            ? `Heard "${belowThresholdRef.label}" at ${belowThresholdRef.pct}% -- below confidence threshold (${confidenceThreshold}%), lower it to catch this`
                            : 'Listening for the next reference...'}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`detection-fade${queueOverflowing ? ' is-overflowing' : ''}`}
                    style={{
                      display: 'flex',
                      flex: '1 1 0%',
                      marginBlock: `-${QUEUE_BLEED_Y}px`,
                      marginInline: `-${QUEUE_BLEED_X}px`,
                      minHeight: 0,
                      overflow: 'visible',
                      // The wrapper now extends past the content by the bleed, so
                      // the mask has to start its fade that much earlier to still
                      // land QUEUE_FADE above where the cards actually end.
                      '--queue-bleed-y': `${QUEUE_BLEED_Y}px`,
                      '--queue-fade': `${QUEUE_FADE}px`,
                    } as CSSProperties}
                  >
                    <div
                      ref={queueScrollRef}
                      className="scroll-region"
                      style={{
                        flex: '1 1 0%',
                        minHeight: 0,
                        overflowY: 'auto',
                        // Extra bottom room so the last card can scroll clear of
                        // the fade rather than living underneath it.
                        paddingBottom: `${QUEUE_BLEED_Y + QUEUE_FADE}px`,
                        paddingInline: `${QUEUE_BLEED_X}px`,
                        paddingTop: `${QUEUE_BLEED_Y}px`,
                      }}
                    >
                      <div ref={queueContentRef} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {!live.mic && (
                          <div style={{ alignItems: 'center', backgroundColor: 'rgba(234,179,8,0.08)', borderRadius: '8px', display: 'flex', gap: '8px', justifyContent: 'center', paddingBlock: '8px', paddingInline: '12px' }}>
                            <span style={{ backgroundColor: '#EAB308', borderRadius: '9999px', height: '6px', width: '6px' }} />
                            <span style={{ color: '#EAB308', fontSize: '11px', fontWeight: 500 }}>Microphone is muted -- live detection paused</span>
                          </div>
                        )}
                        {orderedDetections.map((item, idx) => (
                          <VerseCard
                            key={item.id}
                            item={item}
                            primary={idx === 0}
                            onDisplay={() => displayItem(item)}
                            onDismiss={() => dismissItem(item.id)}
                            onStage={() => stageDetected(item)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card style={{ backgroundColor: c.cardAlt, flex: '0 0 182px', gap: '14px', paddingBlock: '16px', paddingInline: '16px' }}>
              <span style={{ color: '#6B6D7A', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', lineHeight: '12px', textTransform: 'uppercase' }}>Detection tuning</span>
              <SliderRow
                label="Confidence threshold"
                value={`${confidenceThreshold}%`}
                min={50}
                max={95}
                step={5}
                currentVal={confidenceThreshold}
                onChange={setConfidenceThreshold}
              />
              <SliderRow
                label="Auto-push delay"
                value={`${autoPushDelay.toFixed(1)}s`}
                min={0.5}
                max={5.0}
                step={0.1}
                currentVal={autoPushDelay}
                onChange={setAutoPushDelay}
              />
              <SliderRow
                label="Detection sensitivity"
                value={sensitivity}
                min={1}
                max={3}
                step={1}
                currentVal={sensitivity === 'Conservative' ? 1 : sensitivity === 'Balanced' ? 2 : 3}
                onChange={(val) => {
                  const modes: Array<'Conservative' | 'Balanced' | 'Aggressive'> = ['Conservative', 'Balanced', 'Aggressive'];
                  setSensitivity(modes[val - 1]);
                }}
              />
            </Card>
          </div>

          <div style={{ display: 'flex', flex: '0 0 380px', flexDirection: 'column', gap: '16px', minHeight: 0, minWidth: 0, width: '380px' }}>
            <Card style={{ flexShrink: 0, gap: '12px', paddingBottom: '12px', paddingInline: '12px', paddingTop: '16px' }}>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                  <span style={{ backgroundColor: c.success, borderRadius: '9999px', height: '6px', width: '6px' }} />
                  <Label>Now on projector</Label>
                </div>
                <button type="button" onClick={() => openProjectorWindow()} style={{ background: 'none', border: 'none', color: c.accent, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, lineHeight: '14px', padding: 0 }}>
                  Open window
                </button>
              </div>
              {/* 02 · EMIT — the thing that is literally on screen should look
                  like a screen: bezel, sunk glass, lamp bloom, gloss streak and
                  a front lip. Only the reference label gets phosphor; the verse
                  copy stays clean so it is still readable at a glance. */}
              <button
                type="button"
                onClick={() => navigate('/projector')}
                style={{ ...SCREEN_HOUSING, border: 'none', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', padding: '4px 4px 0', width: '100%' }}
              >
                <div
                  style={{
                    ...SCREEN_INSET,
                    alignItems: 'center',
                    aspectRatio: '16 / 9',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px',
                    justifyContent: 'center',
                    overflow: 'clip',
                    paddingInline: '28px',
                    position: 'relative',
                    width: '100%',
                  }}
                >
                  <span aria-hidden style={{ ...SCREEN_VIGNETTE, height: '100%', left: 0, pointerEvents: 'none', position: 'absolute', top: 0, width: '100%' }} />
                  <span aria-hidden style={{ ...SCREEN_GLOSS, height: '100%', left: 0, pointerEvents: 'none', position: 'absolute', top: 0, width: '100%' }} />
                  <span style={{ ...SCREEN_PHOSPHOR, position: 'relative', textTransform: 'uppercase' }}>{displayState.ref}</span>
                  <span style={{ color: SCREEN_VERSE_FG, fontSize: '11.5px', lineHeight: '18px', position: 'relative', textAlign: 'center' }}>
                    {previewText(displayState.text)}
                  </span>
                </div>
                {/* Front lip — the housing reads as a physical object sitting on the card. */}
                <span aria-hidden style={{ flexShrink: 0, height: '10px' }} />
              </button>
            </Card>

            <Card style={{ flex: '1 1 0%', gap: '14px', minHeight: 0, padding: '12px' }}>
              {/* Subtly dimensional, not a full groove control: the housing sits a
                  touch deeper, and the sliding cap is a soft gradient held by a
                  black shadow ring. No lit rim — it should read as a nudge, not as
                  hardware competing with the faders. */}
              <div style={{ alignItems: 'center', backgroundColor: c.black, borderRadius: '9px', boxShadow: 'inset 0 1px 2px #000000, 0 0 0 1px #050506', boxSizing: 'border-box', display: 'flex', padding: '3px', position: 'relative' }}>
                <span
                  aria-hidden
                  style={{
                    backgroundImage: 'linear-gradient(180deg, #26262B 0%, #1B1B1F 100%)',
                    borderRadius: '6px',
                    bottom: '3px',
                    boxShadow: '0 1px 3px -1px #000000, 0 0 0 1px #050506',
                    left: queueTab === 'queue' ? '3px' : '50%',
                    position: 'absolute',
                    top: '3px',
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: 'calc(50% - 3px)',
                  }}
                />
                <button type="button" onClick={() => setQueueTab('queue')} style={{ background: 'transparent', border: 'none', color: queueTab === 'queue' ? '#E4E4E9' : c.quiet, flex: '1 1 0%', fontSize: '11px', fontWeight: queueTab === 'queue' ? 600 : 500, lineHeight: '14px', paddingBlock: '7px', position: 'relative', transition: 'color 0.2s ease' }}>
                  Service queue
                </button>
                <button type="button" onClick={() => setQueueTab('recent')} style={{ background: 'transparent', border: 'none', color: queueTab === 'recent' ? '#E4E4E9' : c.quiet, flex: '1 1 0%', fontSize: '11px', fontWeight: queueTab === 'recent' ? 600 : 500, lineHeight: '14px', paddingBlock: '7px', position: 'relative', transition: 'color 0.2s ease' }}>
                  Recent
                </button>
              </div>

              {queueTab === 'queue' ? (
                <div className="scroll-region" style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '14px', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
                  {serviceQueue.length === 0 ? (
                    <div style={{ alignItems: 'center', backgroundColor: c.fill, borderRadius: '10px', color: c.muted, display: 'flex', fontSize: '12px', justifyContent: 'center', lineHeight: '16px', minHeight: '74px', paddingBlock: '12px', paddingInline: '14px', textAlign: 'center' }}>
                      Stage verses ahead of the service
                    </div>
                  ) : (
                    serviceQueue.map((item) => (
                      <QueueItem
                        key={item.id}
                        item={item}
                        dragId={dragId}
                        setDragId={setDragId}
                        onDisplay={() => displayQueuedVerse(item)}
                        onDismiss={() => dismissQueuedVerse(item.id)}
                        onDropOn={() => {
                          if (dragId && dragId !== item.id) reorderQueuedVerse(dragId, item.id);
                          setDragId(null);
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="scroll-region" style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '14px', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
                  {recentDetections.length === 0 ? (
                    <div style={{ alignItems: 'center', backgroundColor: c.fill, borderRadius: '10px', color: c.dim, display: 'flex', fontSize: '12px', justifyContent: 'center', lineHeight: '16px', minHeight: '74px', paddingBlock: '12px', paddingInline: '14px', textAlign: 'center' }}>
                      No verses confirmed yet
                    </div>
                  ) : (
                    recentDetections.map((item) => (
                      <div key={item.id} style={{ backgroundColor: c.fill, borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBlock: '12px', paddingInline: '14px' }}>
                        <span style={{ color: '#E4E4E7', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: '16px' }}>{item.batch.ref}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <ActionButton onClick={() => displayItem(item)} variant="secondary" style={{ fontSize: '11px', height: '26px', paddingInline: '12px' }}>Display</ActionButton>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        </main>

        <footer style={{ alignItems: 'center', borderTop: '0.5px solid #FFFFFF0F', display: 'flex', flexShrink: 0, height: '72px', justifyContent: 'space-between', paddingInline: '28px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <FooterToggle active={live.mic} audioLevel={micLevel} icon={MicrophoneIcon} title={`Mic: ${live.mic ? 'live' : 'muted'}`} onClick={() => setLive((p) => ({ ...p, mic: !p.mic }))} />
            <FooterToggle active={live.video} icon={VideoCameraIcon} title={`Video: ${live.video ? 'on' : 'off'}`} onClick={() => setLive((p) => ({ ...p, video: !p.video }))} />
            <FooterToggle active={live.system} icon={SpeakerHighIcon} title={`System audio: ${live.system ? 'on' : 'off'}`} onClick={() => setLive((p) => ({ ...p, system: !p.system }))} />
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
            <span style={{ color: c.muted, fontSize: '12px', lineHeight: '16px' }}>Mode: {autoPush ? 'Auto-push' : 'Manual confirm'}</span>
            <AutoPushCell armed={autoPush} onClick={() => setAutoPush(!autoPush)} />
            <ActionButton onClick={() => setShowEndModal(true)} variant="danger" style={{ fontWeight: 600 }}>
              <SignOutIcon size={15} weight="regular" />
              End Session
            </ActionButton>
          </div>
        </footer>
      </div>

      {showEndModal && (
        <div
          onClick={() => setShowEndModal(false)}
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(9, 9, 11, 0.72)',
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
              backgroundColor: c.card,
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
              <span style={{ color: c.text, fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.03em' }}>End this session?</span>
              <span style={{ color: c.muted, fontSize: '13px', lineHeight: 1.5 }}>This stops the live transcription, clears the verse queue, and blanks the projector. The session timer will reset.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <ActionButton onClick={() => setShowEndModal(false)} variant="secondary" style={{ fontSize: '13px', paddingInline: '18px' }}>Keep session</ActionButton>
              <ActionButton onClick={confirmEnd} variant="primary" style={{ fontSize: '13px', paddingInline: '18px' }}>End session</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueItem({
  item,
  dragId,
  setDragId,
  onDisplay,
  onDismiss,
  onDropOn,
}: {
  item: QueuedVerse;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onDisplay: () => void;
  onDismiss: () => void;
  onDropOn: () => void;
}) {
  const activeDrag = dragId === item.id;

  return (
    <div
      draggable
      onDragStart={(e) => {
        setDragId(item.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn();
      }}
      onDragEnd={() => setDragId(null)}
      style={{
        backgroundColor: c.fill,
        borderRadius: '10px',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        opacity: activeDrag ? 0.5 : 1,
        paddingBlock: '12px',
        paddingInline: '14px',
      }}
    >
      <span style={{ color: '#E4E4E7', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: '16px' }}>{refLabel(item.ref)}</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionButton onClick={onDisplay} variant="secondary" style={{ fontSize: '11px', height: '26px', paddingInline: '12px' }}>Display</ActionButton>
        <ActionButton onClick={onDismiss} variant="secondary" style={{ fontSize: '11px', height: '26px', paddingInline: '12px' }}>Dismiss</ActionButton>
      </div>
    </div>
  );
}

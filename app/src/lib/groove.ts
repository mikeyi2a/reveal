import type { CSSProperties } from 'react';

/*
 * "Groove" material language — ported from the Paper frame
 * "Groove Language → Live Console (Retrofits)".
 *
 * Three rules decide whether a surface earns the treatment. Follow them
 * before reaching for anything in this file:
 *
 *   01 · OPERATE  Things you physically act on get a housing and a recessed
 *                 track. Switchers, faders, mode toggles.
 *   02 · EMIT     Things that output light get an inset screen and phosphor.
 *                 Projector preview, live readouts.
 *   03 · ELSE     Stays completely flat. No bevel, no gloss, no glow.
 *                 Cards, transcript, verse text, metrics.
 *
 * Every layer below is a fixed hex with no alpha, so a control holds its
 * shape on whatever surface it lands on. Do not swap these for rgba() —
 * the bevels stop reading as soon as the backdrop shifts.
 */

/** Button/label type. The machine speaks in mono; instructions speak in Geist. */
export const FONT_UI = '"Geist", system-ui, sans-serif';
export const FONT_MONO = '"Geist Mono", ui-monospace, monospace';

export type ControlState = 'rest' | 'hover' | 'pressed' | 'disabled';

/* ── 01 · OPERATE ──────────────────────────────────────────────────────── */

/**
 * Secondary · solid rim-lit. The one secondary material — Dismiss, Stage,
 * Search, Display all share it. Lit top rim, dark under-rim, hairline ring.
 */
export const SECONDARY_RIM_LIT: Record<ControlState, CSSProperties> = {
  rest: {
    backgroundColor: '#141417',
    boxShadow: 'inset 0 1.25px 0 #434345, inset 0 -1px 0 #1D1D20, 0 2px 6px -2px #08080A, 0 0 0 1px #333335',
    color: '#C7C7CC',
  },
  hover: {
    backgroundColor: '#1A1A1E',
    boxShadow: 'inset 0 1.25px 0 #5A5A5D, inset 0 -1px 0 #232326, 0 4px 10px -3px #08080A, 0 0 0 1px #414147',
    color: '#E4E4E9',
  },
  pressed: {
    backgroundColor: '#0F0F12',
    boxShadow: 'inset 0 3px 5px #000000, inset 0 -1px 0 #2A2A2E, 0 0 0 1px #2A2A2F',
    color: '#A8A8AF',
  },
  disabled: {
    backgroundColor: '#101013',
    boxShadow: 'inset 0 0.5px 0 #1F1F22, 0 0 0 1px #1C1C20',
    color: '#4E4E56',
  },
};

/** Translation switcher, lit (active) state. The one cyan control in the row. */
export const SWITCHER_LIT: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(54.8% -0.056 -0.070) 0%, oklab(38.9% -0.037 -0.054) 62%, oklab(45% -0.045 -0.058) 100%)',
  boxShadow: 'inset 0 1.25px 0 #7FD4F0, inset 0 -1px 0 #2E7A9C, 0 2px 5px -2px #0A2F42, 0 0 0 1px #1E7FA8',
  color: '#CFEEFF',
};

/** Chevron / tick stroke on the lit switcher. */
export const SWITCHER_LIT_EDGE = '#7FD4F0';

/**
 * Switcher dropdown panel. The one groove element that gets a *cast* shadow
 * instead of a recess — it sits above the page rather than in it. The pill
 * above it squares off its bottom corners so the two read as one shell.
 */
export const SWITCHER_PANEL: CSSProperties = {
  backgroundImage: 'linear-gradient(in oklab 180deg, oklab(22.1% 0.004 -0.009) 0%, oklab(24.2% 0.004 -0.009) 100%)',
  borderBottomLeftRadius: '14px',
  borderBottomRightRadius: '14px',
  boxShadow: 'inset 0 -1px 0 #FFFFFF14, 0 12px 24px -8px #000000, 0 0 0 1px #08080A',
};

export const SWITCHER_PANEL_SELECTED_BG = '#123245';
export const SWITCHER_PANEL_SELECTED_FG = '#5FCDF5';
export const SWITCHER_PANEL_FG = '#9A948C';

/** Text input, sunk into the surface. Pairs with a raised cap beside it. */
export const INPUT_WELL: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(15.6% 0.002 -0.006) 0%, oklab(18.4% 0.002 -0.008) 70%, oklab(20.7% 0.003 -0.009) 100%)',
  boxShadow: 'inset 0 3px 6px #000000, inset 0 -1px 0 #26262C, 0 0 0 1px #050506',
};

export const INPUT_WELL_PLACEHOLDER = '#6B6B72';

/** Fader: recessed track, lit fill, raised beveled thumb. */
export const FADER_TRACK: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(15.1% 0.002 -0.006) 0%, oklab(18.9% 0.002 -0.008) 70%, oklab(22% 0.003 -0.009) 100%)',
  borderRadius: '4px',
  boxShadow: 'inset 0 2px 4px #000000, inset 0 -1px 0 #26262C, 0 0 0 1px #050506',
  height: '8px',
};

export const FADER_FILL: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(73.6% -0.082 -0.094) 0%, oklab(56.2% -0.065 -0.083) 70%, oklab(62.4% -0.071 -0.086) 100%)',
  borderRadius: '4px',
  boxShadow: 'inset 0 1px 0 #9BE0FA, 0 0 8px 1px #4FC3EF73',
};

export const FADER_THUMB: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(73.5% 0.005 -0.016) 0%, oklab(54.2% 0.005 -0.018) 45%, oklab(44.2% 0.004 -0.016) 76%, oklab(59.7% 0.005 -0.017) 100%)',
  borderRadius: '50%',
  boxShadow: 'inset 0 1.5px 0 #DCDCE4, inset 0 -1px 0 #2E2E36, 0 3px 7px -1px #000000, 0 0 0 1px #0B0B0E',
  height: '20px',
  width: '20px',
};

/** The value becomes readable from the light, not just the number. */
export const FADER_READOUT: CSSProperties = {
  color: '#B4E8FF',
  fontFamily: FONT_MONO,
  fontSize: '11px',
  lineHeight: '14px',
  textShadow: '0 0 8px #4FC3EF80',
};

/**
 * Auto-push FX cell. The only retrofit that adds meaning rather than texture:
 * cyan = you confirmed it, amber = the system is armed and will push without
 * you. A mode this consequential should be visible from across a room.
 */
export const FX_CELL_OFF: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(16% 0.002 -0.006) 0%, oklab(19.3% 0.002 -0.006) 65%, oklab(22.9% 0.003 -0.009) 100%)',
  boxShadow: 'inset 0 3px 5px #000000, inset 0 -1px 0 #2A2A31, 0 0 0 1px #050506',
  color: '#79818B',
};

/**
 * The cell's lamp. It is always present so the pill does not change width when
 * armed — only the lamp lights. Unlit is a dead bulb sunk in its socket.
 */
export const FX_LAMP_DARK: CSSProperties = {
  backgroundColor: '#2B3037',
  borderRadius: '50%',
  boxShadow: 'inset 0 1px 1.5px #000000, 0 0.5px 0 #4A515A',
  height: '6px',
  width: '6px',
};

export const FX_LAMP_LIT: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle farthest-corner at 40% 35% in oklab, oklab(92.4% 0.020 0.053) 0%, oklab(82.3% 0.064 0.100) 55%, oklab(71.7% 0.089 0.109) 100%)',
  borderRadius: '50%',
  boxShadow: '0 0 6px 2px #FFB46EF2',
  height: '6px',
  width: '6px',
};

export const FX_CELL_ARMED: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(76.2% 0.098 0.125) 0%, oklab(67.5% 0.138 0.132) 34%, oklab(55.6% 0.139 0.109) 72%, oklab(43.6% 0.112 0.085) 100%)',
  // Glow kept tight and low-opacity — the amber fill and lit lamp already carry
  // the "armed" read; the ring is a hint, not a second light source.
  boxShadow:
    'inset 0 1.5px 0 #FFE0BE, inset 0 -1px 0 #FFB176, 0 3px 8px -3px #A83B08, 0 0 0 1px #FF7823, 0 0 8px 1px #FF64144D',
  color: '#FFFFFF',
  textShadow: '0 1px 2px #78280073',
};

/* ── 02 · EMIT ─────────────────────────────────────────────────────────── */

/** Outer bezel of the projector preview — a physical screen, front lip and all. */
export const SCREEN_HOUSING: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(32.7% 0.003 -0.010) 0%, oklab(25.8% 0.003 -0.009) 40%, oklab(39.7% 0.004 -0.013) 76%, oklab(30.4% 0.003 -0.010) 100%)',
  borderRadius: '13px',
  boxShadow: 'inset 0 1.5px 0 #6A6A74, 0 10px 20px -8px #000000, 0 0 0 1px #08080A',
};

/** The glass itself, sunk into the bezel. */
export const SCREEN_INSET: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, oklab(17.6% -0.003 -0.012) 0%, oklab(14.8% -0.003 -0.010) 55%, oklab(17.1% -0.003 -0.012) 100%)',
  borderBottomLeftRadius: '4px',
  borderBottomRightRadius: '4px',
  borderTopLeftRadius: '10px',
  borderTopRightRadius: '10px',
  boxShadow: 'inset 0 4px 9px #000000, 0 0 0 1px #04060A',
};

/** Lamp bloom behind the copy. Absolutely positioned, pointer-events none. */
export const SCREEN_VIGNETTE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle farthest-corner at 50% 50% in oklab, oklab(79.9% -0.056 -0.075 / 9%) 0%, oklab(0% 0 0 / 0%) 100%)',
};

/** Off-axis gloss streak across the glass. */
export const SCREEN_GLOSS: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 112deg, oklab(100% 0 0 / 0%) 54%, oklab(100% 0 0 / 4.3%) 60%, oklab(100% 0 0 / 7.5%) 65%, oklab(100% 0 0 / 0%) 71%, oklab(100% 0 0 / 0%) 78%, oklab(100% 0 0 / 3%) 83%, oklab(100% 0 0 / 0%) 89%)',
};

/** Only the reference label glows — the verse copy stays clean and readable. */
export const SCREEN_PHOSPHOR: CSSProperties = {
  color: '#5FCDF5',
  fontFamily: FONT_MONO,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  lineHeight: '14px',
  textShadow: '0 0 11px #46BEF0CC',
};

export const SCREEN_VERSE_FG = '#EDF2F5';

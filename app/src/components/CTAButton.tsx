import { useState, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { BorderBeam } from 'border-beam';
import { useDialKit } from 'dialkit';

interface CTAButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  style?: CSSProperties;
}

/** Extract hue (0-360) from a hex color string. */
function hexToHue(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = Math.round(hue * 60);
  return hue < 0 ? hue + 360 : hue;
}

/**
 * CTA button — solid cyan pill with hover-only BorderBeam.
 * Used on onboarding/setup flow pages (Landing, AudioSetup, ThemeStudio).
 * DialKit exposes every base BorderBeamProps parameter + a color picker.
 */
export default function CTAButton({ children, style, disabled, className, onMouseEnter, onMouseLeave, ...rest }: CTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const beam = useDialKit('Border Beam', {
    // ── Preset ──────────────────────────────────────────────
    size: {
      type: 'select',
      options: [
        { value: 'line', label: 'Line (Bottom)' },
        { value: 'md', label: 'Medium' },
        { value: 'sm', label: 'Small' },
        { value: 'pulse-outside', label: 'Pulse Outside' },
        { value: 'pulse-inner', label: 'Pulse Inner' },
      ],
      default: 'line',
    },
    colorVariant: {
      type: 'select',
      options: [
        { value: 'sunset', label: 'Sunset' },
        { value: 'colorful', label: 'Colorful' },
        { value: 'ocean', label: 'Ocean' },
        { value: 'mono', label: 'Mono' },
      ],
      default: 'sunset',
    },
    theme: {
      type: 'select',
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
        { value: 'auto', label: 'Auto' },
      ],
      default: 'dark',
    },

    // ── Color ───────────────────────────────────────────────
    color: {
      beamColor: { type: 'color', default: '#0011ff' },
    },

    // ── Timing ──────────────────────────────────────────────
    duration: [1.5, 0.2, 10, 0.1],
    active: true,
    staticColors: false,

    // ── Tuning ──────────────────────────────────────────────
    tuning: {
      strength: [1, 0, 1, 0.01],
      brightness: [2.5, 0.1, 6, 0.1],
      saturation: [3.0, 0, 6, 0.1],
      hueRange: [45, 0, 180, 1],
      borderRadius: [9999, 0, 9999, 1],
    },
  }, {
    id: 'border-beam-v5',
    persist: true,
  });

  const hueBase = hexToHue(beam.color.beamColor);

  // Force re-mount when any param changes so the injected <style> block regenerates
  const beamKey = [
    beam.size,
    beam.colorVariant,
    beam.theme,
    beam.duration,
    beam.active,
    beam.staticColors,
    beam.tuning.strength,
    beam.tuning.brightness,
    beam.tuning.saturation,
    beam.tuning.hueRange,
    beam.tuning.borderRadius,
    hueBase,
  ].join('-');

  return (
    <BorderBeam
      key={beamKey}
      size={beam.size as any}
      colorVariant={beam.colorVariant as any}
      theme={beam.theme as any}
      duration={beam.duration}
      active={beam.active && !disabled && isHovered}
      staticColors={beam.staticColors}
      strength={beam.tuning.strength}
      brightness={beam.tuning.brightness}
      saturation={beam.tuning.saturation}
      hueRange={beam.tuning.hueRange}
      borderRadius={beam.tuning.borderRadius}
      style={{
        borderRadius: `${beam.tuning.borderRadius}px`,
        display: 'inline-flex',
        flexShrink: 0,
        '--beam-hue-base': `${hueBase}deg`,
      } as CSSProperties}
    >
      <button
        type="button"
        disabled={disabled}
        className={['btn-primary', className].filter(Boolean).join(' ')}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onMouseLeave?.(e);
        }}
        style={{
          alignItems: 'center',
          backgroundColor: '#19A7CE',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: `${beam.tuning.borderRadius}px`,
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 6px 10px -6px rgba(25, 167, 206, 0.35)',
          color: '#FCF7F0',
          cursor: disabled ? 'default' : 'pointer',
          display: 'inline-flex',
          fontFamily: '"Figtree", system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          gap: '8px',
          justifyContent: 'center',
          letterSpacing: '-0.03em',
          lineHeight: '20px',
          opacity: disabled ? 0.5 : 1,
          paddingBlock: '6px',
          paddingInline: '22px',
          whiteSpace: 'nowrap',
          position: 'relative',
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    </BorderBeam>
  );
}

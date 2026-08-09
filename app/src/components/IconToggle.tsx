import { useEffect, useRef, type CSSProperties, type MutableRefObject, type ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';
import { BorderBeam } from 'border-beam';

interface IconToggleProps {
  icon: ComponentType<IconProps>;
  active: boolean;
  onClick: () => void;
  title: string;
  danger?: boolean;
  audioLevel?: MutableRefObject<number>;
}

const BUTTON_STYLE: CSSProperties = {
  alignItems: 'center',
  backgroundColor: '#0A273D',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '9999px',
  cursor: 'pointer',
  display: 'inline-flex',
  flexShrink: 0,
  height: '40px',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  width: '40px',
};

/**
 * Circular toggle button combining:
 * 1. A subtle ambient BorderBeam around the perimeter when active.
 * 2. A linear liquid level rise from the bottom, scaling with live mic volume.
 */
export default function IconToggle({ icon: Icon, active, onClick, title, danger, audioLevel }: IconToggleProps) {
  const color = danger ? '#EF4444' : active ? '#FCF7F0' : '#8D9AA6';
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioLevel || !active) return;
    let raf: number;
    const tick = () => {
      const level = audioLevel.current;
      if (fillRef.current) {
        // Map audio level RMS to liquid height percentage (0% to 100% rising straight up from bottom)
        const heightPct = Math.min(100, Math.max(0, Math.round(level * 280)));
        fillRef.current.style.height = `${heightPct}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [audioLevel, active]);

  const button = (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className="toggle-control"
      data-active={active}
      style={{
        ...BUTTON_STYLE,
        color,
        border: active ? (danger ? '1px solid #EF4444' : '1px solid #19A7CE') : BUTTON_STYLE.border,
        boxShadow: active
          ? danger
            ? '0 0 0 1px rgba(239, 68, 68, 0.4)'
            : '0 0 0 1px rgba(25, 167, 206, 0.4)'
          : 'none',
      }}
    >
      {active && audioLevel && (
        <div
          ref={fillRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '0%',
            backgroundColor: danger ? 'rgba(239, 68, 68, 0.65)' : 'rgba(25, 167, 206, 0.65)',
            transition: 'height 0.04s ease-out',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <Icon size={18} weight={active ? 'fill' : 'regular'} style={{ position: 'relative', zIndex: 1 }} />
    </button>
  );

  if (!audioLevel) return button;

  return (
    <BorderBeam
      size="pulse-outside"
      colorVariant="ocean"
      theme="dark"
      active={active}
      strength={0.55}
      brightness={1.6}
      duration={2.2}
      borderRadius={9999}
    >
      {button}
    </BorderBeam>
  );
}

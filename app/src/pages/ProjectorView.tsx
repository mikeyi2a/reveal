import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon, PowerIcon } from '@phosphor-icons/react';
import Stage from '../components/Stage';
import ProjectorArtboard from '../components/ProjectorArtboard';
import { useProjectorState } from '../lib/revealStore';

/**
 * The standalone projector output. This is a dedicated, full-screen surface —
 * it is meant to fill a display (or a second monitor via "Open window"), so the
 * artboard legitimately spans the whole screen. What it should NOT feel like is
 * a raw, uncontrolled page: hence the idle "waiting for signal" state, an
 * auto-hiding control cluster (Blackout / Exit) along the top edge, and a clean
 * black 16:9 surround from <Stage>. The live verse is mirrored here from the
 * operator console over the shared localStorage sync.
 */
export default function ProjectorView() {
  const navigate = useNavigate();
  const [projector] = useProjectorState();

  // Blackout: keep the last verse loaded but hide it (operator walk-up control
  // on the physical projector). Toggled from the auto-hiding cluster below.
  const [blackout, setBlackout] = useState(false);

  // Auto-hide the controls after a few seconds of mouse stillness; reveal on
  // any mouse movement. The projector should not carry a permanent UI chrome.
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);
  useEffect(() => {
    const reveal = () => {
      setControlsVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2600);
    };
    reveal();
    window.addEventListener('mousemove', reveal);
    return () => {
      window.removeEventListener('mousemove', reveal);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const showIdle = !projector || projector.updatedAt === 0;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000000' }}>
      {blackout ? (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#000000' }} />
      ) : showIdle ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              border: '1px solid rgba(25,167,206,0.30)',
              borderRadius: '9999px',
              display: 'flex',
              gap: '12px',
              paddingBlock: '10px',
              paddingInline: '22px',
            }}
          >
            <span style={{ backgroundColor: '#19A7CE', borderRadius: '50%', height: '8px', width: '8px', opacity: 0.8 }} />
            <span
              style={{
                color: '#8D9AA6',
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Waiting for signal
            </span>
          </div>
          <span
            style={{
              color: '#3A4753',
              fontFamily: '"Geist", system-ui, sans-serif',
              fontSize: '12px',
              letterSpacing: '0.08em',
            }}
          >
            Reveal · projector output ready
          </span>
        </div>
      ) : (
        <Stage width={1920} height={1080}>
          <ProjectorArtboard state={projector!} />
        </Stage>
      )}

      {/* Auto-hiding control cluster. Lives outside the scaled Stage so it stays
          crisp and clickable on the physical output, and fades away to keep the
          wall clean. */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '10px',
          left: '20px',
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          position: 'fixed',
          top: '20px',
          transition: 'opacity 0.25s ease',
          zIndex: 10,
        }}
      >
        <ProjectorControlButton label="Blackout" onClick={() => setBlackout((b) => !b)} active={blackout}>
          <PowerIcon size={18} weight={blackout ? 'fill' : 'regular'} />
        </ProjectorControlButton>
        <ProjectorControlButton label="Exit" onClick={() => navigate('/dashboard')}>
          <XIcon size={18} weight="bold" />
        </ProjectorControlButton>
      </div>
    </div>
  );
}

function ProjectorControlButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="projector-exit"
      style={{
        alignItems: 'center',
        backgroundColor: active ? 'rgba(25,167,206,0.22)' : 'rgba(10,39,61,0.85)',
        border: `1px solid ${active ? 'rgba(25,167,206,0.80)' : 'rgba(25,167,206,0.50)'}`,
        borderRadius: '12px',
        boxShadow: '0px 0px 0px 4px rgba(255,255,255,0.10), 0px 0px 16px 4px rgba(25,167,206,0.30)',
        color: active ? '#19A7CE' : '#FCF7F0',
        cursor: 'pointer',
        display: 'inline-flex',
        gap: '8px',
        height: '44px',
        justifyContent: 'center',
        paddingInline: '16px',
        transition: 'background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0px 0px 0px 4px rgba(255,255,255,0.15), 0px 0px 24px 8px rgba(25,167,206,0.50)';
        e.currentTarget.style.borderColor = 'rgba(25,167,206,0.80)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0px 0px 0px 4px rgba(255,255,255,0.10), 0px 0px 16px 4px rgba(25,167,206,0.30)';
        e.currentTarget.style.borderColor = active ? 'rgba(25,167,206,0.80)' : 'rgba(25,167,206,0.50)';
      }}
    >
      {children}
      <span style={{ fontFamily: '"Geist", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, lineHeight: '24px' }}>{label}</span>
    </button>
  );
}

import { useNavigate } from 'react-router-dom';
import { XIcon } from '@phosphor-icons/react';
import Stage from '../components/Stage';
import ProjectorArtboard, { DEFAULT_PROJECTOR } from '../components/ProjectorArtboard';
import { useProjectorState } from '../lib/revealStore';

export default function ProjectorView() {
  const navigate = useNavigate();
  const [projector] = useProjectorState();
  const state = projector ?? DEFAULT_PROJECTOR;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Stage width={1920} height={1080}>
        <ProjectorArtboard state={state} />
      </Stage>

      {/* Exit control lives outside the scaled Stage — rendered as a prominent,
          fixed-position control so the operator can always find it on the
          physical projector output. */}
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        title="Exit projector view"
        aria-label="Exit projector view"
        className="projector-exit"
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(10,39,61,0.85)',
          border: '1px solid rgba(25,167,206,0.50)',
          borderRadius: '12px',
          boxShadow: '0px 0px 0px 4px rgba(255,255,255,0.10), 0px 0px 16px 4px rgba(25,167,206,0.30)',
          color: '#FCF7F0',
          cursor: 'pointer',
          display: 'inline-flex',
          gap: '8px',
          height: '44px',
          justifyContent: 'center',
          left: '20px',
          opacity: 1,
          paddingBlock: '10px',
          paddingInline: '16px',
          position: 'fixed',
          top: '20px',
          transition: 'background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
          width: 'fit-content',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0px 0px 0px 4px rgba(255,255,255,0.15), 0px 0px 24px 8px rgba(25,167,206,0.50)';
          e.currentTarget.style.borderColor = 'rgba(25,167,206,0.80)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0px 0px 0px 4px rgba(255,255,255,0.10), 0px 0px 16px 4px rgba(25,167,206,0.30)';
          e.currentTarget.style.borderColor = 'rgba(25,167,206,0.50)';
        }}
      >
        <XIcon size={20} weight="bold" />
        <span style={{ fontFamily: '"Geist", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, lineHeight: '24px' }}>Exit</span>
      </button>
    </div>
  );
}

import type { ProjectorState } from '../lib/revealStore';

// A sensible default so the wall (and the dashboard preview) is never blank.
export const DEFAULT_PROJECTOR: ProjectorState = {
  ref: 'JOHN 3:16-17',
  text: "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life. For God didn't send his Son into the world to judge the world, but that the world should be saved through him.",
  verses: [
    "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.",
    "For God didn't send his Son into the world to judge the world, but that the world should be saved through him.",
  ],
  verseStart: 16,
  updatedAt: 0,
};

// A batch is at most 8 verses; pick a font size that keeps the wall readable
// from the back of the room rather than microscopic.
export function fontSizeForText(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 25) return 46;
  if (words <= 50) return 38;
  if (words <= 90) return 30;
  return 26;
}

/**
 * The single source of truth for what the projector shows. Both the real
 * projector route and the dashboard "now on projector" preview render THIS
 * exact artboard, so they can never drift apart.
 */
export default function ProjectorArtboard({ state }: { state: ProjectorState }) {
  const verses = state.verses ?? [state.text];
  const fontSize = fontSizeForText(state.text);
  const startVerse = state.verseStart ?? 1;

  return (
    <div
      style={{
        backgroundColor: '#000B14',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        height: '1080px',
        lineHeight: '16px',
        overflow: 'hidden',
        width: '1920px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          backgroundColor: '#000B14',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          paddingBlock: '80px',
          paddingInline: '120px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            backgroundColor: '#051929',
            borderRadius: '9999px',
            display: 'flex',
            gap: '14px',
            paddingBlock: '12px',
            paddingInline: '28px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="none" stroke="#19A7CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="none" stroke="#19A7CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div
            style={{
              color: '#19A7CE',
              fontFamily: '"Figtree", system-ui, sans-serif',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: '28px',
              textTransform: 'uppercase',
            }}
          >
            {state.ref}
          </div>
          <div
            style={{
              backgroundColor: '#0A273D',
              borderRadius: '4px',
              display: 'inline-block',
              paddingBlock: '3px',
              paddingInline: '10px',
            }}
          >
            <div
              style={{
                color: '#8D9AA6',
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.5px',
                lineHeight: '16px',
              }}
            >
              WEB
            </div>
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: `${Math.round(fontSize * 0.4)}px`,
            justifyContent: 'center',
            maxWidth: '1400px',
          }}
        >
          {verses.map((v, i) => (
            <div
              key={i}
              style={{
                color: '#FCF7F0',
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: `${fontSize}px`,
                letterSpacing: '-0.02em',
                lineHeight: '165%',
                textAlign: 'center',
              }}
            >
              <sup style={{ fontSize: '0.55em', marginRight: '4px' }}>{startVerse + i}</sup>
              {v}
            </div>
          ))}
        </div>

        <div style={{ alignItems: 'center', display: 'flex', gap: '10px', opacity: 0.7 }}>
          <div style={{ backgroundColor: '#12D453', borderRadius: '50%', flexShrink: 0, height: '7px', width: '7px' }} />
          <div
            style={{
              color: '#8D9AA6',
              fontFamily: '"Geist", system-ui, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '1px',
              lineHeight: '16px',
              textTransform: 'uppercase',
            }}
          >
            REVEAL LIVE &bull; SALFORD YOUNG ADULTS
          </div>
        </div>
      </div>
    </div>
  );
}

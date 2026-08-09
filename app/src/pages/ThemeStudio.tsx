import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowRightIcon } from '@phosphor-icons/react';
import ConsoleLayout, { Card, CardLabel } from '../components/ConsoleLayout';
import PrimaryButton from '../components/PrimaryButton';

const themes = [
  {
    name: 'Sacred Obsidian',
    tag: 'Default',
    swatches: [
      { label: 'BG', color: '#000B14' },
      { label: 'Surface', color: '#051929' },
      { label: 'Text', color: '#FCF7F0' },
      { label: 'Accent', color: '#C9A227' },
    ],
  },
  {
    name: 'Minimalist Monolith',
    swatches: [
      { label: 'BG', color: '#000000' },
      { label: 'Surface', color: '#0A0A0A' },
      { label: 'Text', color: '#FCF7F0' },
      { label: 'Accent', color: '#19A7CE' },
    ],
  },
  {
    name: 'Warm Sanctuary',
    swatches: [
      { label: 'BG', color: '#1A1410' },
      { label: 'Surface', color: '#2A2018' },
      { label: 'Text', color: '#F3E9DC' },
      { label: 'Accent', color: '#B87333' },
    ],
  },
];

export default function ThemeStudio() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [bg, surface, text, accent] = themes[selected].swatches.map((s) => s.color);

  return (
    <ConsoleLayout>
      <header style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '64px', justifyContent: 'space-between', paddingInline: '32px' }}>
        <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.03em' }}>
          Theme Studio
        </span>
        <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Step 3 of 3</span>
      </header>

      <main style={{ display: 'flex', flexGrow: 1, flexWrap: 'wrap', gap: '16px', paddingBlock: '8px', paddingInline: '32px' }}>
        <Card style={{ alignItems: 'center', flex: '1.4 1 480px', justifyContent: 'center', padding: '28px' }}>
          <div
            style={{
              alignItems: 'center',
              aspectRatio: '16 / 9',
              backgroundColor: bg,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              justifyContent: 'center',
              paddingInline: '40px',
              position: 'relative',
              transition: 'background-color 0.25s ease',
              width: '100%',
            }}
          >
            <span
              style={{
                backgroundColor: surface,
                borderRadius: '9999px',
                color: accent,
                fontFamily: '"Figtree", system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                paddingBlock: '6px',
                paddingInline: '16px',
                transition: 'all 0.25s ease',
              }}
            >
              JOHN 3:16 &bull; WEB
            </span>
            <p style={{ color: text, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '26px', lineHeight: 1.6, margin: 0, textAlign: 'center', transition: 'color 0.25s ease' }}>
              "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life."
            </p>
            <div style={{ alignItems: 'center', bottom: '26px', display: 'flex', gap: '8px', position: 'absolute' }}>
              <span style={{ backgroundColor: '#12D453', borderRadius: '9999px', height: '6px', width: '6px' }} />
              <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Reveal Live &bull; Salford Young Adults
              </span>
            </div>
          </div>
        </Card>

        <Card style={{ flex: '1 1 400px', gap: '18px', padding: '26px' }}>
          <CardLabel>Projection theme</CardLabel>
          <div style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '12px' }}>
            {themes.map((theme, i) => {
              const isSelected = i === selected;
              return (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setSelected(i)}
                  className="toggle-control"
                  data-active={isSelected}
                  style={{
                    alignItems: 'stretch',
                    backgroundColor: isSelected ? 'rgba(25,167,206,0.10)' : '#0A273D',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flex: '1 1 0%',
                    flexDirection: 'column',
                    gap: '16px',
                    justifyContent: 'center',
                    paddingBlock: '20px',
                    paddingInline: '22px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ alignItems: 'center', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                    <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                      {theme.name}
                    </span>
                    {isSelected ? (
                      <CheckCircleIcon size={18} weight="fill" color="#19A7CE" />
                    ) : theme.tag ? (
                      <span style={{ color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {theme.tag}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {theme.swatches.map((s) => (
                      <div key={s.label} style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <div style={{ backgroundColor: s.color, borderRadius: '8px', height: '38px', width: '38px' }} />
                        <span style={{ color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </main>

      <footer style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '88px', justifyContent: 'space-between', paddingInline: '32px' }}>
        <button
          type="button"
          onClick={() => navigate('/audio-setup')}
          style={{ background: 'none', border: 'none', color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '14px', fontWeight: 500, padding: 0 }}
        >
          Back
        </button>
        <PrimaryButton onClick={() => navigate('/dashboard')}>
          Start Session
          <ArrowRightIcon size={16} weight="bold" />
        </PrimaryButton>
      </footer>
    </ConsoleLayout>
  );
}

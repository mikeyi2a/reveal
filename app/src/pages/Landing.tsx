import { useNavigate } from 'react-router-dom';
import { MicrophoneIcon, PaletteIcon, BuildingsIcon, CloudCheckIcon, ArrowRightIcon } from '@phosphor-icons/react';
import ConsoleLayout, { Card } from '../components/ConsoleLayout';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

const setupRows = [
  { icon: MicrophoneIcon, label: 'Audio input', value: 'Room Mic', accent: '#12D453' },
  { icon: PaletteIcon, label: 'Theme', value: 'Sacred Obsidian', accent: '#19A7CE' },
  { icon: BuildingsIcon, label: 'Service', value: 'Salford Young Adults', accent: '#5B6B78' },
  { icon: CloudCheckIcon, label: 'Offline cache', value: 'Ready', accent: '#12D453' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <ConsoleLayout>
      <header style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '64px', justifyContent: 'space-between', paddingInline: '32px' }}>
        <span style={{ color: '#19A7CE', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.03em' }}>
          REVEAL
        </span>
        <div style={{ alignItems: 'center', backgroundColor: '#051929', borderRadius: '9999px', display: 'flex', gap: '8px', paddingBlock: '7px', paddingInline: '14px' }}>
          <CloudCheckIcon size={14} weight="fill" color="#12D453" />
          <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', fontWeight: 500 }}>WEB cached offline</span>
        </div>
      </header>

      <main style={{ alignItems: 'center', display: 'flex', flexGrow: 1, flexWrap: 'wrap', gap: '56px', paddingBlock: '40px', paddingInline: '48px' }}>
        <section style={{ display: 'flex', flex: '1 1 420px', flexDirection: 'column', gap: '22px', maxWidth: '560px' }}>
          <div style={{ alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#051929', borderRadius: '9999px', display: 'flex', gap: '8px', paddingBlock: '6px', paddingInline: '14px' }}>
            <span style={{ backgroundColor: '#19A7CE', borderRadius: '9999px', height: '5px', width: '5px' }} />
            <span style={{ color: '#19A7CE', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Zero-install &bull; works fully offline
            </span>
          </div>

          <h1 style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '46px', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
            The verse lands on screen the moment it's spoken.
          </h1>

          <p style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '16px', lineHeight: 1.6, margin: 0, maxWidth: '500px' }}>
            Reveal listens to the sermon, transcribes on-device, and projects the exact reference full-screen. No network, no volunteer scrambling.
          </p>

          <div style={{ alignItems: 'center', display: 'flex', gap: '12px', marginTop: '6px' }}>
            <PrimaryButton onClick={() => navigate('/audio-setup')}>
              Start Session
              <ArrowRightIcon size={16} weight="bold" />
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/projector')}>See it in action</SecondaryButton>
          </div>
        </section>

        <section style={{ display: 'flex', flex: '1 1 440px', flexDirection: 'column', gap: '16px' }}>
          <Card style={{ padding: '20px' }}>
            <div
              style={{
                alignItems: 'center',
                aspectRatio: '16 / 9',
                backgroundColor: '#000B14',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                justifyContent: 'center',
                paddingInline: '32px',
                width: '100%',
              }}
            >
              <span style={{ backgroundColor: '#051929', borderRadius: '9999px', color: '#19A7CE', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '-0.03em', paddingBlock: '6px', paddingInline: '14px' }}>
                JOHN 3:16-17 &bull; WEB
              </span>
              <p style={{ color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '21px', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
                "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life."
              </p>
              <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                <span style={{ backgroundColor: '#12D453', borderRadius: '9999px', height: '6px', width: '6px' }} />
                <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Reveal Live &bull; Salford Young Adults
                </span>
              </div>
            </div>
          </Card>

          <Card style={{ paddingBlock: '8px', paddingInline: '20px' }}>
            {setupRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '14px',
                    paddingBlock: '13px',
                    ...(i < setupRows.length - 1 ? { boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)' } : {}),
                  }}
                >
                  <Icon size={17} weight="regular" color={row.accent} />
                  <span style={{ color: '#8D9AA6', flex: 1, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>{row.label}</span>
                  <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                    {row.value}
                  </span>
                </div>
              );
            })}
          </Card>
        </section>
      </main>
    </ConsoleLayout>
  );
}

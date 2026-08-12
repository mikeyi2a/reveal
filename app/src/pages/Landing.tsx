import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MicrophoneIcon, PaletteIcon, BuildingsIcon, CloudCheckIcon, ArrowRightIcon, PencilSimpleIcon, CheckIcon } from '@phosphor-icons/react';
import ConsoleLayout, { Card } from '../components/ConsoleLayout';
import CTAButton from '../components/CTAButton';
import SecondaryButton from '../components/SecondaryButton';

export default function Landing() {
  const navigate = useNavigate();

  const [serviceName, setServiceName] = useState(() => localStorage.getItem('reveal:serviceName') || 'Salford Young Adults');
  const [audioInput, setAudioInput] = useState(() => localStorage.getItem('reveal:audioInput') || 'Room Mic');
  const [theme, setTheme] = useState(() => localStorage.getItem('reveal:theme') || 'Sacred Obsidian');

  const [editingRow, setEditingRow] = useState<string | null>(null);

  const updateService = (val: string) => {
    setServiceName(val);
    localStorage.setItem('reveal:serviceName', val);
  };

  const updateAudio = (val: string) => {
    setAudioInput(val);
    localStorage.setItem('reveal:audioInput', val);
  };

  const updateTheme = (val: string) => {
    setTheme(val);
    localStorage.setItem('reveal:theme', val);
  };

  return (
    <ConsoleLayout>
      <header style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '64px', justifyContent: 'space-between', paddingInline: '24px' }}>
        <span style={{ color: '#19A7CE', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.03em' }}>
          REVEAL
        </span>
        <div style={{ alignItems: 'center', backgroundColor: '#051929', borderRadius: '9999px', display: 'flex', gap: '8px', paddingBlock: '7px', paddingInline: '14px' }}>
          <CloudCheckIcon size={14} weight="fill" color="#12D453" />
          <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', fontWeight: 500 }}>WEB cached offline</span>
        </div>
      </header>

      <main style={{ alignItems: 'center', display: 'flex', flexGrow: 1, flexWrap: 'wrap', gap: '56px', paddingBlock: '40px', paddingInline: '24px' }}>
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
            <CTAButton onClick={() => navigate('/audio-setup')}>
              Start Session
              <ArrowRightIcon size={16} weight="bold" />
            </CTAButton>
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
                  Reveal Live &bull; {serviceName}
                </span>
              </div>
            </div>
          </Card>

          <Card style={{ paddingBlock: '8px', paddingInline: '20px' }}>
            {/* Audio Input Row */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '14px', paddingBlock: '13px', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)' }}>
              <MicrophoneIcon size={17} weight="regular" color="#12D453" />
              <span style={{ color: '#8D9AA6', flex: 1, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Audio input</span>
              {editingRow === 'audio' ? (
                <select
                  value={audioInput}
                  autoFocus
                  onChange={(e) => { updateAudio(e.target.value); setEditingRow(null); }}
                  onBlur={() => setEditingRow(null)}
                  style={{ backgroundColor: '#0A273D', border: '1px solid #19A7CE', borderRadius: '6px', color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', outline: 'none', padding: '4px 8px' }}
                >
                  <option value="Room Mic">Room Mic</option>
                  <option value="Default Microphone">Default Microphone</option>
                  <option value="System Audio (Loopback)">System Audio (Loopback)</option>
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingRow('audio')}
                  title="Click to edit audio input"
                  style={{ alignItems: 'center', background: 'none', border: 'none', color: '#FCF7F0', cursor: 'pointer', display: 'flex', gap: '6px', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, padding: 0 }}
                >
                  {audioInput}
                  <PencilSimpleIcon size={13} color="#5B6B78" />
                </button>
              )}
            </div>

            {/* Theme Row */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '14px', paddingBlock: '13px', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)' }}>
              <PaletteIcon size={17} weight="regular" color="#19A7CE" />
              <span style={{ color: '#8D9AA6', flex: 1, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Theme</span>
              {editingRow === 'theme' ? (
                <select
                  value={theme}
                  autoFocus
                  onChange={(e) => { updateTheme(e.target.value); setEditingRow(null); }}
                  onBlur={() => setEditingRow(null)}
                  style={{ backgroundColor: '#0A273D', border: '1px solid #19A7CE', borderRadius: '6px', color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px', outline: 'none', padding: '4px 8px' }}
                >
                  <option value="Sacred Obsidian">Sacred Obsidian</option>
                  <option value="Ocean Midnight">Ocean Midnight</option>
                  <option value="Minimal Obsidian">Minimal Obsidian</option>
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingRow('theme')}
                  title="Click to edit theme"
                  style={{ alignItems: 'center', background: 'none', border: 'none', color: '#FCF7F0', cursor: 'pointer', display: 'flex', gap: '6px', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, padding: 0 }}
                >
                  {theme}
                  <PencilSimpleIcon size={13} color="#5B6B78" />
                </button>
              )}
            </div>

            {/* Service Name Row */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '14px', paddingBlock: '13px', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)' }}>
              <BuildingsIcon size={17} weight="regular" color="#5B6B78" />
              <span style={{ color: '#8D9AA6', flex: 1, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Service</span>
              {editingRow === 'service' ? (
                <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={serviceName}
                    autoFocus
                    onChange={(e) => updateService(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingRow(null); }}
                    onBlur={() => setEditingRow(null)}
                    style={{ backgroundColor: '#0A273D', border: '1px solid #19A7CE', borderRadius: '6px', color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, outline: 'none', padding: '4px 8px', width: '170px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingRow(null)}
                    style={{ alignItems: 'center', backgroundColor: '#19A7CE', border: 'none', borderRadius: '6px', color: '#000B14', cursor: 'pointer', display: 'flex', height: '26px', justifyContent: 'center', width: '26px' }}
                  >
                    <CheckIcon size={14} weight="bold" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingRow('service')}
                  title="Click to edit service name"
                  style={{ alignItems: 'center', background: 'none', border: 'none', color: '#FCF7F0', cursor: 'pointer', display: 'flex', gap: '6px', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, padding: 0 }}
                >
                  {serviceName}
                  <PencilSimpleIcon size={13} color="#5B6B78" />
                </button>
              )}
            </div>

            {/* Offline Cache Row */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '14px', paddingBlock: '13px' }}>
              <CloudCheckIcon size={17} weight="regular" color="#12D453" />
              <span style={{ color: '#8D9AA6', flex: 1, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Offline cache</span>
              <span style={{ color: '#12D453', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                Ready
              </span>
            </div>
          </Card>
        </section>
      </main>
    </ConsoleLayout>
  );
}

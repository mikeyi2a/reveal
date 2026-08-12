import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MicrophoneIcon, SlidersHorizontalIcon, MonitorIcon, CheckCircleIcon, ArrowRightIcon } from '@phosphor-icons/react';
import ConsoleLayout, { Card, CardLabel } from '../components/ConsoleLayout';
import CTAButton from '../components/CTAButton';

const METER_HEIGHTS = [14, 22, 30, 40, 48, 54, 46, 38, 50, 44, 36, 48, 54, 50, 40, 56, 44, 32, 24, 18, 12, 8, 6, 4];
const METER_ACCENT_INDEX = 7;

const HISTORY_HEIGHTS = [20, 35, 55, 40, 65, 80, 50, 70, 90, 60, 75, 45, 65, 85, 55, 70, 40, 60, 30, 50, 75, 100, 80, 60, 45, 65, 35, 25];
const HISTORY_ACCENT_INDEX = 21;

const inputs = [
  { name: 'Room Mic (MacBook Pro Microphone)', sub: 'Built-in • picks up the room', icon: MicrophoneIcon, disabled: false },
  { name: 'Desk / USB Feed', sub: 'Direct mixer feed • best quality (V1.1)', icon: SlidersHorizontalIcon, disabled: true },
  { name: 'System Audio', sub: 'Captures app / output audio', icon: MonitorIcon, disabled: false },
];

const readouts = [
  { label: 'Transcription engine', value: 'WebGPU Whisper ready' },
  { label: 'Display latency', value: '18ms' },
  { label: 'Sample format', value: '16-bit • 48kHz' },
];

export default function AudioSetup() {
  const navigate = useNavigate();
  const [selectedInput, setSelectedInput] = useState(0);

  return (
    <ConsoleLayout>
      <header style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '64px', justifyContent: 'space-between', paddingInline: '24px' }}>
        <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.03em' }}>
          Audio Setup
        </span>
        <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Step 1 of 3</span>
      </header>

      <main style={{ display: 'flex', flexGrow: 1, flexWrap: 'wrap', gap: '16px', paddingTop: '8px', paddingBottom: 0, paddingInline: '24px' }}>
        <div style={{ display: 'flex', flex: '1.3 1 560px', flexDirection: 'column', gap: '16px' }}>
          <Card style={{ gap: '24px', padding: '26px' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '21px', fontWeight: 600, letterSpacing: '-0.03em', margin: 0 }}>
                Check your audio
              </h2>
              <div style={{ alignItems: 'center', display: 'flex', gap: '7px' }}>
                <CheckCircleIcon size={15} weight="fill" color="#12D453" />
                <span style={{ color: '#12D453', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px', fontWeight: 500 }}>Signal detected</span>
              </div>
            </div>

            <div>
              <div style={{ alignItems: 'flex-end', display: 'flex', gap: '5px', height: '56px', width: '100%' }}>
                {METER_HEIGHTS.map((h, i) => (
                  <div key={i} style={{ backgroundColor: i === METER_ACCENT_INDEX ? '#19A7CE' : '#12D453', borderRadius: '3px', flex: '1 1 0%', height: `${h}px` }} />
                ))}
              </div>
              <p style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px', lineHeight: 1.5, margin: '14px 0 0' }}>
                Speak now. Aim for a steady green level, not clipping into the grey.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <CardLabel>Level history &bull; last 10s</CardLabel>
              <div style={{ alignItems: 'flex-end', display: 'flex', gap: '3px', height: '60px', width: '100%' }}>
                {HISTORY_HEIGHTS.map((h, i) => (
                  <div key={i} style={{ backgroundColor: i === HISTORY_ACCENT_INDEX ? '#12D453' : '#0A273D', borderRadius: '2px', flex: '1 1 0%', height: `${h}%` }} />
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ flex: '1 1 0%', gap: '14px', padding: '22px' }}>
            <CardLabel>Input source</CardLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inputs.map((input, i) => {
                const isSelected = i === selectedInput;
                const Icon = input.icon;
                return (
                  <button
                    key={input.name}
                    type="button"
                    disabled={input.disabled}
                    onClick={() => setSelectedInput(i)}
                    className="toggle-control"
                    data-active={isSelected}
                    style={{
                      alignItems: 'center',
                      backgroundColor: isSelected ? 'rgba(25,167,206,0.10)' : '#0A273D',
                      border: '1px solid transparent',
                      borderRadius: '12px',
                      cursor: input.disabled ? 'default' : 'pointer',
                      display: 'flex',
                      gap: '14px',
                      opacity: input.disabled ? 0.45 : 1,
                      paddingBlock: '14px',
                      paddingInline: '16px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <Icon size={19} weight={isSelected ? 'fill' : 'regular'} color={isSelected ? '#19A7CE' : '#5B6B78'} />
                    <span style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '3px' }}>
                      <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                        {input.name}
                      </span>
                      <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '12px' }}>{input.sub}</span>
                    </span>
                    {isSelected && <CheckCircleIcon size={18} weight="fill" color="#19A7CE" />}
                    {input.disabled && (
                      <span style={{ color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        V1.1
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flex: '1 1 400px', flexDirection: 'column', gap: '16px' }}>
          <Card style={{ flex: '1 1 0%', gap: '18px', padding: '22px' }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
              <span style={{ backgroundColor: '#12D453', borderRadius: '9999px', height: '6px', width: '6px' }} />
              <CardLabel>Stage monitor preview (16:9)</CardLabel>
            </div>
            <div
              style={{
                alignItems: 'center',
                aspectRatio: '16 / 9',
                backgroundColor: '#000B14',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
              }}
            >
              <span style={{ backgroundColor: '#051929', borderRadius: '9999px', color: '#19A7CE', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '-0.03em', paddingBlock: '5px', paddingInline: '12px' }}>
                REVEAL AUDIO SETUP
              </span>
              <span style={{ color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>Standby for service &bull; feed active</span>
              <span style={{ bottom: '14px', color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', position: 'absolute', textTransform: 'uppercase' }}>
                Salford Young Adults
              </span>
            </div>

            <div style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', justifyContent: 'center' }}>
              {readouts.map((r, i) => (
                <div
                  key={r.label}
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    paddingBlock: '12px',
                    ...(i < readouts.length - 1 ? { boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)' } : {}),
                  }}
                >
                  <span style={{ color: '#8D9AA6', flex: 1, fontFamily: '"Geist", system-ui, sans-serif', fontSize: '13px' }}>{r.label}</span>
                  <span style={{ color: '#FCF7F0', fontFamily: '"Geist", system-ui, sans-serif', fontFeatureSettings: '"tnum"', fontSize: '13px', fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      <footer style={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: '72px', justifyContent: 'space-between', paddingInline: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '14px', fontWeight: 500, padding: 0 }}
        >
          Back
        </button>
        <CTAButton onClick={() => navigate('/theme-studio')} style={{ height: '40px', paddingBlock: 0 }}>
          Continue
          <ArrowRightIcon size={16} weight="bold" />
        </CTAButton>
      </footer>
    </ConsoleLayout>
  );
}

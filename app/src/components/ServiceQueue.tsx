import { useState } from 'react';
import { LightningIcon, XIcon, ListPlusIcon, ClockCounterClockwiseIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { Card } from './ConsoleLayout';
import SecondaryButton from './SecondaryButton';
import type { QueuedVerse, VerseDetectionQueueItem } from '../session/RevealSessionProvider';
import type { Confidence } from '../lib/referenceScanner';

interface ServiceQueueProps {
  queue: QueuedVerse[];
  recentDetections?: VerseDetectionQueueItem[];
  onDisplay: (item: QueuedVerse) => void;
  onDismiss: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onDisplayRecent?: (item: VerseDetectionQueueItem) => void;
}

function refLabel(ref: QueuedVerse['ref']): string {
  const v =
    ref.verseStart != null
      ? `:${ref.verseStart}${ref.verseEnd != null && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ''}`
      : '';
  return `${ref.book} ${ref.chapter}${v}`;
}

function confidencePercent(c: Confidence): number {
  return c === 'high' ? 98.4 : c === 'medium' ? 84.0 : 72.0;
}

/**
 * Tabbed card container giving 100% full vertical height to both the curated
 * Service Queue and Recently Detected history. Switches seamlessly between tabs
 * with zero layout shift or clipping.
 */
export default function ServiceQueue({
  queue,
  recentDetections = [],
  onDisplay,
  onDismiss,
  onReorder,
  onDisplayRecent,
}: ServiceQueueProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <Card style={{ flex: '1 1 0%', gap: '12px', padding: '12px 14px', minHeight: 0, overflow: 'visible' }}>
      {/* Segmented Tab Bar */}
      <div style={{ alignItems: 'center', backgroundColor: '#000B14', borderRadius: '8px', display: 'flex', gap: '4px', padding: '3px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          style={{
            alignItems: 'center',
            backgroundColor: activeTab === 'queue' ? '#0A273D' : 'transparent',
            border: activeTab === 'queue' ? '1px solid rgba(25,167,206,0.3)' : '1px solid transparent',
            borderRadius: '6px',
            color: activeTab === 'queue' ? '#FCF7F0' : '#8D9AA6',
            cursor: 'pointer',
            display: 'flex',
            flex: 1,
            fontFamily: '"Geist", system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            gap: '6px',
            justifyContent: 'center',
            paddingBlock: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ListPlusIcon size={14} weight={activeTab === 'queue' ? 'bold' : 'regular'} color={activeTab === 'queue' ? '#19A7CE' : '#8D9AA6'} />
          Service queue
          <span
            style={{
              backgroundColor: activeTab === 'queue' ? 'rgba(25,167,206,0.2)' : 'rgba(255,255,255,0.06)',
              borderRadius: '9999px',
              color: activeTab === 'queue' ? '#19A7CE' : '#8D9AA6',
              fontSize: '10px',
              fontWeight: 600,
              paddingBlock: '1px',
              paddingInline: '6px',
            }}
          >
            {queue.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          style={{
            alignItems: 'center',
            backgroundColor: activeTab === 'recent' ? '#0A273D' : 'transparent',
            border: activeTab === 'recent' ? '1px solid rgba(25,167,206,0.3)' : '1px solid transparent',
            borderRadius: '6px',
            color: activeTab === 'recent' ? '#FCF7F0' : '#8D9AA6',
            cursor: 'pointer',
            display: 'flex',
            flex: 1,
            fontFamily: '"Geist", system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            gap: '6px',
            justifyContent: 'center',
            paddingBlock: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ClockCounterClockwiseIcon size={14} weight={activeTab === 'recent' ? 'bold' : 'regular'} color={activeTab === 'recent' ? '#19A7CE' : '#8D9AA6'} />
          Recent
          <span
            style={{
              backgroundColor: activeTab === 'recent' ? 'rgba(25,167,206,0.2)' : 'rgba(255,255,255,0.06)',
              borderRadius: '9999px',
              color: activeTab === 'recent' ? '#19A7CE' : '#8D9AA6',
              fontSize: '10px',
              fontWeight: 600,
              paddingBlock: '1px',
              paddingInline: '6px',
            }}
          >
            {recentDetections.length}
          </span>
        </button>
      </div>

      {/* Tab Content — 100% full vertical height with smooth scroll */}
      {activeTab === 'queue' ? (
        <div className="scroll-region" style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '8px', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
          {queue.length === 0 ? (
            <div
              style={{
                alignItems: 'center',
                backgroundColor: '#0A273D',
                borderRadius: '12px',
                color: '#8D9AA6',
                display: 'flex',
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: '12px',
                justifyContent: 'center',
                paddingBlock: '16px',
                paddingInline: '14px',
                textAlign: 'center',
              }}
            >
              Stage verses ahead of the service — from a detected card or the manual lookup.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  setDragId(item.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverId(item.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId && dragId !== item.id) onReorder(dragId, item.id);
                  setDragId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setDragOverId(null);
                }}
                style={{
                  alignItems: 'flex-start',
                  backgroundColor: dragOverId === item.id ? 'rgba(25,167,206,0.08)' : '#08202F',
                  border: `1px solid ${dragOverId === item.id ? 'rgba(25,167,206,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingBlock: '10px',
                  paddingInline: '14px',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: '#C9D4DC', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                    {refLabel(item.ref)}
                  </span>
                  {item.label && (
                    <span style={{ backgroundColor: '#051929', borderRadius: '6px', color: '#19A7CE', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em', paddingBlock: '2px', paddingInline: '6px', textTransform: 'uppercase' }}>
                      {item.label}
                    </span>
                  )}
                </div>
                <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <SecondaryButton onClick={() => onDisplay(item)} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '14px' }}>
                    <LightningIcon size={14} weight="fill" />
                    Display
                  </SecondaryButton>
                  <SecondaryButton onClick={() => onDismiss(item.id)} style={{ fontSize: '12px', paddingBlock: '6px', paddingInline: '12px' }}>
                    <XIcon size={14} weight="bold" />
                    Dismiss
                  </SecondaryButton>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="scroll-region" style={{ display: 'flex', flex: '1 1 0%', flexDirection: 'column', gap: '8px', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
          {recentDetections.length === 0 ? (
            <div
              style={{
                alignItems: 'center',
                backgroundColor: '#0A273D',
                borderRadius: '12px',
                color: '#5B6B78',
                display: 'flex',
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: '12px',
                justifyContent: 'center',
                paddingBlock: '16px',
                paddingInline: '14px',
                textAlign: 'center',
              }}
            >
              No verses confirmed yet
            </div>
          ) : (
            recentDetections.map((v) => (
              <div
                key={v.id}
                style={{
                  alignItems: 'center',
                  backgroundColor: '#08202F',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'space-between',
                  minWidth: 0,
                  paddingBlock: '10px',
                  paddingInline: '14px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.03em' }}>
                      {v.batch.ref}
                    </span>
                    <span style={{ color: '#5B6B78', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '10px' }}>
                      {confidencePercent(v.confidence).toFixed(1)}%
                    </span>
                  </div>
                  <span style={{ color: '#8D9AA6', fontFamily: '"Geist", system-ui, sans-serif', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.batch.text}
                  </span>
                </div>
                <SecondaryButton onClick={() => onDisplayRecent?.(v)} style={{ fontSize: '11px', paddingBlock: '6px', paddingInline: '10px', flexShrink: 0 }}>
                  <ArrowCounterClockwiseIcon size={12} weight="regular" />
                  Re-project
                </SecondaryButton>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

import { useState } from 'react';
import { CaretDownIcon, LightningIcon, XIcon, ListPlusIcon } from '@phosphor-icons/react';
import { Card, CardLabel } from './ConsoleLayout';
import SecondaryButton from './SecondaryButton';
import type { QueuedVerse } from '../session/RevealSessionProvider';

interface ServiceQueueProps {
  queue: QueuedVerse[];
  onDisplay: (item: QueuedVerse) => void;
  onDismiss: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

function refLabel(ref: QueuedVerse['ref']): string {
  const v =
    ref.verseStart != null
      ? `:${ref.verseStart}${ref.verseEnd != null && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ''}`
      : '';
  return `${ref.book} ${ref.chapter}${v}`;
}

/**
 * Operator-curated list of planned verses. SUBORDINATE to the live detection
 * flow — it augments, never replaces. Reorder is HTML5 drag-and-drop onto
 * another row (calls onReorder → session reorders the canonical queue). No
 * layout shift of the column beside it.
 */
export default function ServiceQueue({ queue, onDisplay, onDismiss, onReorder }: ServiceQueueProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <Card style={{ flexShrink: 0, gap: '10px', padding: '12px 14px' }}>
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
          <ListPlusIcon size={14} weight="bold" color="#19A7CE" />
          <CardLabel>Service queue</CardLabel>
          <span
            style={{
              backgroundColor: '#0A273D',
              borderRadius: '9999px',
              color: '#8D9AA6',
              fontFamily: '"Geist", system-ui, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              paddingBlock: '1px',
              paddingInline: '7px',
            }}
          >
            {queue.length}
          </span>
        </div>
        <CaretDownIcon
          size={14}
          color="#8D9AA6"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.18s cubic-bezier(0.77, 0, 0.175, 1)' }}
        />
      </div>

      {!collapsed && (
        <div className="scroll-region" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
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
                paddingBlock: '14px',
                paddingInline: '12px',
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
      )}
    </Card>
  );
}

import { useState, type ReactNode } from 'react';
import Sidebar, { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from './Sidebar';

/**
 * Shell for every operator-facing screen: a fixed icon rail (pinned via
 * position:fixed so it never scrolls with the page) + a fluid content
 * column offset by the rail's current width, so the footer always lands
 * at the true bottom of the viewport.
 */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div style={{ backgroundColor: '#000B14', display: 'flex', height: '100dvh', maxHeight: '100dvh', overflow: 'hidden', overscrollBehavior: 'none', width: '100%' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div
        className="content-shell"
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          height: '100dvh',
          maxHeight: '100dvh',
          marginLeft: `${sidebarWidth}px`,
          minWidth: 0,
          overflow: 'hidden',
          transition: 'margin-left 0.22s cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function TopBar({ pill, right }: { pill: string; right?: ReactNode }) {
  return (
    <header
      style={{
        alignItems: 'center',
        display: 'flex',
        flexShrink: 0,
        gap: '14px',
        height: '64px',
        justifyContent: 'space-between',
        paddingInline: '32px',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
        <span style={{ color: '#FCF7F0', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.03em' }}>
          {pill}
        </span>
      </div>
      {right}
    </header>
  );
}

/** Card surface: separated from the page by background layering only — no stroke. */
export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: '#141417',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        color: '#8D9AA6',
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.06em',
        lineHeight: '14px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

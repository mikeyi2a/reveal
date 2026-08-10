import { useLocation, useNavigate } from 'react-router-dom';
import {
  BroadcastIcon,
  BookOpenIcon,
  PaletteIcon,
  SlidersIcon,
  ProjectorScreenIcon,
  GearIcon,
  SidebarSimpleIcon,
} from '@phosphor-icons/react';
import { openProjectorWindow } from '../lib/revealStore';

const navItems = [
  { label: 'Live Console', icon: BroadcastIcon, path: '/dashboard' },
  { label: 'Audio Input', icon: SlidersIcon, path: '/audio-setup' },
  { label: 'Theme Studio', icon: PaletteIcon, path: '/theme-studio' },
  { label: 'Projector', icon: ProjectorScreenIcon, path: '/projector' },
  { label: 'Bible Search', icon: BookOpenIcon, path: null },
  { label: 'Settings', icon: GearIcon, path: null },
];

export const SIDEBAR_WIDTH_COLLAPSED = 68;
export const SIDEBAR_WIDTH_EXPANDED = 216;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside
      className="sidebar-rail"
      style={{
        backgroundColor: '#03111C',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        justifyContent: 'space-between',
        left: 0,
        paddingBlock: '18px',
        position: 'fixed',
        top: 0,
        transition: 'width 0.22s cubic-bezier(0.77, 0, 0.175, 1)',
        width: collapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Collapsed: the toggle IS the header, standing in for the logo. */}
        {/* Expanded: wordmark on the left, toggle on the right. */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'space-between',
            overflow: 'hidden',
            paddingInline: collapsed ? 0 : '16px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            title="Go to home"
            className="nav-label"
            style={{
              background: 'none',
              border: 'none',
              color: '#19A7CE',
              cursor: 'pointer',
              fontFamily: '"Figtree", system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              opacity: collapsed ? 0 : 1,
              padding: 0,
              position: collapsed ? 'absolute' : 'static',
              transform: collapsed ? 'translateX(-8px)' : 'translateX(0)',
              transition: 'opacity 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            REVEAL
          </button>
          <button
            type="button"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggle}
            className="nav-item"
            style={{
              alignItems: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              color: '#5B6B78',
              cursor: 'pointer',
              display: 'flex',
              height: '32px',
              justifyContent: 'center',
              width: '32px',
            }}
          >
            <SidebarSimpleIcon size={19} weight="regular" />
          </button>
        </div>

        <nav style={{ alignItems: collapsed ? 'center' : 'stretch', display: 'flex', flexDirection: 'column', gap: '4px', paddingInline: collapsed ? 0 : '10px' }}>
          {navItems.map((item) => {
            const isActive = item.path === pathname;
            const Icon = item.icon;
            const isDisabled = item.path === null;
            return (
              <button
                key={item.label}
                type="button"
                title={isDisabled ? `${item.label} (coming in V1.1)` : item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                disabled={isDisabled}
                onClick={() => {
                  if (item.path === '/projector') {
                    // The projector is a dedicated output surface — always send
                    // it to a new window so the operator console stays put.
                    openProjectorWindow();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="nav-item"
                style={{
                  alignItems: 'center',
                  background: isActive ? '#19A7CE' : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: isActive ? 'inset 0px 0px 6px 1px rgba(255, 255, 255, 0.25)' : 'none',
                  color: isActive ? '#FFFFFF' : '#5B6B78',
                  cursor: isDisabled ? 'default' : 'pointer',
                  display: 'flex',
                  gap: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '40px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  opacity: isDisabled ? 0.45 : 1,
                  paddingInline: collapsed ? 0 : '11px',
                  width: collapsed ? '40px' : '100%',
                }}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} style={{ flexShrink: 0 }} />
                <span
                  className="nav-label"
                  style={{
                    fontFamily: '"Geist", system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    opacity: collapsed ? 0 : 1,
                    position: collapsed ? 'absolute' : 'static',
                    transform: collapsed ? 'translateX(-8px)' : 'translateX(0)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: '8px', justifyContent: collapsed ? 'center' : 'flex-start', overflow: 'hidden', paddingInline: collapsed ? 0 : '16px', position: 'relative' }}>
        <div title="Offline-ready" style={{ backgroundColor: '#12D453', borderRadius: '9999px', flexShrink: 0, height: '7px', width: '7px' }} />
        <span
          className="nav-label"
          style={{
            color: '#5B6B78',
            fontFamily: '"Geist", system-ui, sans-serif',
            fontSize: '11px',
            opacity: collapsed ? 0 : 1,
            position: collapsed ? 'absolute' : 'static',
            transform: collapsed ? 'translateX(-8px)' : 'translateX(0)',
            whiteSpace: 'nowrap',
          }}
        >
          Offline-ready
        </span>
      </div>
    </aside>
  );
}

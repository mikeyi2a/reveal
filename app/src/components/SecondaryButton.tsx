import type { ButtonHTMLAttributes, CSSProperties } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  style?: CSSProperties;
  danger?: boolean;
}

/**
 * Matte fill + hairline stroke, no bevel — for non-primary actions
 * (Dismiss, Re-Project, Back-as-button variants).
 */
export default function SecondaryButton({ children, style, disabled, className, danger, ...rest }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={['btn-secondary', danger && 'btn-secondary-danger', className].filter(Boolean).join(' ')}
      style={{
        alignItems: 'center',
        backgroundColor: danger ? 'rgba(239, 68, 68, 0.10)' : '#0A273D',
        border: danger ? '1px solid rgba(239, 68, 68, 0.30)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        boxSizing: 'border-box',
        boxShadow: danger
          ? '0px 1px 2px 0px rgba(0, 0, 0, 0.25), 0px 0px 0px 1px rgba(239, 68, 68, 0.22), inset 0px 0px 7px 1px rgba(239, 68, 68, 0.15)'
          : '0px 1px 2px 0px rgba(0, 0, 0, 0.25), 0px 0px 0px 1px rgba(0, 0, 0, 0.22), inset 0px 0px 7px 1px rgba(255, 255, 255, 0.04)',
        color: danger ? '#EF4444' : '#FCF7F0',
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        gap: '8px',
        justifyContent: 'center',
        lineHeight: '24px',
        opacity: disabled ? 0.5 : 1,
        paddingBlock: '9px',
        paddingInline: '20px',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

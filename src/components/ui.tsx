import React from 'react';
import { fmtHrs } from '../data';

// ── Icons ────────────────────────────────────────────────────────────────────

interface IconProps {
  d?: string;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const Icon: React.FC<IconProps> = ({
  d, size = 16, fill = 'none', stroke = 'currentColor', strokeWidth = 1.5,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={fill} stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

export const IconPlus      = (p: { size?: number }) => <Icon {...p} d="M8 3v10M3 8h10" />;
export const IconClose     = (p: { size?: number }) => <Icon {...p} d="M4 4l8 8M12 4l-8 8" />;
export const IconClock     = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" />
  </svg>
);
export const IconUser      = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="6" r="2.5" /><path d="M3 13.5c.7-2.4 2.7-3.5 5-3.5s4.3 1.1 5 3.5" />
  </svg>
);
export const IconBuilding  = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2.5" width="10" height="11" rx="0.5" />
    <path d="M5.5 5.5h1M9.5 5.5h1M5.5 8h1M9.5 8h1M5.5 10.5h1M9.5 10.5h1M7 13.5v-2h2v2" />
  </svg>
);
export const IconCalendar  = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
  </svg>
);
export const IconCheck     = (p: { size?: number }) => <Icon {...p} d="M3 8.5l3 3 7-7" />;
export const IconChevDown  = (p: { size?: number }) => <Icon {...p} d="M4 6l4 4 4-4" />;
export const IconChevRight = (p: { size?: number }) => <Icon {...p} d="M6 4l4 4-4 4" />;
export const IconArrowRight= (p: { size?: number }) => <Icon {...p} d="M3 8h10M9 4l4 4-4 4" />;
export const IconEdit      = (p: { size?: number }) => <Icon {...p} d="M11 2.5l2.5 2.5L6 12.5H3.5V10z" />;
export const IconTrash     = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4.5h10M6 4.5V3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5M5 4.5l.5 8a.5.5 0 00.5.5h4a.5.5 0 00.5-.5l.5-8" />
  </svg>
);
export const IconWarning   = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2.5l6 11H2z" /><path d="M8 7v3M8 12h0" strokeWidth="1.5" />
  </svg>
);
export const IconSparkle   = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4z" />
  </svg>
);

// ── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const bg = `oklch(0.92 0.04 ${h})`;
  const fg = `oklch(0.40 0.06 ${h})`;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      fontSize: size * 0.42, fontWeight: 600, letterSpacing: '0.02em',
      flexShrink: 0,
    }}>{initials}</span>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar({
  used, included, height = 8, showLabels = false,
}: {
  used: number; included: number; height?: number; showLabels?: boolean;
}) {
  const pct = included === 0 ? 0 : (used / included) * 100;
  const isOver = pct > 100;
  const cappedPct = Math.min(100, pct);
  const overPct = isOver ? Math.min(50, ((used - included) / included) * 100) : 0;

  let color = 'var(--accent)';
  if (pct >= 100) color = 'var(--danger)';
  else if (pct >= 80) color = 'var(--warn)';

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        position: 'relative', width: '100%', height,
        background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${cappedPct}%`, background: color,
          borderRadius: 999, transition: 'width .4s cubic-bezier(.3,.7,.4,1)',
        }} />
        {isOver && (
          <div style={{
            position: 'absolute', top: 0, left: '100%', height: '100%',
            width: `${overPct}%`, background: 'var(--danger)',
            transform: 'translateX(-100%)',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,.18) 0 4px, transparent 4px 8px)',
            borderTopRightRadius: 999, borderBottomRightRadius: 999,
            transition: 'width .4s cubic-bezier(.3,.7,.4,1)',
          }} />
        )}
      </div>
      {showLabels && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 6, fontSize: 11, color: 'var(--text-3)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span>{fmtHrs(used)}h used</span>
          <span>{fmtHrs(included)}h included</span>
        </div>
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open, onClose, title, children, footer, width = 440,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fade .15s ease-out',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width, maxWidth: 'min(100%, calc(100vw - 32px))', maxHeight: 'calc(100vh - 48px)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        animation: 'rise .2s cubic-bezier(.3,.7,.4,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 0, color: 'var(--text-3)',
            width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}><IconClose /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            background: 'var(--surface-0)',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  children, onClick, variant = 'ghost', size = 'md', icon, disabled, type = 'button',
}: {
  children?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const styles: Record<ButtonVariant, { bg: string; fg: string; border: string; hov: string }> = {
    primary:   { bg: 'var(--accent)',     fg: '#fff',            border: 'transparent',     hov: 'var(--accent-hover)' },
    secondary: { bg: 'var(--surface-2)', fg: 'var(--text-1)',   border: 'var(--border)',    hov: 'var(--surface-3)' },
    ghost:     { bg: 'transparent',      fg: 'var(--text-2)',   border: 'transparent',     hov: 'var(--surface-2)' },
    danger:    { bg: 'transparent',      fg: 'var(--danger)',   border: 'transparent',     hov: 'rgba(220,80,60,.1)' },
  };
  const sz: Record<ButtonSize, { h: number; px: number; fs: number }> = {
    sm: { h: 28, px: 10, fs: 12 },
    md: { h: 32, px: 12, fs: 13 },
    lg: { h: 38, px: 16, fs: 13 },
  };
  const s = styles[variant];
  const z = sz[size];
  const [hov, setHov] = React.useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: z.h, padding: `0 ${z.px}px`, fontSize: z.fs, fontWeight: 500,
        background: hov && !disabled ? s.hov : s.bg,
        color: s.fg,
        border: `1px solid ${s.border === 'transparent' ? 'transparent' : s.border}`,
        borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit', letterSpacing: '0',
        transition: 'background .12s',
        whiteSpace: 'nowrap',
      }}>
      {icon}{children}
    </button>
  );
}

// ── Form atoms ───────────────────────────────────────────────────────────────

export function Field({
  label, hint, children, error,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      {children}
      {hint && !error && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </label>
  );
}

export function Input({
  value, onChange, placeholder, type = 'text', suffix,
}: {
  value: string | number;
  onChange: (v: string | number) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--surface-0)',
      border: '1px solid var(--border)',
      borderRadius: 7, height: 34, padding: '0 10px',
      transition: 'border-color .12s',
    }}
    onFocusCapture={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)'}
    onBlurCapture={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}>
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{
          flex: 1, minWidth: 0, height: '100%',
          background: 'transparent', border: 0, outline: 'none',
          color: 'var(--text-1)', fontSize: 13, fontFamily: 'inherit',
          fontVariantNumeric: type === 'number' ? 'tabular-nums' : 'normal',
        }} />
      {suffix && (
        <span style={{ color: 'var(--text-3)', fontSize: 12, marginLeft: 6 }}>{suffix}</span>
      )}
    </div>
  );
}

export function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 7, padding: '8px 10px',
        color: 'var(--text-1)', fontSize: 13,
        fontFamily: 'inherit', resize: 'vertical', outline: 'none',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
  );
}

export function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        height: 34, padding: '0 28px 0 10px',
        background: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 7, color: 'var(--text-1)',
        fontSize: 13, fontFamily: 'inherit', outline: 'none',
        appearance: 'none', WebkitAppearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%23999' d='M0 0h10L5 6z'/></svg>\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
      }}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

export function Toggle({
  value, onChange, label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
        fontFamily: 'inherit', color: 'var(--text-2)', fontSize: 13,
      }}>
      <span style={{
        position: 'relative', width: 30, height: 18, borderRadius: 999,
        background: value ? 'var(--accent)' : 'var(--surface-3)',
        transition: 'background .15s',
        display: 'inline-block',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff',
          transform: value ? 'translateX(12px)' : 'translateX(0)',
          transition: 'transform .15s',
          display: 'block',
        }} />
      </span>
      {label}
    </button>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────

type PillTone = 'ok' | 'warn' | 'over' | 'muted';

export function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  const tones: Record<PillTone, { bg: string; fg: string }> = {
    ok:    { bg: 'oklch(0.55 0.13 150 / 0.12)', fg: 'oklch(0.42 0.13 150)' },
    warn:  { bg: 'oklch(0.68 0.14 70 / 0.16)',  fg: 'oklch(0.45 0.13 60)' },
    over:  { bg: 'oklch(0.58 0.20 28 / 0.12)',  fg: 'oklch(0.50 0.20 28)' },
    muted: { bg: 'var(--surface-2)',             fg: 'var(--text-3)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 20, padding: '0 8px', borderRadius: 999,
      background: t.bg, color: t.fg,
      fontSize: 11, fontWeight: 500, letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

export function useIsMobile(bp = 640): boolean {
  const [mobile, setMobile] = React.useState(() => window.innerWidth < bp);
  React.useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return mobile;
}

export function statusForUsage({ pct, overHours }: { pct: number; overHours: number }) {
  if (overHours > 0) return { tone: 'over' as PillTone, label: 'Over budget' };
  if (pct >= 80) return { tone: 'warn' as PillTone, label: 'Near limit' };
  return { tone: 'ok' as PillTone, label: 'On track' };
}

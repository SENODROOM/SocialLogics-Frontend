// ── Reusable UI primitives ─────────────────────────────────────────────────────

export function Spinner({ size = 20, color = 'var(--c-cyan)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.08)`,
      borderTopColor: color,
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

export function Badge({ children, color = 'var(--c-cyan)', size = 'sm' }) {
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs = size === 'sm' ? '0.6rem' : '0.7rem';
  return (
    <span style={{
      padding: pad, borderRadius: 'var(--r-full)',
      border: `1px solid ${color}50`,
      background: color + '15',
      color, fontFamily: 'var(--f-display)',
      fontSize: fs, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>{children}</span>
  );
}

export function SectionHeader({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(0,212,255,0.55)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(0,212,255,0.25),transparent)' }} />
      {action && action}
    </div>
  );
}

export function PlatformTag({ platform, size = 'sm' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 'var(--r-full)',
      border: `1px solid ${platform.color}40`,
      background: platform.color + '12',
      color: platform.color,
      fontFamily: 'var(--f-display)', fontWeight: 700,
      fontSize: size === 'sm' ? '0.6rem' : '0.7rem',
      letterSpacing: '0.06em',
    }}>
      <span>{platform.icon}</span>
      {size !== 'xs' && <span>{platform.name}</span>}
    </span>
  );
}

export function StatCard({ label, value, icon, color = 'var(--c-cyan)', trend }) {
  return (
    <div style={{
      background: 'var(--c-surface)', border: '1px solid var(--c-border)',
      borderRadius: 'var(--r-lg)', padding: '20px 22px',
      borderTop: `2px solid ${color}`,
      transition: 'all var(--t-mid)',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-surface2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-surface)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--c-text3)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '2rem', color, lineHeight: 1 }}>{value}</span>
        {trend !== undefined && (
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: trend >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon = '⌕', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-text3)', marginBottom: 8 }}>{title}</div>
      {subtitle && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.8rem', color: 'var(--c-text4)', marginBottom: 20 }}>{subtitle}</div>}
      {action && action}
    </div>
  );
}

export function CornerBrackets({ size = 14, color = 'rgba(0,212,255,0.4)', style: extraStyle = {} }) {
  const s = { position: 'absolute', width: size, height: size, borderColor: color, borderStyle: 'solid' };
  return (
    <div style={{ position: 'absolute', inset: -8, pointerEvents: 'none', ...extraStyle }}>
      <div style={{ ...s, top: 0, left: 0, borderWidth: '2px 0 0 2px', borderRadius: '2px 0 0 0' }} />
      <div style={{ ...s, top: 0, right: 0, borderWidth: '2px 2px 0 0', borderRadius: '0 2px 0 0' }} />
      <div style={{ ...s, bottom: 0, left: 0, borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 2px' }} />
      <div style={{ ...s, bottom: 0, right: 0, borderWidth: '0 2px 2px 0', borderRadius: '0 0 2px 0' }} />
    </div>
  );
}

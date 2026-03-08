import { useState } from 'react';
import { PLATFORMS, PLATFORM_CATEGORIES } from '../../utils/constants';

function PlatformCard({ platform, query, onSearch, compact = false }) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (urlType = 'main') => {
    if (onSearch) onSearch(platform, urlType);
  };

  if (compact) return (
    <div
      onClick={() => handleClick()}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        background: hovered ? 'var(--c-surface2)' : 'var(--c-surface)',
        border: `1px solid ${hovered ? platform.color + '60' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-md)', cursor: 'pointer',
        transition: 'all var(--t-mid)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 4px 20px ${platform.color}18` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', border: `1px solid ${platform.color}50`, background: platform.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: platform.color, fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
        {platform.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: '0.72rem', fontWeight: 700, color: hovered ? platform.color : 'var(--c-text)', transition: 'color var(--t-fast)' }}>{platform.name}</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', color: 'var(--c-text4)', marginTop: 1 }} className="truncate">{platform.desc}</div>
      </div>
      <span style={{ color: 'var(--c-text4)', fontSize: '0.75rem', marginLeft: 'auto', transition: 'color var(--t-fast)', ...(hovered && { color: platform.color }) }}>→</span>
    </div>
  );

  return (
    <div
      style={{
        background: hovered ? 'var(--c-surface2)' : 'var(--c-surface)',
        border: `1px solid ${hovered ? platform.color + '70' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-lg)', padding: '20px 22px',
        transition: 'all var(--t-mid)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 12px 40px ${platform.color}20, var(--shadow-md)` : 'none',
        borderLeft: `3px solid ${platform.color}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', border: `1.5px solid ${platform.color}50`, background: platform.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: platform.color, fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
          {platform.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '0.85rem', fontWeight: 800, color: platform.color, marginBottom: 2 }}>{platform.name}</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.62rem', color: 'var(--c-text3)' }} className="truncate">{platform.desc}</div>
        </div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: '0.58rem', color: 'var(--c-text4)', textAlign: 'right', flexShrink: 0 }}>
          <div>{platform.monthlyUsers}</div>
          <div style={{ marginTop: 2, opacity: 0.6 }}>users</div>
        </div>
      </div>

      {/* Main search button */}
      <button
        onClick={() => handleClick('main')}
        style={{
          width: '100%', padding: '10px', marginBottom: 8,
          background: hovered ? platform.color + '25' : platform.color + '15',
          border: `1px solid ${platform.color}50`, borderRadius: 'var(--r-sm)',
          color: platform.color, fontFamily: 'var(--f-display)', fontWeight: 700,
          fontSize: '0.7rem', letterSpacing: '0.1em', transition: 'all var(--t-fast)',
        }}
      >
        {query ? `SEARCH "${query.length > 18 ? query.substring(0, 18) + '…' : query}"` : 'OPEN PLATFORM'} →
      </button>
    </div>
  );
}

export default function PlatformGrid({ query, onSearch, compact = false }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const filtered = activeCategory === 'all'
    ? PLATFORMS.filter(p => p.id !== 'all')
    : PLATFORMS.filter(p => p.category === activeCategory);

  return (
    <div>
      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {PLATFORM_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--r-full)',
              background: activeCategory === cat.id ? 'rgba(0,212,255,0.12)' : 'transparent',
              border: `1px solid ${activeCategory === cat.id ? 'var(--c-cyan)' : 'var(--c-border2)'}`,
              color: activeCategory === cat.id ? 'var(--c-cyan)' : 'var(--c-text3)',
              fontFamily: 'var(--f-body)', fontSize: '0.75rem', fontWeight: 500,
              transition: 'all var(--t-fast)',
            }}
          >{cat.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(auto-fill,minmax(200px,1fr))' : 'repeat(auto-fill,minmax(240px,1fr))', gap: compact ? 8 : 12 }}>
        {filtered.map(p => (
          <PlatformCard key={p.id} platform={p} query={query} onSearch={onSearch} compact={compact} />
        ))}
      </div>

      <div style={{ marginTop: 14, fontFamily: 'var(--f-mono)', fontSize: '0.65rem', color: 'var(--c-text4)', textAlign: 'right' }}>
        Showing {filtered.length} of {PLATFORMS.length - 1} platforms
      </div>
    </div>
  );
}

export { PlatformCard };

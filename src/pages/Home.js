import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { trendingAPI } from '../utils/api';
import { PLATFORMS, CATEGORIES } from '../utils/constants';
import { searchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    trendingAPI.get(12).then(r => setTrending(r.data.trending)).catch(() => {});
  }, []);

  const handleSearch = (data) => {
    const { query, platform, results } = data;
    results.forEach((r, i) => setTimeout(() => window.open(r.url, '_blank'), i * 120));
    toast.success(`Opened ${results.length} platform${results.length > 1 ? 's' : ''}`);
    navigate(`/search?q=${encodeURIComponent(query)}&platform=${platform}`);
  };

  const handleCategory = async (tag) => {
    setActiveCat(tag);
    try {
      const res = await searchAPI.search(tag, 'all');
      res.data.results.slice(0, 5).forEach((r, i) => setTimeout(() => window.open(r.url, '_blank'), i * 120));
      toast.success(`Searching "${tag}" on top platforms`);
    } catch {}
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 0 60px' }} className="animate-fadeInUp">
        {/* Logo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, border: '2px solid #00f5ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#00f5ff', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}>⬡</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem,7vw,5rem)', letterSpacing: '0.08em', background: 'linear-gradient(135deg,#00f5ff 0%,#fff 40%,#00f5ff 60%,#0080ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SocialLogics
            </h1>
          </div>
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(0,245,255,0.5)', letterSpacing: '0.35em', marginBottom: 48, textTransform: 'uppercase' }}>
          Unified Video Search Engine · 14 Platforms
        </p>

        {/* Search */}
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -8, left: -8, width: 16, height: 16, borderTop: '2px solid rgba(0,245,255,0.5)', borderLeft: '2px solid rgba(0,245,255,0.5)' }} />
          <div style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderTop: '2px solid rgba(0,245,255,0.5)', borderRight: '2px solid rgba(0,245,255,0.5)' }} />
          <div style={{ position: 'absolute', bottom: -8, left: -8, width: 16, height: 16, borderBottom: '2px solid rgba(0,245,255,0.5)', borderLeft: '2px solid rgba(0,245,255,0.5)' }} />
          <div style={{ position: 'absolute', bottom: -8, right: -8, width: 16, height: 16, borderBottom: '2px solid rgba(0,245,255,0.5)', borderRight: '2px solid rgba(0,245,255,0.5)' }} />
          <SearchBar large onSearch={handleSearch} />
        </div>

        {/* Stats badges */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          {['14 PLATFORMS', 'VIDEOS', 'REELS', 'SHORTS', 'LIVE STREAMS', 'POSTS'].map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-display)', fontSize: '0.58rem', padding: '4px 12px', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 3, color: 'rgba(0,245,255,0.5)', letterSpacing: '0.15em' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div style={{ marginBottom: 56 }} className="animate-fadeInUp-delay1">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            TRENDING NOW
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(0,245,255,0.3),transparent)' }} />
          </div>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
              {trending.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleCategory(t.query)}
                  style={{
                    padding: '8px 16px', borderRadius: 3, whiteSpace: 'nowrap',
                    background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)',
                    color: 'rgba(224,232,240,0.7)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(0,245,255,0.1)'; e.currentTarget.style.borderColor='rgba(0,245,255,0.4)'; e.currentTarget.style.color='#00f5ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(0,245,255,0.04)'; e.currentTarget.style.borderColor='rgba(0,245,255,0.15)'; e.currentTarget.style.color='rgba(224,232,240,0.7)'; }}
                >
                  🔥 {t.query}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div style={{ marginBottom: 56 }} className="animate-fadeInUp-delay2">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          BROWSE BY CATEGORY
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(0,245,255,0.3),transparent)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.tag}
              onClick={() => handleCategory(c.tag)}
              style={{
                padding: '9px 18px', borderRadius: 3,
                background: activeCat === c.tag ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeCat === c.tag ? 'rgba(0,245,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: activeCat === c.tag ? '#00f5ff' : 'rgba(224,232,240,0.6)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem',
                transition: 'all 0.2s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform grid */}
      <div className="animate-fadeInUp-delay3">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          PLATFORMS
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(0,245,255,0.3),transparent)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
          {PLATFORMS.filter(p => p.id !== 'all').map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/search?platform=${p.id}`)}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 6, padding: '16px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.22s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=p.color+'80'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${p.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 4, border: `1px solid ${p.color}60`, background: p.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, color: p.color, letterSpacing: '0.05em' }}>{p.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

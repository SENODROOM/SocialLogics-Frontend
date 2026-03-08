import { useState, useEffect } from 'react';
import { usersAPI, trendingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PLATFORMS } from '../utils/constants';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, color = '#00f5ff', icon }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '24px', borderTop: `3px solid ${color}` }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '1.8rem' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color }}>{value}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.stats(),
      trendingAPI.get(10),
    ]).then(([statsRes, trendRes]) => {
      setStats(statsRes.data);
      setTrending(trendRes.data.trending);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'rgba(0,245,255,0.4)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.3em' }}>
      LOADING DASHBOARD...
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 6 }}>WELCOME BACK</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.05em' }}>
          @<span style={{ color: '#00f5ff' }}>{user?.username}</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
          Member since {new Date(user?.createdAt).toLocaleDateString()} · Last login {new Date(user?.lastLogin).toLocaleString()}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 48 }}>
          <StatCard label="TOTAL SEARCHES" value={stats.totalSearches} icon="⌕" color="#00f5ff" />
          <StatCard label="BOOKMARKS" value={stats.totalBookmarks} icon="☆" color="#9146FF" />
          <StatCard label="PLATFORMS USED" value={stats.topPlatforms?.length || 0} icon="⬡" color="#FF4500" />
          <StatCard label="SAVED SEARCHES" value={user?.savedSearches?.length || 0} icon="★" color="#FFD700" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Top platforms */}
        {stats?.topPlatforms?.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(0,245,255,0.5)', marginBottom: 20 }}>YOUR TOP PLATFORMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topPlatforms.map((p, i) => {
                const pd = PLATFORMS.find(pl => pl.id === p._id);
                const pct = Math.round((p.count / stats.totalSearches) * 100);
                return (
                  <div key={p._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: pd?.color || '#00f5ff' }}>
                        {pd?.icon} {pd?.name || p._id}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{p.count} · {pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: pd?.color || '#00f5ff', borderRadius: 2, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trending */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(0,245,255,0.5)', marginBottom: 20 }}>🔥 GLOBAL TRENDING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trending.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'rgba(0,245,255,0.3)', width: 20, textAlign: 'right' }}>#{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', flex: 1 }}>{t.query}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { to: '/search', label: 'NEW SEARCH', color: '#00f5ff' },
          { to: '/history', label: 'VIEW HISTORY', color: '#9146FF' },
          { to: '/bookmarks', label: 'MY BOOKMARKS', color: '#FF4500' },
          { to: '/profile', label: 'EDIT PROFILE', color: '#FFD700' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{
            padding: '12px 24px', border: `1px solid ${a.color}50`,
            borderRadius: 4, color: a.color, background: a.color + '12',
            fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.12em', textDecoration: 'none', transition: 'all 0.2s',
          }}>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

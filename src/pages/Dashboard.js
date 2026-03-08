import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, searchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PLATFORMS } from '../utils/constants';
import { StatCard, SectionHeader } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([usersAPI.stats(), searchAPI.trending(10, 'daily')])
      .then(([s, t]) => { setStats(s.data.data); setTrending(t.data.data.trending || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'70vh',gap:14,flexDirection:'column' }}>
      <div style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(0,212,255,0.1)',borderTop:'2px solid var(--c-cyan)',animation:'spin .8s linear infinite' }} />
      <span style={{ fontFamily:'var(--f-display)',fontSize:'0.7rem',letterSpacing:'0.3em',color:'var(--c-text3)' }}>LOADING DASHBOARD</span>
    </div>
  );

  const maxPlatformCount = stats?.topPlatforms?.[0]?.count || 1;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--c-text3)', marginBottom: 8 }}>WELCOME BACK</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '2rem' }}>
          @<span style={{ color: 'var(--c-cyan)' }}>{user?.username}</span>
        </h1>
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--c-text3)', marginTop: 8 }}>
          Member since {new Date(user?.createdAt).toLocaleDateString()} · {user?.loginStreak || 0} day login streak
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 48 }}>
          <StatCard label="Total Searches" value={stats.totalSearches?.toLocaleString() || 0} icon="⌕" color="var(--c-cyan)" />
          <StatCard label="This Month" value={stats.recentSearches?.toLocaleString() || 0} icon="📈" color="var(--c-green)" />
          <StatCard label="Bookmarks" value={stats.totalBookmarks?.toLocaleString() || 0} icon="★" color="var(--c-gold)" />
          <StatCard label="Platforms Used" value={stats.topPlatforms?.length || 0} icon="⬡" color="var(--c-accent2)" />
          <StatCard label="Login Streak" value={`${user?.loginStreak || 0}d`} icon="🔥" color="var(--c-red)" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top platforms */}
        {stats?.topPlatforms?.length > 0 && (
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '24px' }}>
            <SectionHeader>Your top platforms</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats.topPlatforms.map((p, i) => {
                const pd = PLATFORMS.find(pl => pl.id === p._id);
                const pct = Math.round((p.count / maxPlatformCount) * 100);
                return (
                  <div key={p._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.8rem', color: pd?.color || 'var(--c-cyan)' }}>
                        {pd?.icon} {pd?.name || p._id}
                      </span>
                      <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.65rem', color: 'var(--c-text3)' }}>{p.count.toLocaleString()} searches</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: pd?.color || 'var(--c-cyan)', borderRadius: 3, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trending */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '24px' }}>
          <SectionHeader>🔥 Today's trending</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trending.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.65rem', color: i < 3 ? 'var(--c-gold)' : 'var(--c-text4)', width: 22, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.82rem', flex: 1 }} className="truncate">{t.displayQuery || t.query}</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.62rem', color: 'var(--c-text4)', flexShrink: 0 }}>{t.dailyCount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top queries */}
      {stats?.topQueries?.length > 0 && (
        <div style={{ marginTop: 20, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '24px' }}>
          <SectionHeader>Your most-searched terms</SectionHeader>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stats.topQueries.map((q, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--c-bg2)', border: '1px solid var(--c-border2)', borderRadius: 'var(--r-full)' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem' }}>{q._id}</span>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.6rem', color: 'var(--c-text3)' }}>×{q.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { to: '/search', label: '⌕ New Search', color: 'var(--c-cyan)' },
          { to: '/history', label: '↩ History', color: 'var(--c-accent2)' },
          { to: '/bookmarks', label: '★ Bookmarks', color: 'var(--c-gold)' },
          { to: '/profile', label: '◎ Profile', color: 'var(--c-green)' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ padding: '12px 22px', border: `1px solid ${a.color}40`, borderRadius: 'var(--r-md)', color: a.color, background: a.color + '10', fontFamily: 'var(--f-display)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', transition: 'all var(--t-mid)' }}
            onMouseEnter={e => { e.currentTarget.style.background = a.color + '20'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = a.color + '10'; e.currentTarget.style.transform = 'none'; }}
          >{a.label}</Link>
        ))}
      </div>
    </div>
  );
}

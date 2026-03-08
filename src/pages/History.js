import { useState, useEffect } from 'react';
import { historyAPI, searchAPI } from '../utils/api';
import { PLATFORMS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function History() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await historyAPI.get(p);
      setHistory(res.data.history);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(p);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await historyAPI.delete(id);
    setHistory(h => h.filter(i => i._id !== id));
    setTotal(t => t - 1);
    toast.success('Removed');
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all search history?')) return;
    await historyAPI.clear();
    setHistory([]); setTotal(0);
    toast.success('History cleared');
  };

  const reSearch = async (item) => {
    try {
      const res = await searchAPI.search(item.query, item.platform);
      res.data.results.forEach((r, i) => setTimeout(() => window.open(r.url, '_blank'), i * 120));
      toast.success('Searching again...');
    } catch { toast.error('Search failed'); }
  };

  const getPlatformColor = (id) => PLATFORMS.find(p => p.id === id)?.color || '#00f5ff';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 6 }}>MY ACCOUNT</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.05em' }}>Search History</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{total} searches recorded</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearAll} style={{ padding: '9px 18px', background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 4, color: '#ff6060', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>
            CLEAR ALL
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(0,245,255,0.4)', fontFamily: 'var(--font-mono)' }}>LOADING...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(0,245,255,0.2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>NO SEARCH HISTORY YET</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(item => (
              <div key={item._id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 6, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: getPlatformColor(item.platform), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#e0e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.query}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                    <span style={{ color: getPlatformColor(item.platform) + '99' }}>{item.platform}</span>
                    {item.category && <span> · {item.category}</span>}
                    {' · '}{new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => reSearch(item)} style={{ padding: '6px 14px', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.25)', borderRadius: 3, color: '#00f5ff', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                    SEARCH AGAIN
                  </button>
                  <button onClick={() => remove(item._id)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => load(p)} style={{
                  width: 36, height: 36, borderRadius: 4,
                  background: page === p ? 'rgba(0,245,255,0.15)' : 'transparent',
                  border: `1px solid ${page === p ? 'rgba(0,245,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: page === p ? '#00f5ff' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-display)', fontSize: '0.7rem',
                }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

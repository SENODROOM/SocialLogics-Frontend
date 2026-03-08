import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { searchAPI, bookmarksAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PLATFORMS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function Search() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState(params.get('q') || '');
  const [platform, setPlatform] = useState(params.get('platform') || 'all');
  const [searched, setSearched] = useState(false);
  const [openingAll, setOpeningAll] = useState(false);

  useEffect(() => {
    if (params.get('q')) {
      doSearch(params.get('q'), params.get('platform') || 'all');
    }
  }, []);

  const doSearch = async (q, p) => {
    if (!q) return;
    try {
      const res = await searchAPI.search(q, p);
      setResults(res.data.results);
      setQuery(q); setPlatform(p);
      setSearched(true);
    } catch (err) {
      toast.error('Search failed');
    }
  };

  const handleSearch = (data) => {
    setResults(data.results);
    setQuery(data.query);
    setPlatform(data.platform);
    setSearched(true);
  };

  const openPlatform = (url, name) => {
    window.open(url, '_blank');
    toast.success(`Opened ${name}`);
  };

  const openAll = () => {
    setOpeningAll(true);
    results.forEach((r, i) => setTimeout(() => window.open(r.url, '_blank'), i * 150));
    toast.success(`Opening ${results.length} platforms...`);
    setTimeout(() => setOpeningAll(false), results.length * 150 + 500);
  };

  const saveBookmark = async (r) => {
    if (!user) { toast.error('Login to save bookmarks'); return; }
    try {
      await bookmarksAPI.create({
        title: `${r.name} - "${query}"`,
        url: r.url, platform: r.platform,
      });
      toast.success('Bookmark saved!');
    } catch { toast.error('Failed to save'); }
  };

  const platformData = PLATFORMS.find(p => p.id === platform);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 40 }}>
        <SearchBar defaultQuery={query} defaultPlatform={platform} onSearch={handleSearch} />
      </div>

      {searched && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 6 }}>SEARCH RESULTS</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                "<span style={{ color: '#00f5ff' }}>{query}</span>"
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 12, fontWeight: 400 }}>
                  {results.length} platform{results.length !== 1 ? 's' : ''}
                  {platformData?.id !== 'all' && ` · ${platformData?.name}`}
                </span>
              </h2>
            </div>
            {results.length > 1 && (
              <button
                onClick={openAll}
                disabled={openingAll}
                style={{
                  padding: '10px 24px', background: 'linear-gradient(135deg,#00f5ff,#0066cc)',
                  color: '#000', borderRadius: 4, fontFamily: 'var(--font-display)',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                }}
              >
                {openingAll ? 'OPENING...' : `OPEN ALL ${results.length} PLATFORMS`}
              </button>
            )}
          </div>

          {/* Results grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {results.map(r => {
              const pd = PLATFORMS.find(p => p.id === r.platform);
              return (
                <div key={r.platform} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6, padding: '20px 22px', transition: 'all 0.22s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=r.color+'70'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.transform='none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 4, border: `1px solid ${r.color}60`, background: r.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>
                      {r.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, color: r.color }}>{r.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{pd?.desc}</div>
                    </div>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(0,245,255,0.4)', marginBottom: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.url.substring(0, 50)}...
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openPlatform(r.url, r.name)}
                      style={{
                        flex: 1, padding: '9px', background: r.color + '22',
                        border: `1px solid ${r.color}50`, borderRadius: 4,
                        color: r.color, fontFamily: 'var(--font-display)',
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em',
                        transition: 'all 0.2s',
                      }}
                    >
                      OPEN →
                    </button>
                    <button
                      onClick={() => saveBookmark(r)}
                      title="Save bookmark"
                      style={{
                        padding: '9px 14px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
                        color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', transition: 'all 0.2s',
                      }}
                    >
                      ☆
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!searched && (
        <div style={{ textAlign: 'center', paddingTop: 80, color: 'rgba(0,245,255,0.2)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.2em' }}>
          ENTER A SEARCH QUERY TO BEGIN
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../utils/api';
import { PLATFORMS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function SearchBar({ large = false, defaultQuery = '', defaultPlatform = 'all', onSearch }) {
  const [query, setQuery] = useState(defaultQuery);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!suggestRef.current?.contains(e.target) && !inputRef.current?.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchSuggestions = (q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchAPI.suggestions(q);
        setSuggestions(res.data.suggestions || []);
        setShowSuggestions(true);
      } catch {}
    }, 300);
  };

  const handleSubmit = async (q = query, p = platform) => {
    if (!q.trim()) { toast.error('Enter a search query'); return; }
    setLoading(true);
    setShowSuggestions(false);
    try {
      const res = await searchAPI.search(q, p);
      if (onSearch) onSearch(res.data);
      else navigate(`/search?q=${encodeURIComponent(q)}&platform=${p}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally { setLoading(false); }
  };

  const fontSize = large ? '1.1rem' : '0.9rem';
  const padding = large ? '16px 20px 16px 48px' : '12px 16px 12px 40px';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {/* Platform selector */}
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          style={{
            padding: large ? '16px 12px' : '12px 10px',
            fontSize: '0.75rem', letterSpacing: '0.05em',
            minWidth: large ? 160 : 130, flexShrink: 0,
          }}
        >
          {PLATFORMS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,245,255,0.4)', fontSize: large ? '1.2rem' : '1rem', pointerEvents: 'none' }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); fetchSuggestions(e.target.value); }}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Search videos, reels, shorts, posts..."
            style={{ width: '100%', padding, fontSize, borderRadius: 4 }}
          />
        </div>

        {/* Search button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading}
          style={{
            padding: large ? '16px 32px' : '12px 24px',
            background: 'linear-gradient(135deg,#00f5ff,#0066cc)',
            color: '#000', borderRadius: 4, fontSize: '0.75rem',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            letterSpacing: '0.15em', transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestRef} style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#0a1220', border: '1px solid rgba(0,245,255,0.2)',
          borderRadius: 4, marginTop: 4, zIndex: 100,
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => { setQuery(s.query); handleSubmit(s.query); }}
              style={{
                padding: '10px 16px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,245,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'rgba(224,232,240,0.8)' }}>⌕ {s.query}</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(0,245,255,0.4)' }}>{s.count} searches</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

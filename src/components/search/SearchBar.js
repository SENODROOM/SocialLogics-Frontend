import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../../utils/api';
import { PLATFORMS, CONTENT_TYPES } from '../../utils/constants';
import { useSearch } from '../../hooks/useSearch';
import toast from 'react-hot-toast';

const VOICES_SUPPORTED = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export default function SearchBar({
  large = false,
  defaultQuery = '',
  defaultPlatform = 'all',
  defaultContentType = 'all',
  onSearch,
  autoFocus = false,
  showFilters = true,
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [contentType, setContentType] = useState(defaultContentType);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [suggIdx, setSuggIdx] = useState(-1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const suggRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { search } = useSearch();

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  // Autocomplete
  const fetchSuggestions = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim() || q.length < 2) { setSuggestions([]); setShowSugg(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        const res = await searchAPI.suggestions(q, abortRef.current.signal);
        setSuggestions(res.data.data.suggestions || []);
        setShowSugg(true);
      } catch {}
    }, 220);
  }, []);

  // Click outside to close
  useEffect(() => {
    const fn = (e) => {
      if (!suggRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowSugg(false); setSuggIdx(-1);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleKeyDown = (e) => {
    if (!showSugg) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSuggIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggIdx >= 0 && suggestions[suggIdx]) {
        setQuery(suggestions[suggIdx].query);
        setShowSugg(false);
        handleSubmit(suggestions[suggIdx].query);
      } else {
        handleSubmit();
      }
    }
    if (e.key === 'Escape') { setShowSugg(false); setSuggIdx(-1); }
  };

  const handleSubmit = async (q = query, p = platform, ct = contentType) => {
    if (!q.trim()) { toast.error('Enter a search query'); inputRef.current?.focus(); return; }
    setShowSugg(false); setLoading(true);
    try {
      const data = await search({ query: q, platform: p, contentType: ct });
      if (!data) return;
      if (onSearch) { onSearch(data); }
      else { navigate(`/search?q=${encodeURIComponent(q)}&platform=${p}&ct=${ct}`); }
    } finally { setLoading(false); }
  };

  // Voice search
  const startVoice = () => {
    if (!VOICES_SUPPORTED) { toast.error('Voice search not supported in your browser'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setQuery(transcript);
      if (e.results[0].isFinal) { setListening(false); handleSubmit(transcript); }
    };
    recognition.onerror = () => { setListening(false); toast.error('Voice error'); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const activePlatform = PLATFORMS.find(p => p.id === platform);
  const fs = large ? { input: '1.05rem', pad: '18px 20px 18px 52px', btnPad: '18px 36px', btnFs: '0.8rem' }
                   : { input: '0.9rem', pad: '13px 16px 13px 44px', btnPad: '13px 22px', btnFs: '0.72rem' };

  return (
    <div style={{ width: '100%' }}>
      {/* Main search row */}
      <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
        {/* Platform selector */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            style={{
              padding: large ? '18px 36px 18px 14px' : '13px 28px 13px 12px',
              fontSize: '0.78rem', minWidth: large ? 160 : 130,
              appearance: 'none', cursor: 'pointer',
              borderColor: activePlatform?.id !== 'all' ? (activePlatform?.color + '60') : undefined,
            }}
          >
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.id === 'all' ? '⬡ All Platforms' : `${p.icon} ${p.name}`}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text3)', fontSize: '0.7rem', pointerEvents: 'none' }}>▾</span>
        </div>

        {/* Input field */}
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,212,255,0.45)', fontSize: large ? '1.2rem' : '1rem', pointerEvents: 'none', zIndex: 1 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); fetchSuggestions(e.target.value); }}
            onFocus={() => suggestions.length && setShowSugg(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search videos, reels, shorts, livestreams..."
            autoComplete="off"
            style={{ width: '100%', padding: fs.pad, fontSize: fs.input }}
          />
          {/* Voice */}
          {VOICES_SUPPORTED && (
            <button
              onClick={startVoice}
              title="Voice search"
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: listening ? 'rgba(255,51,102,0.2)' : 'transparent',
                border: listening ? '1px solid rgba(255,51,102,0.5)' : '1px solid transparent',
                borderRadius: 4, padding: '4px 8px', color: listening ? '#ff3366' : 'var(--c-text3)',
                fontSize: '0.9rem', animation: listening ? 'pulse 1s infinite' : 'none',
              }}
            >🎤</button>
          )}
        </div>

        {/* Filters toggle */}
        {showFilters && (
          <button
            onClick={() => setShowAdvanced(v => !v)}
            title="Advanced filters"
            style={{
              padding: large ? '18px 14px' : '13px 12px', flexShrink: 0,
              background: showAdvanced ? 'rgba(0,212,255,0.1)' : 'var(--c-surface)',
              border: `1.5px solid ${showAdvanced ? 'rgba(0,212,255,0.5)' : 'var(--c-border2)'}`,
              borderRadius: 'var(--r-sm)', color: showAdvanced ? 'var(--c-cyan)' : 'var(--c-text3)',
              fontSize: '1rem',
            }}
          >⚙</button>
        )}

        {/* Search button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading}
          style={{
            padding: fs.btnPad, flexShrink: 0, borderRadius: 'var(--r-sm)',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0080ff 100%)',
            color: '#000', fontWeight: 800, fontSize: fs.btnFs,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(0,212,255,0.35)',
            transform: loading ? 'none' : undefined,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          {loading ? <span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>↻</span> : 'Search'}
        </button>
      </div>

      {/* Advanced filters row */}
      {showAdvanced && showFilters && (
        <div style={{
          display: 'flex', gap: 10, marginTop: 10, padding: '14px 16px',
          background: 'var(--c-surface)', border: '1px solid var(--c-border2)',
          borderRadius: 'var(--r-md)', flexWrap: 'wrap', alignItems: 'center',
          animation: 'fadeUp 0.25s ease',
        }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--c-text3)' }}>CONTENT TYPE</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CONTENT_TYPES.map(ct => (
              <button
                key={ct.id}
                onClick={() => setContentType(ct.id)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--r-full)',
                  background: contentType === ct.id ? 'rgba(0,212,255,0.15)' : 'transparent',
                  border: `1px solid ${contentType === ct.id ? 'var(--c-cyan)' : 'var(--c-border2)'}`,
                  color: contentType === ct.id ? 'var(--c-cyan)' : 'var(--c-text3)',
                  fontSize: '0.72rem', fontFamily: 'var(--f-body)',
                }}
              >{ct.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSugg && suggestions.length > 0 && (
        <div ref={suggRef} className="glass-strong" style={{
          position: 'absolute', left: 0, right: 0,
          marginTop: 6, borderRadius: 'var(--r-md)', zIndex: 1000,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => { setQuery(s.query); handleSubmit(s.query); setShowSugg(false); }}
              style={{
                padding: '11px 18px', cursor: 'pointer',
                background: i === suggIdx ? 'rgba(0,212,255,0.08)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; setSuggIdx(i); }}
              onMouseLeave={e => { if (i !== suggIdx) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon || '⌕'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem' }}>{s.query}</span>
                {s.platform && s.platform !== 'all' && (
                  <span style={{ marginLeft: 8, fontFamily: 'var(--f-mono)', fontSize: '0.65rem', color: 'var(--c-cyan)', opacity: 0.6 }}>on {s.platform}</span>
                )}
              </div>
              {s.count && <span style={{ fontSize: '0.65rem', color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', flexShrink: 0 }}>{s.count.toLocaleString()} searches</span>}
              {s.type === 'history' && <span style={{ fontSize: '0.6rem', color: 'var(--c-text3)' }}>history</span>}
            </div>
          ))}
          <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--c-text4)', fontFamily: 'var(--f-mono)' }}>↑↓ navigate · Enter select · Esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}

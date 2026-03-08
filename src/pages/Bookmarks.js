import { useState, useEffect } from 'react';
import { bookmarksAPI } from '../utils/api';
import { PLATFORMS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  const load = async (col = '') => {
    setLoading(true);
    try {
      const res = await bookmarksAPI.get(col);
      setBookmarks(res.data.bookmarks);
      setCollections(res.data.collections);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load bookmarks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await bookmarksAPI.delete(id);
    setBookmarks(b => b.filter(i => i._id !== id));
    toast.success('Bookmark removed');
  };

  const saveEdit = async (id) => {
    await bookmarksAPI.update(id, { notes: editNotes });
    setBookmarks(b => b.map(i => i._id === id ? { ...i, notes: editNotes } : i));
    setEditingId(null);
    toast.success('Saved');
  };

  const getPlatformColor = (id) => PLATFORMS.find(p => p.id === id)?.color || '#00f5ff';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 6 }}>MY ACCOUNT</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.05em' }}>Bookmarks</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{total} saved items</p>
      </div>

      {/* Collections filter */}
      {collections.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {['', ...collections].map(c => (
            <button key={c} onClick={() => { setActiveCollection(c); load(c); }}
              style={{
                padding: '7px 16px', borderRadius: 3,
                background: activeCollection === c ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeCollection === c ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: activeCollection === c ? '#00f5ff' : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              }}>{c || 'All'}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(0,245,255,0.4)', fontFamily: 'var(--font-mono)' }}>LOADING...</div>
      ) : bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(0,245,255,0.2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>
          NO BOOKMARKS YET · SAVE SEARCHES TO SEE THEM HERE
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
          {bookmarks.map(b => {
            const color = getPlatformColor(b.platform);
            return (
              <div key={b._id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, padding: '18px 20px',
                borderLeft: `3px solid ${color}`,
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e0e8f0', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.58rem', padding: '2px 8px', border: `1px solid ${color}50`, borderRadius: 2, color: color, letterSpacing: '0.1em' }}>{b.platform.toUpperCase()}</span>
                    {b.collection && b.collection !== 'Default' && (
                      <span style={{ marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>📁 {b.collection}</span>
                    )}
                  </div>
                  <button onClick={() => remove(b._id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,60,60,0.5)', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}>×</button>
                </div>

                {editingId === b._id ? (
                  <div style={{ marginBottom: 10 }}>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.78rem', borderRadius: 4, height: 60, resize: 'none' }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => saveEdit(b._id)} style={{ padding: '5px 14px', background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 3, color: '#00f5ff', fontFamily: 'var(--font-display)', fontSize: '0.6rem' }}>SAVE</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '5px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)', fontSize: '0.6rem' }}>CANCEL</button>
                    </div>
                  </div>
                ) : b.notes && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontStyle: 'italic' }}>"{b.notes}"</div>
                )}

                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <a href={b.url} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'block', padding: '8px', background: color + '18', border: `1px solid ${color}40`, borderRadius: 3, textAlign: 'center', color, fontFamily: 'var(--font-display)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none' }}>
                    OPEN →
                  </a>
                  <button onClick={() => { setEditingId(b._id); setEditNotes(b.notes || ''); }} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>✎</button>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
                  {new Date(b.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

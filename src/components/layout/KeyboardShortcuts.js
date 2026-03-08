import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['/', '⌕'], desc: 'Focus search' },
  { keys: ['Enter'], desc: 'Execute search' },
  { keys: ['↑', '↓'], desc: 'Navigate suggestions' },
  { keys: ['Esc'], desc: 'Close suggestions/modal' },
  { keys: ['?'], desc: 'Show shortcuts' },
  { keys: ['G', 'H'], desc: 'Go to Home' },
  { keys: ['G', 'S'], desc: 'Go to Search' },
  { keys: ['G', 'B'], desc: 'Go to Bookmarks' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !['INPUT','TEXTAREA'].includes(e.target.tagName)) setOpen(v => !v);
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(12px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn .15s ease' }}
      onClick={() => setOpen(false)}
    >
      <div onClick={e=>e.stopPropagation()} style={{ background:'rgba(9,20,34,.96)', border:'1px solid rgba(0,212,255,.25)', borderRadius:14, padding:'28px 32px', maxWidth:440, width:'90%', animation:'scaleUp .2s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:'1rem', color:'var(--c-cyan)' }}>Keyboard Shortcuts</div>
          <button onClick={() => setOpen(false)} style={{ background:'transparent', color:'var(--c-text3)', fontSize:'1.2rem', padding:'0 6px' }}>×</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {SHORTCUTS.map((s, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <span style={{ fontFamily:'var(--f-body)', fontSize:'0.83rem', color:'var(--c-text2)' }}>{s.desc}</span>
              <div style={{ display:'flex', gap:4 }}>
                {s.keys.map((k,j) => (
                  <kbd key={j}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:18, fontFamily:'var(--f-mono)', fontSize:'0.65rem', color:'var(--c-text4)', textAlign:'center' }}>Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</div>
      </div>
    </div>
  );
}

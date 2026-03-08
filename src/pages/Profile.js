import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI, alertsAPI } from '../utils/api';
import { PLATFORMS } from '../utils/constants';
import { SectionHeader, Badge } from '../components/ui';
import toast from 'react-hot-toast';

const Card = ({ title, children }) => (
  <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '28px', marginBottom: 20 }}>
    <SectionHeader>{title}</SectionHeader>
    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontFamily: 'var(--f-display)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(0,212,255,0.6)', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>
    {children}
    {hint && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.62rem', color: 'var(--c-text4)', marginTop: 5 }}>{hint}</div>}
  </div>
);

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [theme, setTheme] = useState(user?.theme || 'cyber');
  const [prefs, setPrefs] = useState(user?.preferredPlatforms || []);
  const [safeSearch, setSafeSearch] = useState(user?.safeSearch !== false);
  const [defaultMode, setDefaultMode] = useState(user?.defaultSearchMode || 'all');
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [alertQuery, setAlertQuery] = useState('');
  const [alertFreq, setAlertFreq] = useState('daily');

  const inp = { width: '100%', padding: '12px 14px', fontSize: '0.9rem' };

  const togglePlatform = (id) => setPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ bio, avatar, theme, preferredPlatforms: prefs, safeSearch, defaultSearchMode: defaultMode });
      updateUser(res.data.data.user);
      toast.success('Profile saved ✓');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!currPass || !newPass) { toast.error('Fill both fields'); return; }
    try {
      await authAPI.changePassword({ currentPassword: currPass, newPassword: newPass });
      setCurrPass(''); setNewPass('');
      toast.success('Password changed ✓');
    } catch (err) { toast.error(err.message); }
  };

  const saveAlert = async () => {
    if (!alertQuery) return;
    try {
      await alertsAPI.create({ query: alertQuery, platform: 'all', frequency: alertFreq });
      setAlertQuery('');
      toast.success('Search alert created ✓');
    } catch (err) { toast.error(err.message); }
  };

  const removeSaved = async (i) => {
    try {
      await usersAPI.deleteSaved(i);
      updateUser({ savedSearches: user.savedSearches.filter((_, idx) => idx !== i) });
    } catch {}
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--c-text3)', marginBottom: 6 }}>MY ACCOUNT</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '1.8rem' }}>Settings & Profile</h1>
      </div>

      {/* Account info */}
      <Card title="ACCOUNT INFO">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px', background: 'var(--c-bg2)', borderRadius: 'var(--r-md)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--c-cyan)', flexShrink: 0 }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, color: 'var(--c-cyan)' }}>@{user?.username}</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--c-text3)', marginTop: 2 }}>{user?.email}</div>
            <Badge color="var(--c-green)" size="sm">{user?.role || 'user'}</Badge>
          </div>
        </div>
        <Field label="Bio" hint="Max 300 characters">
          <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} style={{ ...inp, height: 80, resize: 'none' }} placeholder="Tell us about yourself..." />
        </Field>
        <Field label="Avatar URL">
          <input value={avatar} onChange={e => setAvatar(e.target.value)} style={inp} placeholder="https://..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Field label="Theme">
            <select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...inp }}>
              <option value="cyber">Cyber (Default)</option>
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
              <option value="matrix">Matrix</option>
            </select>
          </Field>
          <Field label="Default search mode">
            <select value={defaultMode} onChange={e => setDefaultMode(e.target.value)} style={{ ...inp }}>
              <option value="all">Search all platforms</option>
              <option value="single">Single platform</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <input type="checkbox" id="safe" checked={safeSearch} onChange={e => setSafeSearch(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--c-cyan)' }} />
          <label htmlFor="safe" style={{ fontFamily: 'var(--f-body)', fontSize: '0.85rem', cursor: 'pointer' }}>Safe search enabled</label>
        </div>
        <button onClick={saveProfile} disabled={saving} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,var(--c-cyan),#0080ff)', color: '#000', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.12em' }}>
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </Card>

      {/* Platform preferences */}
      <Card title="PREFERRED PLATFORMS">
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: 'var(--c-text3)', marginBottom: 16 }}>Pin your go-to platforms for quick access</p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {PLATFORMS.filter(p => p.id !== 'all').map(p => (
            <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
              padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: '0.72rem',
              fontFamily: 'var(--f-mono)', transition: 'all var(--t-fast)',
              background: prefs.includes(p.id) ? p.color + '22' : 'transparent',
              border: `1px solid ${prefs.includes(p.id) ? p.color : 'var(--c-border2)'}`,
              color: prefs.includes(p.id) ? p.color : 'var(--c-text3)',
            }}>{p.icon} {p.name}</button>
          ))}
        </div>
        <button onClick={saveProfile} style={{ padding: '9px 20px', background: 'var(--c-cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--c-cyan)', fontFamily: 'var(--f-display)', fontSize: '0.65rem', fontWeight: 700 }}>SAVE PREFERENCES</button>
      </Card>

      {/* Search alerts */}
      <Card title="SEARCH ALERTS">
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: 'var(--c-text3)', marginBottom: 16 }}>Get notified when topics trend on your platforms</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={alertQuery} onChange={e => setAlertQuery(e.target.value)} placeholder="e.g. AI news, gaming clips..." style={{ flex: 1, minWidth: 200, padding: '10px 14px', fontSize: '0.85rem' }} />
          <select value={alertFreq} onChange={e => setAlertFreq(e.target.value)} style={{ padding: '10px 12px', fontSize: '0.75rem' }}>
            <option value="realtime">Real-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button onClick={saveAlert} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,var(--c-cyan),#0080ff)', color: '#000', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-display)', fontSize: '0.7rem', fontWeight: 800 }}>ADD ALERT</button>
        </div>
      </Card>

      {/* Saved searches */}
      {user?.savedSearches?.length > 0 && (
        <Card title="SAVED SEARCHES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user.savedSearches.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--c-bg2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)' }}>
                <div>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem' }}>{s.query}</span>
                  {s.platform && s.platform !== 'all' && <span style={{ marginLeft: 8, fontFamily: 'var(--f-mono)', fontSize: '0.65rem', color: 'var(--c-cyan)' }}>{s.platform}</span>}
                </div>
                <button onClick={() => removeSaved(i)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,51,102,0.5)', fontSize: '1.1rem' }}>×</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Change password */}
      <Card title="CHANGE PASSWORD">
        <Field label="Current password">
          <input type="password" value={currPass} onChange={e => setCurrPass(e.target.value)} style={inp} placeholder="••••••••" />
        </Field>
        <Field label="New password" hint="Minimum 6 characters">
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={inp} placeholder="••••••••" />
        </Field>
        <button onClick={changePassword} style={{ padding: '12px 24px', background: 'var(--c-surface2)', border: '1px solid var(--c-border2)', borderRadius: 'var(--r-sm)', color: 'var(--c-text)', fontFamily: 'var(--f-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>
          UPDATE PASSWORD
        </button>
      </Card>
    </div>
  );
}

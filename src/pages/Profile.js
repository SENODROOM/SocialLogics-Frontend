import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI } from '../utils/api';
import { PLATFORMS } from '../utils/constants';
import toast from 'react-hot-toast';

const Section = ({ title, children }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '28px 28px', marginBottom: 20 }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(0,245,255,0.5)', marginBottom: 22 }}>{title}</div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(0,245,255,0.5)', marginBottom: 8 }}>{label}</label>
    {children}
  </div>
);

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [theme, setTheme] = useState(user?.theme || 'cyber');
  const [prefs, setPrefs] = useState(user?.preferredPlatforms || []);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);

  const togglePlatform = (id) => {
    setPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ bio, avatar, theme, preferredPlatforms: prefs });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!currPass || !newPass) { toast.error('Fill in both password fields'); return; }
    try {
      await authAPI.changePassword({ currentPassword: currPass, newPassword: newPass });
      setCurrPass(''); setNewPass('');
      toast.success('Password changed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const removeSaved = async (i) => {
    await usersAPI.deleteSavedSearch(i);
    updateUser({ savedSearches: user.savedSearches.filter((_, idx) => idx !== i) });
    toast.success('Removed');
  };

  const inputStyle = { width: '100%', padding: '11px 14px', fontSize: '0.88rem', borderRadius: 4 };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(0,245,255,0.5)', marginBottom: 6 }}>SETTINGS</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.05em' }}>My Profile</h1>
      </div>

      {/* Account info */}
      <Section title="ACCOUNT INFO">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,245,255,0.1)', border: '2px solid rgba(0,245,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f5ff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: '#00f5ff' }}>@{user?.username}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{user?.email}</div>
          </div>
        </div>
        <Field label="BIO">
          <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={200} style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="Tell us about yourself..." />
        </Field>
        <Field label="AVATAR URL">
          <input value={avatar} onChange={e=>setAvatar(e.target.value)} style={inputStyle} placeholder="https://..." />
        </Field>
        <Field label="THEME">
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            <option value="cyber">Cyber (Default)</option>
            <option value="dark">Dark</option>
            <option value="neon">Neon</option>
          </select>
        </Field>
        <button onClick={saveProfile} disabled={saving} style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#00f5ff,#0066cc)', color: '#000', borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em' }}>
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </Section>

      {/* Preferred platforms */}
      <Section title="PREFERRED PLATFORMS">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Select your default platforms for searches</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PLATFORMS.filter(p => p.id !== 'all').map(p => (
            <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
              padding: '7px 14px', borderRadius: 3, fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
              background: prefs.includes(p.id) ? p.color + '22' : 'transparent',
              border: `1px solid ${prefs.includes(p.id) ? p.color : 'rgba(255,255,255,0.12)'}`,
              color: prefs.includes(p.id) ? p.color : 'rgba(255,255,255,0.5)',
            }}>
              {p.icon} {p.name}
            </button>
          ))}
        </div>
        <button onClick={saveProfile} style={{ marginTop: 16, padding: '9px 22px', background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 4, color: '#00f5ff', fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
          SAVE PREFERENCES
        </button>
      </Section>

      {/* Saved searches */}
      {user?.savedSearches?.length > 0 && (
        <Section title="SAVED SEARCHES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user.savedSearches.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4 }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{s.query}</span>
                  <span style={{ marginLeft: 10, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(0,245,255,0.4)' }}>{s.platform}</span>
                </div>
                <button onClick={() => removeSaved(i)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,60,60,0.5)', fontSize: '1rem' }}>×</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Change password */}
      <Section title="CHANGE PASSWORD">
        <Field label="CURRENT PASSWORD">
          <input type="password" value={currPass} onChange={e=>setCurrPass(e.target.value)} style={inputStyle} placeholder="••••••••" />
        </Field>
        <Field label="NEW PASSWORD">
          <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={inputStyle} placeholder="Min 6 characters" />
        </Field>
        <button onClick={changePassword} style={{ padding: '11px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#e0e8f0', fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em' }}>
          CHANGE PASSWORD
        </button>
      </Section>
    </div>
  );
}

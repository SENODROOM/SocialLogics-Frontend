import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const inputStyle = { width: '100%', padding: '13px 16px', fontSize: '0.9rem', borderRadius: 4 };

const Field = ({ label, type, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display:'block', fontFamily:'var(--f-display)', fontSize:'0.6rem', letterSpacing:'0.2em', color:'rgba(0,212,255,0.6)', marginBottom:8 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
  </div>
);

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username || !email || !password) { toast.error('Fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <Link to="/" style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:'1.4rem', letterSpacing:'0.08em', background:'linear-gradient(135deg,var(--c-cyan),#fff,#0080ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>⬡ SOCIALLOGICS</Link>
          <h2 style={{ fontFamily:'var(--f-display)', fontSize:'1rem', fontWeight:700, marginTop:24, marginBottom:8, letterSpacing:'0.1em' }}>CREATE ACCOUNT</h2>
          <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.72rem', color:'rgba(0,212,255,0.4)', letterSpacing:'0.1em' }}>JOIN SOCIALLOGICS</p>
        </div>
        <div style={{ background:'rgba(9,20,34,0.92)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:10, padding:'36px 32px' }}>
          <Field label="USERNAME" type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="cooluser42" />
          <Field label="EMAIL" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          <Field label="PASSWORD" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
          <button onClick={handleSubmit} disabled={loading} onKeyDown={e => e.key==='Enter' && handleSubmit()}
            style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,var(--c-cyan),#0080ff)', color:'#000', borderRadius:6, fontFamily:'var(--f-display)', fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', marginTop:8, transition:'all 0.2s' }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; }}
          >{loading ? 'CREATING...' : 'CREATE ACCOUNT'}</button>
          <p style={{ textAlign:'center', marginTop:20, fontFamily:'var(--f-mono)', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--c-cyan)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

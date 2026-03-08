import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const inputStyle = { width: '100%', padding: '13px 16px', fontSize: '0.9rem', borderRadius: 4 };

const Field = ({ label, type, value, onChange, placeholder, onKeyDown }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display:'block', fontFamily:'var(--f-display)', fontSize:'0.6rem', letterSpacing:'0.2em', color:'rgba(0,212,255,0.6)', marginBottom:8 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} style={inputStyle} />
  </div>
);

export function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <Link to="/" style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:'1.4rem', letterSpacing:'0.08em', background:'linear-gradient(135deg,var(--c-cyan),#fff,#0080ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>⬡ SOCIALLOGICS</Link>
          <h2 style={{ fontFamily:'var(--f-display)', fontSize:'1rem', fontWeight:700, marginTop:24, marginBottom:8, letterSpacing:'0.1em' }}>SIGN IN</h2>
          <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.72rem', color:'rgba(0,212,255,0.4)', letterSpacing:'0.1em' }}>ACCESS YOUR ACCOUNT</p>
        </div>
        <div style={{ background:'rgba(9,20,34,0.92)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:10, padding:'36px 32px' }}>
          <Field label="EMAIL" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={onKey} />
          <Field label="PASSWORD" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={onKey} />
          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,var(--c-cyan),#0080ff)', color:'#000', borderRadius:6, fontFamily:'var(--f-display)', fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', marginTop:8, transition:'all 0.2s' }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; }}
          >{loading ? 'SIGNING IN...' : 'SIGN IN'}</button>
          <p style={{ textAlign:'center', marginTop:20, fontFamily:'var(--f-mono)', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>
            No account? <Link to="/register" style={{ color:'var(--c-cyan)' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FormCard = ({ title, subtitle, children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 440 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.1em', background: 'linear-gradient(135deg,#00f5ff,#fff,#0080ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>⬡ SOCIALLOGICS</Link>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginTop: 24, marginBottom: 8, letterSpacing: '0.1em' }}>{title}</h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(0,245,255,0.4)', letterSpacing: '0.1em' }}>{subtitle}</p>
      </div>
      <div style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 8, padding: '36px 32px' }}>
        {children}
      </div>
    </div>
  </div>
);

const Field = ({ label, type, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(0,245,255,0.6)', marginBottom: 8 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: '100%', padding: '13px 16px', fontSize: '0.9rem' }} />
  </div>
);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <FormCard title="SIGN IN" subtitle="ACCESS YOUR ACCOUNT">
      <Field label="EMAIL" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
      <Field label="PASSWORD" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#00f5ff,#0066cc)', color: '#000', borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', marginTop: 8 }}
      >
        {loading ? 'SIGNING IN...' : 'SIGN IN'}
      </button>
      <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
        No account? <Link to="/register" style={{ color: '#00f5ff' }}>Register</Link>
      </p>
    </FormCard>
  );
}

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username || !email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <FormCard title="CREATE ACCOUNT" subtitle="JOIN SOCIALLOGICS">
      <Field label="USERNAME" type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="cooluser42" />
      <Field label="EMAIL" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
      <Field label="PASSWORD" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#00f5ff,#0066cc)', color: '#000', borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', marginTop: 8 }}
      >
        {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
      </button>
      <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
        Have an account? <Link to="/login" style={{ color: '#00f5ff' }}>Sign in</Link>
      </p>
    </FormCard>
  );
}

export default Login;

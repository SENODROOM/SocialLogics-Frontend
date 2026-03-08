import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navLinks = [
  { path: '/', label: 'HOME' },
  { path: '/search', label: 'SEARCH' },
  { path: '/history', label: 'HISTORY', auth: true },
  { path: '/bookmarks', label: 'BOOKMARKS', auth: true },
  { path: '/dashboard', label: 'DASHBOARD', auth: true },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
    setMenuOpen(false);
  };

  const s = {
    nav: {
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'rgba(2,4,8,0.92)',
      borderBottom: '1px solid rgba(0,245,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '0 24px',
    },
    inner: {
      maxWidth: 1200, margin: '0 auto',
      display: 'flex', alignItems: 'center',
      height: 64, gap: 32,
    },
    logo: {
      fontFamily: 'var(--font-display)', fontWeight: 900,
      fontSize: '1.1rem', letterSpacing: '0.1em',
      background: 'linear-gradient(135deg,#00f5ff,#fff,#0080ff)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      textDecoration: 'none',
    },
    links: { display: 'flex', gap: 4, flex: 1, alignItems: 'center' },
    link: (active) => ({
      fontFamily: 'var(--font-display)', fontSize: '0.65rem',
      letterSpacing: '0.15em', padding: '6px 12px',
      borderRadius: 3, textDecoration: 'none',
      color: active ? '#00f5ff' : 'rgba(224,232,240,0.5)',
      background: active ? 'rgba(0,245,255,0.08)' : 'transparent',
      border: active ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
      transition: 'all 0.2s',
    }),
    authArea: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
    btn: (primary) => ({
      fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.15em',
      padding: '7px 16px', borderRadius: 3, fontWeight: 600,
      background: primary ? 'linear-gradient(135deg,#00f5ff,#0066cc)' : 'transparent',
      color: primary ? '#000' : 'rgba(0,245,255,0.7)',
      border: primary ? 'none' : '1px solid rgba(0,245,255,0.3)',
      transition: 'all 0.2s',
    }),
    username: {
      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
      color: '#00f5ff', padding: '4px 10px',
      border: '1px solid rgba(0,245,255,0.2)',
      borderRadius: 3, cursor: 'pointer',
    },
  };

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <Link to="/" style={s.logo}>⬡ SOCIALLOGICS</Link>
        <div style={s.links}>
          {navLinks.filter(l => !l.auth || user).map(l => (
            <Link key={l.path} to={l.path} style={s.link(location.pathname === l.path)}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={s.authArea}>
          {user ? (
            <>
              <Link to="/profile" style={s.username}>@{user.username}</Link>
              <button style={s.btn(false)} onClick={handleLogout}>LOGOUT</button>
            </>
          ) : (
            <>
              <Link to="/login"><button style={s.btn(false)}>LOGIN</button></Link>
              <Link to="/register"><button style={s.btn(true)}>SIGN UP</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

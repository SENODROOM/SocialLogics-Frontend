import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import KeyboardShortcuts from './components/layout/KeyboardShortcuts';
import { GlobalBackground } from './components/layout/Background';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import History from './pages/History';
import { Bookmarks } from './pages/Bookmarks';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:14 }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'2px solid rgba(0,212,255,.1)', borderTop:'2px solid var(--c-cyan)', animation:'spin .7s linear infinite' }}/>
      <span style={{ fontFamily:'var(--f-mono)', fontSize:'0.72rem', color:'var(--c-text4)', letterSpacing:'0.2em' }}>LOADING...</span>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function GlobalShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let gPressed = false;
    const handler = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'g') { gPressed = true; setTimeout(() => { gPressed = false; }, 1000); return; }
      if (gPressed) {
        if (e.key === 'h') navigate('/');
        if (e.key === 's') navigate('/search');
        if (e.key === 'b') navigate('/bookmarks');
        if (e.key === 'd') navigate('/dashboard');
        gPressed = false;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
  return null;
}

function AppLayout() {
  return (
    <>
      <GlobalShortcuts />
      <Navbar />
      <main>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/search"    element={<SearchPage />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <KeyboardShortcuts />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight:'100vh', position:'relative' }}>
          <GlobalBackground />
          <div style={{ position:'relative', zIndex:1 }}>
            <AppLayout />
          </div>
          <Toaster position="bottom-right" toastOptions={{
            duration: 3000,
            style: { background:'rgba(9,20,34,.95)', color:'var(--c-text)', border:'1px solid rgba(0,212,255,.25)', fontFamily:'JetBrains Mono, monospace', fontSize:'0.78rem', backdropFilter:'blur(20px)', boxShadow:'0 8px 32px rgba(0,0,0,.5)' },
            success: { iconTheme:{ primary:'var(--c-cyan)', secondary:'#000' } },
            error:   { iconTheme:{ primary:'#ff3366', secondary:'#000' } },
          }}/>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

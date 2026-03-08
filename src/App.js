import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ParticleField from './components/ParticleField';
import Home from './pages/Home';
import Search from './pages/Search';
import History from './pages/History';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--cyan)', fontFamily:'var(--font-display)', fontSize:'0.8rem', letterSpacing:'0.3em' }}>LOADING...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
      <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--bg)' }}>
          {/* Scanline */}
          <div style={{ position:'fixed', top:0, left:0, right:0, width:'100%', height:'2px', background:'linear-gradient(transparent,rgba(0,245,255,0.06),transparent)', animation:'scanline 10s linear infinite', pointerEvents:'none', zIndex:9999 }} />
          {/* Grid */}
          <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(0,245,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.025) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none', zIndex:0 }} />
          {/* Radial glow */}
          <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at 15% 15%,rgba(0,80,120,0.12) 0%,transparent 60%)', pointerEvents:'none', zIndex:0 }} />
          <ParticleField />
          <div style={{ position:'relative', zIndex:1 }}>
            <AppRoutes />
          </div>
          <Toaster position="bottom-right" toastOptions={{
            style: { background:'#0a1220', color:'#e0e8f0', border:'1px solid rgba(0,245,255,0.3)', fontFamily:'Share Tech Mono, monospace', fontSize:'0.8rem' },
            success: { iconTheme: { primary:'#00f5ff', secondary:'#020408' } },
          }} />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

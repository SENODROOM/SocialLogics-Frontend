import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sl_token');
    if (token) {
      authAPI.me()
        .then(r => setUser(r.data.data.user))
        .catch(() => localStorage.removeItem('sl_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await authAPI.login(email, password);
    const { token, user: u } = r.data.data;
    localStorage.setItem('sl_token', token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const r = await authAPI.register(username, email, password);
    const { token, user: u } = r.data.data;
    localStorage.setItem('sl_token', token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sl_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
};

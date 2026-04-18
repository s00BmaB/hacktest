import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/client';

interface User { id: number; username: string; email: string; first_name: string; last_name: string; }
interface AuthCtx { user: User | null; login: (u: string, p: string) => Promise<void>; logout: () => void; loading: boolean; }

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      api.get('/users/me/').then(r => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/token/', { username, password }, { headers: {} });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    const me = await api.get('/users/me/');
    setUser(me.data);
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

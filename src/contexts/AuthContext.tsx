import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('placar_token');
    localStorage.removeItem('placar_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('placar_token');
    const storedUser  = localStorage.getItem('placar_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Listen for 401 events from axios interceptor — clears state so ProtectedRoute redirects
    const onUnauthorized = () => logout();
    window.addEventListener('placar:unauthorized', onUnauthorized);
    return () => window.removeEventListener('placar:unauthorized', onUnauthorized);
  }, [logout]);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth.php', { username, password });
    const { token: t, ...userData } = res.data;
    localStorage.setItem('placar_token', t);
    localStorage.setItem('placar_user', JSON.stringify(userData));
    setToken(t);
    setUser(userData as User);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSnackbar } from './SnackbarContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: string; // admin | user | read-only
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loaded: boolean;                 // ✅ hydration flag
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showSnackbar } = useSnackbar();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);      // ✅

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser) as User;
        const normalized: User = {
          ...parsed,
          role: typeof parsed.role === 'string' ? parsed.role.trim().toLowerCase() : 'user',
        };
        setUser(normalized);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoaded(true);                               // ✅ signal hydration complete
    }
  }, []);

  const login = (u: User, t: string) => {
    const normalized: User = {
      ...u,
      role: typeof u.role === 'string' ? u.role.trim().toLowerCase() : 'user', // ✅ normalize
    };
    setUser(normalized);
    setToken(t);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(normalized));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showSnackbar('Logged out successfully', 'success');
  };

  return (
    <AuthContext.Provider value={{ user, token, loaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

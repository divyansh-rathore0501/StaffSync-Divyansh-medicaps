import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchDemo: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('staffsync_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('staffsync_token');
    localStorage.removeItem('staffsync_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('staffsync_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('staffsync_token');
      if (savedToken) {
        try {
          const res = await api.get<{ success: boolean; user: User }>('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      email,
      password
    });

    if (res.success && res.token) {
      localStorage.setItem('staffsync_token', res.token);
      localStorage.setItem('staffsync_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const quickSwitchDemo = async (role: Role) => {
    let email = 'employee@staffsync.com';
    let password = 'EmployeePassword123!';

    if (role === 'HR') {
      email = 'hr@staffsync.com';
      password = 'AdminPassword123!';
    } else if (role === 'Manager') {
      email = 'manager@staffsync.com';
      password = 'ManagerPassword123!';
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, quickSwitchDemo, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

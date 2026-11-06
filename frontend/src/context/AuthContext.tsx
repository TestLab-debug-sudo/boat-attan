import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { authService } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  demoLogin: (role: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('peachwave_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('peachwave_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.data?.success) {
        setUser(res.data.user);
        localStorage.setItem('peachwave_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      logout();
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const res = await authService.login({ identifier, password });
      if (res.data?.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('peachwave_token', res.data.token);
        localStorage.setItem('peachwave_user', JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const demoLogin = async (role: string): Promise<boolean> => {
    try {
      const res = await authService.demoLogin(role);
      if (res.data?.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('peachwave_token', res.data.token);
        localStorage.setItem('peachwave_user', JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Demo login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('peachwave_token');
    localStorage.removeItem('peachwave_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, demoLogin, logout, refreshUser }}>
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


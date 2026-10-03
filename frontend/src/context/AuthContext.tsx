import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMeAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  district?: string;
  districtCode?: string;
  state?: string;
  country?: string;
  profilePhoto?: string;
  location?: { lat: number; lng: number; address: string };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('dc_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('dc_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('dc_token');
      if (savedToken) {
        try {
          const res = await getMeAPI();
          setUser(res.data.user);
          localStorage.setItem('dc_user', JSON.stringify(res.data.user));
        } catch {
          localStorage.removeItem('dc_token');
          localStorage.removeItem('dc_user');
          setToken(null);
          setUser(null);
        }
      } else {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('dc_token', newToken);
    localStorage.setItem('dc_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await getMeAPI();
      setUser(res.data.user);
      localStorage.setItem('dc_user', JSON.stringify(res.data.user));
    } catch {}
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

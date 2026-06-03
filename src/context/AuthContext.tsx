import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'HQ_MANAGER' | 'BRANCH_MANAGER' | 'CHEF' | 'WAITER';
  branchId: number | null;
}

interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
  login: (token: string, user: UserPayload) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('stk_token'));
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        setLoading(true);
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch {
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
      setLoading(false);
    };
    verifySession();
  }, [token]);

  const login = (newToken: string, newUser: UserPayload) => {
    localStorage.setItem('stk_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('stk_token');
    setToken(null);
    setUser(null);

    window.location.href = '/kiosk'; // Redirect to public area on logout
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be called inside an AuthProvider');
  return context;
};
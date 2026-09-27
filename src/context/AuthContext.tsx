import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

export interface LoginParams {
  userId?: string;
  email?: string;
  emailOrUsername?: string;
  password?: string;
  role?: UserRole;
  level?: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (params: LoginParams | string) => Promise<void>;
  register: (name: string, email: string, role: UserRole, organization?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  demoUsers: User[];
  canAccessLevel: (level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'foodpack_auth_token_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken?: string) => {
    const currentToken = authToken || token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } catch (err) {
      console.warn('Failed to verify session token:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoUsers = async () => {
    try {
      const res = await fetch('/api/auth/demo-users');
      if (res.ok) {
        const data = await res.json();
        setDemoUsers(data.users || []);
      }
    } catch (err) {
      console.warn('Failed to load demo users:', err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchDemoUsers();
  }, []);

  const login = async (params: LoginParams | string) => {
    setLoading(true);
    try {
      const payload = typeof params === 'string'
        ? { userId: params }
        : params;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed. Please check credentials or select a level.');
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      }
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    role: UserRole,
    organization?: string,
    password?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, organization, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Registration failed.');
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      }
      setUser(data.user);
      fetchDemoUsers();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      if (currentToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  const canAccessLevel = (level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4') => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.role === level;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        register,
        logout,
        switchRole,
        demoUsers,
        canAccessLevel
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

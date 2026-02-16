import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/ats';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token: string) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

// Enhanced fetch with auth
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Skip API check for demo tokens
    if (token.startsWith('demo-token-')) {
      setUser({
        id: 'demo-user-1',
        email: 'admin@acmecorp.com',
        name: 'Admin User',
        role: 'hr_admin',
        tenantId: 'acme-corp',
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
      return;
    }

    try {
      const userData = await fetchWithAuth<User>('/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Demo mode credentials
      const DEMO_CREDENTIALS = {
        email: 'admin@acmecorp.com',
        password: 'admin123',
      };

      const DEMO_USER: User = {
        id: 'demo-user-1',
        email: DEMO_CREDENTIALS.email,
        name: 'Admin User',
        role: 'hr_admin',
        tenantId: 'acme-corp',
        createdAt: new Date().toISOString(),
      };

      // Try real API first - Backend uses OAuth2 form format
      try {
        // Create form data for OAuth2 endpoint
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 expects 'username', not 'email'
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (response.ok) {
          const data = await response.json();
          setToken(data.access_token || data.token);

          // Fetch user data
          try {
            const userData = await fetchWithAuth<User>('/auth/me');
            setUser(userData);
          } catch {
            // If /auth/me fails, use a basic user object
            setUser({
              id: 'user-1',
              email: email,
              name: email.split('@')[0],
              role: 'hr_admin',
              tenantId: 'default',
              createdAt: new Date().toISOString(),
            });
          }
          return { success: true };
        }

        // If API returns error, show the error message
        if (response.status !== 404) {
          try {
            const errorData = await response.json();
            return {
              success: false,
              error: errorData.error?.message || errorData.detail || errorData.message || 'Invalid credentials'
            };
          } catch {
            return { success: false, error: 'Invalid credentials' };
          }
        }
      } catch (err) {
        console.error('Login API error:', err);
        // Network error - fall through to demo mode
      }

      // Demo mode fallback
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        setToken('demo-token-' + Date.now());
        setUser(DEMO_USER);
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Connection failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = getToken();
      if (token && !token.startsWith('demo-token-')) {
        await fetchWithAuth('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

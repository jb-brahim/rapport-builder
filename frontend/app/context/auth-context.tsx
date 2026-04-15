'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profile: {
    name: string;
    photoUrl?: string;
    bio?: string;
    university?: string;
    dept?: string;
    year?: string;
  };
  language: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User['profile']>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user and verify session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          // Verify session with backend
          const response = await fetch('/api/auth/profile', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const userData: User = { 
              id: data._id, 
              email: data.email, 
              name: data.profile?.name || data.name || data.email.split('@')[0],
              role: data.role,
              profile: data.profile,
              language: data.language
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Session expired or invalid
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (e) {
          console.error('Initial auth check failed', e);
          // Don't clear user here to allow offline mode or handle temporary network errors
          setUser(JSON.parse(storedUser));
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Call backend API via proxy
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userData: User = { 
        id: data._id, 
        email: data.email, 
        name: data.profile?.name || data.name || email.split('@')[0],
        role: data.role,
        profile: data.profile,
        language: data.language
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      const userData: User = { 
        id: data._id, 
        email: data.email, 
        name: data.profile?.name || data.name || name,
        role: data.role,
        profile: data.profile,
        language: data.language
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data: Partial<User['profile']>) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Update failed');
      }

      const updatedData = await response.json();
      const userData: User = {
        id: updatedData._id,
        email: updatedData.email,
        name: updatedData.profile?.name || updatedData.name,
        role: updatedData.role,
        profile: updatedData.profile,
        language: updatedData.language
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Update profile error', error);
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Password update failed');
      }
    } catch (error) {
      console.error('Update password error', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile, updatePassword }}>
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

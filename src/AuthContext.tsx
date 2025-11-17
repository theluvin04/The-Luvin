import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User } from './types';
import { supabase } from './supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } else if (profile) {
      setUser({ username: profile.username || session.user.email!, role: profile.role as User['role'] });
    }
  };

  useEffect(() => {
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await fetchUserProfile(session);
        setIsLoading(false);
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        await fetchUserProfile(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error('Login error:', error.message);
        return false;
    }
    if (data.session) {
        await fetchUserProfile(data.session);
    }
    return !!data.session;
  };

  const logout = async (): Promise<boolean> => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        setUser(null);
        return true;
    }
    console.error('Logout failed', error);
    return false;
  };

  const value = {
    isAuthenticated: !!user,
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
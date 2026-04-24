import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  menopause_phase: string | null;
  onboarding_completed: boolean;
  language: string;
  age?: number;
  height?: number;
  weight?: number;
  last_period_date?: string;
  cycle_length?: number;
  current_symptoms?: string[];
  goals?: string[];
  medications?: string[];
  dietary_restrictions?: string[];
  exercise_experience?: string;
  sleep_patterns?: string;
  health_conditions?: string[];
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { name?: string; menopause_phase?: string; language?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const response = await authApi.getMe();
        setUser(response.data);
      }
    } catch (error) {
      console.log('Auth load error:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { access_token, user: userData } = response.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    // Fetch full user data
    const meResponse = await authApi.getMe();
    setUser(meResponse.data);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register(email, password, name);
    const { access_token, user: userData } = response.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    setUser({
      ...userData,
      onboarding_completed: false,
      language: 'en'
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (data: { name?: string; menopause_phase?: string; language?: string }) => {
    const response = await authApi.updateProfile(data);
    // Refresh full user data
    const meResponse = await authApi.getMe();
    setUser(meResponse.data);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, refreshUser }}>
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

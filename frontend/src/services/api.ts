import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; menopause_phase?: string; language?: string }) =>
    api.put('/auth/profile', data),
  completeOnboarding: (data: {
    age?: number;
    height?: number;
    weight?: number;
    last_period_date?: string;
    cycle_length?: number;
    menopause_phase?: string;
    current_symptoms?: string[];
    goals?: string[];
    medications?: string[];
    dietary_restrictions?: string[];
    exercise_experience?: string;
    sleep_patterns?: string;
    health_conditions?: string[];
    language?: string;
  }) => api.post('/auth/onboarding', data),
};

// Symptom APIs
export const symptomApi = {
  getSymptoms: (language: string = 'en') => api.get(`/symptoms?language=${language}`),
  getCategories: (language: string = 'en') => api.get(`/symptoms/categories?language=${language}`),
  logSymptoms: (data: {
    date: string;
    symptoms: string[];
    severity: Record<string, number>;
    notes?: string;
  }) => api.post('/symptom-logs', data),
  getLogs: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/symptom-logs?${params.toString()}`);
  },
  getLogByDate: (date: string) => api.get(`/symptom-logs/${date}`),
};

// Daily Check-in APIs
export const checkinApi = {
  createCheckin: (data: {
    date: string;
    mood: number;
    energy_level: number;
    sleep_quality: number;
    symptoms: string[];
    symptom_severity: Record<string, number>;
    cycle_day?: number;
    period_active?: boolean;
    notes?: string;
  }) => api.post('/daily-checkin', data),
  getCheckin: (date: string) => api.get(`/daily-checkin/${date}`),
  getCheckins: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/daily-checkin?${params.toString()}`);
  },
};

// Advice APIs
export const adviceApi = {
  getAdvice: (category: string, symptoms?: string[], phase?: string, language?: string) =>
    api.post('/advice', { category, symptoms, phase, language }),
  getPhases: (language: string = 'en') => api.get(`/phases?language=${language}`),
  getDailyTip: () => api.get('/daily-tip'),
};

// Info APIs
export const infoApi = {
  getHormones: (language: string = 'en') => api.get(`/hormones?language=${language}`),
  getCyclePhases: (language: string = 'en') => api.get(`/cycle-phases?language=${language}`),
};

// Daily Routine APIs
export const routineApi = {
  getDailyRoutine: (routineType: string, language: string = 'en') =>
    api.post('/daily-routine', { routine_type: routineType, language }),
  getPartnerTips: (language: string = 'en') =>
    api.post('/partner-tips', { language }),
};

// Health Report API
export const reportApi = {
  getHealthReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/health-report?${params.toString()}`);
  },
};

export default api;

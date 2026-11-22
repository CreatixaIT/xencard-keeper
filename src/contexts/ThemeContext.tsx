import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  border: string;
  input: string;
  success: string;
  warning: string;
  error: string;
  // Glassmorphism design tokens
  glassCard: string;
  glassCardSubtle: string;
  glassBorder: string;
  glassBorderGlow: string;
  glowCyan: string;
  glowBlue: string;
  glowPurple: string;
  surfaceElevated: string;
  surfaceMuted: string;
}

const darkColors: ThemeColors = {
  background: '#0B0F17',
  card: '#161C2B',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  accent: '#00F2FE',
  accentSecondary: '#4FACFE',
  border: '#232B3E',
  input: '#151B28',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  glassCard: 'rgba(22, 28, 43, 0.75)',
  glassCardSubtle: 'rgba(26, 33, 50, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBorderGlow: 'rgba(0, 242, 254, 0.28)',
  glowCyan: '#00F2FE',
  glowBlue: '#4FACFE',
  glowPurple: '#8B5CF6',
  surfaceElevated: '#1A2234',
  surfaceMuted: 'rgba(15, 23, 42, 0.85)',
};

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  accent: '#0284C7',
  accentSecondary: '#2563EB',
  border: '#E2E8F0',
  input: '#F1F5F9',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  glassCard: 'rgba(255, 255, 255, 0.88)',
  glassCardSubtle: 'rgba(248, 250, 252, 0.70)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBorderGlow: 'rgba(2, 132, 199, 0.25)',
  glowCyan: '#0284C7',
  glowBlue: '#2563EB',
  glowPurple: '#7C3AED',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: 'rgba(241, 245, 249, 0.85)',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@xencard_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode) {
        setModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    } finally {
      setLoaded(true);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  if (!loaded) {
    // Return with default dark theme while loading
    return (
      <ThemeContext.Provider value={{ mode: 'dark', colors: darkColors, setMode, isDark: true }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

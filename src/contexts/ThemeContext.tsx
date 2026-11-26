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

// Xentro brand colors: Red (#E63329) + Gold (#F5A623) combination (from assets/xentrologo.png)
const darkColors: ThemeColors = {
  background: '#0D0A0B',
  card: '#181214',
  text: '#FFFFFF',
  textSecondary: '#B8A8AA',
  accent: '#E63329',          // Xentro Red
  accentSecondary: '#F5A623', // Xentro Gold
  border: '#2E1E21',
  input: '#161012',
  success: '#10B981',
  warning: '#F5A623',
  error: '#EF4444',
  glassCard: 'rgba(24, 18, 20, 0.80)',
  glassCardSubtle: 'rgba(32, 22, 24, 0.58)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBorderGlow: 'rgba(230, 51, 41, 0.40)',
  glowCyan: '#E63329',
  glowBlue: '#F5A623',
  glowPurple: '#F5A623',
  surfaceElevated: '#211719',
  surfaceMuted: 'rgba(13, 10, 11, 0.88)',
};

const lightColors: ThemeColors = {
  background: '#FFF9F7',
  card: '#FFFFFF',
  text: '#1A0E0E',
  textSecondary: '#6D5959',
  accent: '#D92B22',          // Crisp Xentro Red
  accentSecondary: '#D97706', // Rich Xentro Gold
  border: '#F5D6D3',
  input: '#FFF1EF',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  glassCard: 'rgba(255, 255, 255, 0.90)',
  glassCardSubtle: 'rgba(255, 246, 244, 0.78)',
  glassBorder: 'rgba(217, 43, 34, 0.12)',
  glassBorderGlow: 'rgba(217, 43, 34, 0.30)',
  glowCyan: '#E63329',
  glowBlue: '#F5A623',
  glowPurple: '#D97706',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: 'rgba(255, 244, 242, 0.90)',
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

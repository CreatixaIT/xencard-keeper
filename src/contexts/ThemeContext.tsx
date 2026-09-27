import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeColors {
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
}

const darkColors: ThemeColors = {
  background: '#0B0F17',
  card: '#1A1F2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  accent: '#00F2FE',
  accentSecondary: '#4FACFE',
  border: '#2A2F3E',
  input: '#1A1F2E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF6B6B',
};

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#1A1F2E',
  textSecondary: '#6B7280',
  accent: '#00F2FE',
  accentSecondary: '#4FACFE',
  border: '#E5E7EB',
  input: '#F9FAFB',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF6B6B',
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

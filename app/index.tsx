import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { initializeDatabase } from '../src/db/client';
import { syncService } from '../src/services/sync/syncService';
import { useTheme } from '../src/contexts/ThemeContext';
import { XencardLogo } from '../src/components/XencardLogo';

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        
        // Check if user is already logged in
        const xencardId = await syncService.getStoredXencardId();
        if (xencardId) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to initialize. Please restart the app.');
      }
    }

    init();
  }, [router]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <XencardLogo size="hero" />
      <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginTop: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { initializeDatabase } from '../src/db/client';
import { syncService } from '../src/services/sync/syncService';
import { useTheme } from '../src/contexts/ThemeContext';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';

const XencardLogo = () => (
  <Svg width={200} height={80} viewBox="0 0 600 200">
    <Defs>
      <LinearGradient id="cyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#00F2FE" />
        <Stop offset="100%" stopColor="#4FACFE" />
      </LinearGradient>
      <LinearGradient id="darkShield" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
    </Defs>
    {/* Logo Mark */}
    <Path d="M 75,15 L 125,40 V 100 C 125,130 75,155 75,155 C 75,155 25,130 25,100 V 40 Z" 
          fill="url(#darkShield)" stroke="#1E293B" strokeWidth="3" />
    <Rect x="42" y="55" width="60" height="40" rx="6" 
          fill="#1E293B" stroke="#00F2FE" strokeWidth="1.5" strokeOpacity="0.5" 
          transform="rotate(-12 72 75)" />
    <Rect x="48" y="55" width="60" height="40" rx="6" 
          fill="url(#cyanBlue)" opacity="0.9"
          transform="rotate(8 78 75)" />
    <Path d="M 63,65 L 87,85 M 87,65 L 63,85" 
          stroke="#0B0F17" strokeWidth="4.5" strokeLinecap="round" 
          transform="rotate(8 78 75)" />
    {/* Wordmark */}
    <SvgText x="180" y="112" fontSize="38" fontWeight="800" fill="#FFFFFF" letterSpacing="1">XEN</SvgText>
    <SvgText x="268" y="112" fontSize="38" fontWeight="800" fill="#00F2FE" letterSpacing="1">CARD</SvgText>
    <SvgText x="182" y="140" fontSize="16" fontWeight="500" fill="#94A3B8" letterSpacing="7">KEEPER</SvgText>
  </Svg>
);

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
      <XencardLogo />
      <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
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

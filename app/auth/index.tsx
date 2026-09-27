import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../src/contexts/ThemeContext';

const XencardLogo = () => (
  <Svg width={240} height={80} viewBox="0 0 600 200">
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

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleNewRegistration = () => {
    router.push('/auth/register');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <XencardLogo />
        </View>

        <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome to Xencard Keeper</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your business cards. Always with you.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNewRegistration}
          >
            <Ionicons name="person-add" size={24} color="#0B0F17" />
            <Text style={styles.primaryButtonText}>CREATE NEW ACCOUNT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleLogin}
          >
            <Ionicons name="log-in" size={24} color="#00F2FE" />
            <Text style={styles.secondaryButtonText}>LOGIN WITH XENCARD ID</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.accent }]}>🎁 Start with 100 card slots</Text>
          <Text style={[styles.infoText, { color: colors.accent }]}>📱 Scan business cards instantly</Text>
          <Text style={[styles.infoText, { color: colors.accent }]}>🔍 Find contacts quickly</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00F2FE',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00F2FE',
  },
  primaryButtonText: {
    color: '#0B0F17',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#00F2FE',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
});

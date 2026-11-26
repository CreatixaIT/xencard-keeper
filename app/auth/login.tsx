import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { syncService } from '../../src/services/sync/syncService';
import { getUserProfile } from '../../src/db/repositories/userProfileRepository';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [xencardId, setXencardId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!xencardId.trim()) {
      Alert.alert('Validation Error', 'Please enter your Xencard ID.');
      return;
    }

    setLoading(true);
    try {
      await syncService.loginUser(xencardId.trim());

      const localProfile = await getUserProfile();
      
      if (!localProfile) {
        Alert.alert('Success', 'Logged in successfully');
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login Error', error instanceof Error ? error.message : 'Invalid Xencard ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Log In</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Access your Xencard account</Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Enter your 6-Character Xencard ID</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
            ]}
            value={xencardId}
            onChangeText={setXencardId}
            placeholder="e.g. MO98K4"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            maxLength={16}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Don't have an Xencard ID?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.linkText, { color: colors.accentSecondary }]}>Create one now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A0B',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    padding: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B8A8AA',
    marginBottom: 48,
  },
  form: {
    gap: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#161012',
    borderRadius: 12,
    padding: 20,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E1E21',
  },
  button: {
    backgroundColor: '#E63329',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#181214',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E1E21',
    marginTop: 32,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#B8A8AA',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '600',
  },
});

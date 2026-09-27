import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { syncService } from '../../src/services/sync/syncService';
import { getUserProfile } from '../../src/db/repositories/userProfileRepository';

export default function LoginScreen() {
  const router = useRouter();
  const [xencardId, setXencardId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!xencardId.trim()) {
      Alert.alert('Validation Error', 'Please enter your Xencard ID.');
      return;
    }

    setLoading(true);
    try {
      // Login with cloud sync
      await syncService.loginUser(xencardId.trim());

      // Check if local profile exists
      const localProfile = await getUserProfile();
      
      if (!localProfile) {
        // Create local profile from cloud data
        // This would normally sync data from cloud, but for MVP we'll just navigate
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
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#00F2FE" />
        </TouchableOpacity>

        <Text style={styles.title}>Log In</Text>
        <Text style={styles.subtitle}>Access your Xencard account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Enter your Xencard ID</Text>
          <TextInput
            style={styles.input}
            value={xencardId}
            onChangeText={setXencardId}
            placeholder="XENXXXXXXXX"
            placeholderTextColor="#8E8E93"
            autoCapitalize="characters"
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0B0F17" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Don't have an Xencard ID?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.linkText}>Create one now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
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
    color: '#8E8E93',
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
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 20,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2F3E',
  },
  button: {
    backgroundColor: '#00F2FE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F3E',
    marginTop: 32,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#00F2FE',
    fontWeight: '600',
  },
});

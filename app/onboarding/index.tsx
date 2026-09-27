import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserProfile, getProfileByReferralCode, getUserProfile } from '../../src/db/repositories/userProfileRepository';

export default function OnboardingScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleCompleteOnboarding = async () => {
    if (!fullName.trim() || !designation.trim() || !dateOfBirth.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Check if referral code is valid
      let referredBy = undefined;
      if (referralCode.trim()) {
        const referrerProfile = await getProfileByReferralCode(referralCode.trim());
        if (referrerProfile) {
          referredBy = referrerProfile.xencardId;
        } else {
          Alert.alert('Invalid Referral Code', 'The referral code you entered is not valid.');
          setLoading(false);
          return;
        }
      }

      await createUserProfile({
        fullName: fullName.trim(),
        designation: designation.trim(),
        dateOfBirth: dateOfBirth.trim(),
        referredBy,
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to create profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Xencard Keeper</Text>
        <Text style={styles.subtitle}>Your intelligent business card manager</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="#8E8E93"
          />

          <Text style={styles.label}>Designation *</Text>
          <TextInput
            style={styles.input}
            value={designation}
            onChangeText={setDesignation}
            placeholder="Enter your designation"
            placeholderTextColor="#8E8E93"
          />

          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8E8E93"
          />

          <Text style={styles.label}>Referral Code (Optional)</Text>
          <TextInput
            style={styles.input}
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Enter referral code for +20 cards"
            placeholderTextColor="#8E8E93"
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCompleteOnboarding}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>🎁 Start with 100 card slots</Text>
            <Text style={styles.infoText}>📱 Scan business cards instantly</Text>
            <Text style={styles.infoText}>🔍 Find contacts quickly</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
});
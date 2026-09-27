import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { syncService } from '../../src/services/sync/syncService';
import { createUserProfile } from '../../src/db/repositories/userProfileRepository';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [generatedXencardId, setGeneratedXencardId] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !designation.trim() || !dateOfBirth.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Register with cloud sync first to get the Xencard ID
      const result = await syncService.registerUser({
        fullName: fullName.trim(),
        designation: designation.trim(),
        dateOfBirth: dateOfBirth.trim(),
        referralCode: referralCode.trim() || undefined,
      });

      // Create local profile using the SAME Xencard ID from syncService
      await createUserProfile({
        fullName: fullName.trim(),
        designation: designation.trim(),
        dateOfBirth: dateOfBirth.trim(),
        referredBy: result.user.referredBy,
        xencardId: result.xencardId, // Use the same ID
      });

      setGeneratedXencardId(result.xencardId);
      setShowIdModal(true);
    } catch (error) {
      console.error('Registration failed:', error);
      Alert.alert('Registration Error', error instanceof Error ? error.message : 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(generatedXencardId);
    Alert.alert('Copied', 'Xencard ID copied to clipboard');
  };

  const handleShareId = async () => {
    try {
      await Sharing.shareAsync(generatedXencardId);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleContinue = () => {
    setShowIdModal(false);
    router.replace('/(tabs)');
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

        <Text style={styles.title}>New Registration</Text>
        <Text style={styles.subtitle}>Create your Xencard account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="#8E8E93"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Designation *</Text>
          <TextInput
            style={styles.input}
            value={designation}
            onChangeText={setDesignation}
            placeholder="Enter your designation"
            placeholderTextColor="#8E8E93"
            autoCapitalize="words"
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
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0B0F17" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showIdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="shield-checkmark" size={60} color="#00F2FE" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Your Xencard ID</Text>
            <View style={styles.idContainer}>
              <Text style={styles.xencardId}>{generatedXencardId}</Text>
            </View>
            <Text style={styles.modalWarning}>
              Save this ID. You will need it to access your Xencard on another phone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCopyId}>
                <Ionicons name="copy" size={20} color="#00F2FE" />
                <Text style={styles.modalButtonText}>Copy ID</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={handleShareId}>
                <Ionicons name="share-social" size={20} color="#00F2FE" />
                <Text style={styles.modalButtonText}>Share ID</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 32,
  },
  form: {
    gap: 16,
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
    padding: 16,
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1F2E',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#00F2FE',
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  idContainer: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#00F2FE',
  },
  xencardId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00F2FE',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2F3E',
  },
  modalButtonText: {
    color: '#00F2FE',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#00F2FE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

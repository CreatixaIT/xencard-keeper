import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { UserPersonalCard } from '../types';

// Workaround for document picker
const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
    });
    return result;
  } catch (error) {
    console.error('Document picker error:', error);
    return { canceled: true, assets: [] };
  }
};

interface PersonalCardFormProps {
  initialCard?: Partial<UserPersonalCard>;
  onSave: (card: Omit<UserPersonalCard, 'id' | 'createdTimestamp' | 'updatedTimestamp'>) => void;
  onCancel: () => void;
}

export default function PersonalCardForm({ initialCard, onSave, onCancel }: PersonalCardFormProps) {
  const [fullName, setFullName] = useState(initialCard?.fullName || '');
  const [companyName, setCompanyName] = useState(initialCard?.companyName || '');
  const [designation, setDesignation] = useState(initialCard?.designation || '');
  const [email, setEmail] = useState(initialCard?.email || '');
  const [phone, setPhone] = useState(initialCard?.phone || '');
  const [address, setAddress] = useState(initialCard?.address || '');
  const [website, setWebsite] = useState(initialCard?.website || '');
  const [fileUri, setFileUri] = useState(initialCard?.fileUri || '');
  const [fileType, setFileType] = useState<'png' | 'pdf'>(initialCard?.fileType || 'png');

  const handleFilePicker = async () => {
    try {
      const result = await pickDocument();

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        
        if (asset.mimeType === 'application/pdf') {
          setFileType('pdf');
        } else {
          setFileType('png');
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSave = () => {
    if (!fullName.trim() || !companyName.trim() || !designation.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const card: Omit<UserPersonalCard, 'id' | 'createdTimestamp' | 'updatedTimestamp'> = {
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      designation: designation.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      website: website.trim() || undefined,
      fileUri: fileUri || 'placeholder.png',
      fileType,
      additionalDetails: {},
    };

    onSave(card);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Company *</Text>
        <TextInput
          style={styles.input}
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Enter company name"
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

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor="#8E8E93"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          placeholderTextColor="#8E8E93"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter address"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          placeholder="Enter website"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Card File (PNG/PDF)</Text>
        <TouchableOpacity style={styles.fileButton} onPress={handleFilePicker}>
          <Text style={styles.fileButtonText}>
            {fileUri ? 'Change File' : 'Select File'}
          </Text>
        </TouchableOpacity>
        {fileUri && (
          <Text style={styles.fileInfo} numberOfLines={1}>
            {fileUri.split('/').pop()}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Card</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fileButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  fileButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { createContact } from '../../src/db/repositories/contactRepository';
import { BusinessCardData, FieldExtraction } from '../../src/services/ocr/ocrEngine';
import { Industry } from '../../src/types';

export default function ScanConfirmScreen() {
  const params = useLocalSearchParams();
  const frontImageUri = params.frontImageUri as string;
  const backImageUri = params.backImageUri as string;
  const ocrData = params.ocrData ? JSON.parse(params.ocrData as string) : {};

  const getFieldValue = (field: FieldExtraction | string | undefined): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.value || '';
  };

  const [formData, setFormData] = useState<Record<string, string>>({
    fullName: getFieldValue(ocrData.fullName),
    designation: getFieldValue(ocrData.designation),
    company: getFieldValue(ocrData.company),
    phone: getFieldValue(ocrData.phone),
    alternatePhone: getFieldValue(ocrData.alternatePhone),
    whatsappNumber: getFieldValue(ocrData.whatsappNumber),
    email: getFieldValue(ocrData.email),
    website: getFieldValue(ocrData.website),
    address: getFieldValue(ocrData.address),
    city: getFieldValue(ocrData.city),
    country: getFieldValue(ocrData.country),
    industry: getFieldValue(ocrData.industry),
    notes: ocrData.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        const thumbnail = await ImageManipulator.manipulateAsync(
          frontImageUri,
          [{ resize: { width: 200 } }]
        );
        setThumbnailUri(thumbnail.uri);
      } catch (error) {
        console.error('Thumbnail generation error:', error);
      }
    };
    generateThumbnail();
  }, [frontImageUri]);

  const handleSave = async () => {
    if (!formData.fullName || !formData.company || !formData.industry) {
      Alert.alert('Validation Error', 'Please fill in required fields (Name, Company, Industry)');
      return;
    }

    setLoading(true);
    try {
      // Save front image to permanent location
      const frontFileName = `card_front_${Date.now()}.jpg`;
      const frontFileUri = `${FileSystem.documentDirectory}${frontFileName}`;
      await FileSystem.copyAsync({ from: frontImageUri, to: frontFileUri });

      // Save back image if available
      let backFileUri: string | undefined = undefined;
      if (backImageUri) {
        const backFileName = `card_back_${Date.now()}.jpg`;
        backFileUri = `${FileSystem.documentDirectory}${backFileName}`;
        await FileSystem.copyAsync({ from: backImageUri, to: backFileUri });
      }

      // Create contact record
      await createContact({
        personName: formData.fullName,
        companyName: formData.company,
        jobTitle: formData.designation,
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        whatsappNumber: formData.whatsappNumber,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        website: formData.website,
        industry: mapToIndustry(formData.industry),
        notes: formData.notes,
        rawOcrText: formData.rawText,
        cardImageUri: frontFileUri,
        backImageUri: backFileUri,
        thumbnailUri: thumbnailUri || frontFileUri,
      });

      Alert.alert('Success', 'Business card saved successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save business card');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof BusinessCardData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const mapToIndustry = (industry: string): Industry => {
    const validIndustries: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];
    if (validIndustries.includes(industry as Industry)) {
      return industry as Industry;
    }
    return 'Other';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00F2FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Card Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.imageSection}>
        <Text style={styles.imageLabel}>FRONT</Text>
        <Image source={{ uri: frontImageUri }} style={styles.cardImage} />
      </View>

      {backImageUri && (
        <View style={styles.imageSection}>
          <Text style={styles.imageLabel}>BACK</Text>
          <Image source={{ uri: backImageUri }} style={styles.cardImage} />
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => updateField('fullName', text)}
            placeholder="Enter full name"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Designation</Text>
          <TextInput
            style={styles.input}
            value={formData.designation}
            onChangeText={(text) => updateField('designation', text)}
            placeholder="Job title"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Company *</Text>
          <TextInput
            style={styles.input}
            value={formData.company}
            onChangeText={(text) => updateField('company', text)}
            placeholder="Company name"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <Text style={styles.sectionTitle}>Contact Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+880 1XXXXXXXXX"
            placeholderTextColor="#8E8E93"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Alternate Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.alternatePhone}
            onChangeText={(text) => updateField('alternatePhone', text)}
            placeholder="Alternate phone"
            placeholderTextColor="#8E8E93"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>WhatsApp</Text>
          <TextInput
            style={styles.input}
            value={formData.whatsappNumber}
            onChangeText={(text) => updateField('whatsappNumber', text)}
            placeholder="WhatsApp number"
            placeholderTextColor="#8E8E93"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="email@example.com"
            placeholderTextColor="#8E8E93"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={(text) => updateField('website', text)}
            placeholder="https://example.com"
            placeholderTextColor="#8E8E93"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="Street address"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
            placeholder="City"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(text) => updateField('country', text)}
            placeholder="Country"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Industry *</Text>
          <TextInput
            style={styles.input}
            value={formData.industry}
            onChangeText={(text) => updateField('industry', text)}
            placeholder="e.g., Technology, Finance, Healthcare"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Additional notes"
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0B0F17" />
          ) : (
            <Text style={styles.saveButtonText}>Save Business Card</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    margin: 16,
  },
  imageSection: {
    margin: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 16,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00F2FE',
    marginTop: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#00F2FE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

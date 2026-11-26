import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { createContact } from '../../src/db/repositories/contactRepository';
import { BusinessCardData, FieldExtraction } from '../../src/services/ocr/ocrEngine';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { Industry } from '../../src/types';

const INDUSTRIES: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];

export default function ScanConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
    industry: getFieldValue(ocrData.industry) || 'Other',
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
        rawOcrText: ocrData.rawText || formData.rawText || '',
        cardImageUri: frontFileUri,
        backImageUri: backFileUri,
        thumbnailUri: thumbnailUri || frontFileUri,
      });

      Alert.alert('Success', 'Business card verified and saved to your vault', [
        { text: 'View Vault', onPress: () => router.replace('/(tabs)') }
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Verify Extracted Card</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, { backgroundColor: colors.accent }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Scanned Images Preview */}
      <View style={styles.imagesRow}>
        <View style={styles.imageCardWrapper}>
          <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>FRONT SIDE</Text>
          <Image source={{ uri: frontImageUri }} style={styles.previewImage} resizeMode="cover" />
        </View>

        {backImageUri ? (
          <View style={styles.imageCardWrapper}>
            <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>BACK SIDE</Text>
            <Image source={{ uri: backImageUri }} style={styles.previewImage} resizeMode="cover" />
          </View>
        ) : null}
      </View>

      {/* Form Fields */}
      <GlassCard variant="glow" style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Primary Identity</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.fullName}
            onChangeText={(text) => updateField('fullName', text)}
            placeholder="Contact Name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Designation / Job Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.designation}
            onChangeText={(text) => updateField('designation', text)}
            placeholder="e.g. Managing Director"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Company *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.company}
            onChangeText={(text) => updateField('company', text)}
            placeholder="Company or Organization"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Industry</Text>
          <View style={styles.industryGrid}>
            {INDUSTRIES.map((ind) => {
              const active = formData.industry === ind;
              return (
                <TouchableOpacity
                  key={ind}
                  style={[
                    styles.industryChip,
                    {
                      backgroundColor: active ? colors.accent : colors.glassCardSubtle,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => updateField('industry', ind)}
                >
                  <Text style={[styles.industryChipText, { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                    {ind}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </GlassCard>

      <GlassCard variant="default" style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Contact Channels</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Primary Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+1 234 567 890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Alternate Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.alternatePhone}
            onChangeText={(text) => updateField('alternatePhone', text)}
            placeholder="+1 987 654 321"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>WhatsApp Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.whatsappNumber}
            onChangeText={(text) => updateField('whatsappNumber', text)}
            placeholder="WhatsApp phone"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="email@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.website}
            onChangeText={(text) => updateField('website', text)}
            placeholder="https://example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
      </GlassCard>

      <GlassCard variant="default" style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Address & Notes</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder="City"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Country</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={formData.country}
              onChangeText={(text) => updateField('country', text)}
              placeholder="Country"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={formData.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Additional notes"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      </GlassCard>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Card to Vault</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  imageCardWrapper: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  imageLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    backgroundColor: '#161012',
  },
  formSection: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  industryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  industryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  industryChipText: {
    fontSize: 12,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

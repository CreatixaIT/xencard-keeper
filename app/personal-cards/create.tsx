import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import { 
  createPersonalCard, 
  getPersonalCard, 
  updatePersonalCard 
} from '../../src/db/repositories/personalCardRepository';
import { Industry } from '../../src/types';

export default function PersonalCardCreateScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const editId = params.id as string | undefined;

  const [formData, setFormData] = useState({
    fullName: '',
    designation: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    country: '',
    website: '',
    industry: 'Other' as Industry,
  });

  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      loadCard(editId);
    }
  }, [editId]);

  const loadCard = async (id: string) => {
    try {
      const card = await getPersonalCard(id);
      if (card) {
        setFormData({
          fullName: card.fullName,
          designation: card.designation,
          companyName: card.companyName,
          email: card.email,
          phone: card.phone,
          alternatePhone: card.alternatePhone || '',
          whatsappNumber: card.whatsappNumber || '',
          address: card.address || '',
          city: card.city || '',
          country: card.country || '',
          website: card.website || '',
          industry: (card.industry as Industry) || 'Other',
        });
        setFrontImageUri(card.frontImageUri || null);
        setBackImageUri(card.backImageUri || null);
      }
    } catch (error) {
      console.error('Failed to load card:', error);
    }
  };

  const handleScanCard = () => {
    // Navigate to scanner for personal card
    router.push('/scan');
  };

  const handlePickFrontImage = async () => {
    // For now, navigate to scanner
    // In future, could add gallery picker
    handleScanCard();
  };

  const handlePickBackImage = async () => {
    handleScanCard();
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.designation || !formData.companyName || !formData.email || !formData.phone) {
      Alert.alert('Validation Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      let frontFileUri: string | undefined;
      let backFileUri: string | undefined;

      // Save front image
      if (frontImageUri) {
        const frontFileName = `personal_front_${Date.now()}.jpg`;
        frontFileUri = `${FileSystem.documentDirectory}${frontFileName}`;
        await FileSystem.copyAsync({ from: frontImageUri, to: frontFileUri });
      }

      // Save back image
      if (backImageUri) {
        const backFileName = `personal_back_${Date.now()}.jpg`;
        backFileUri = `${FileSystem.documentDirectory}${backFileName}`;
        await FileSystem.copyAsync({ from: backImageUri, to: backFileUri });
      }

      const cardData = {
        fullName: formData.fullName,
        designation: formData.designation,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        website: formData.website || undefined,
        industry: formData.industry,
        frontImageUri: frontFileUri,
        backImageUri: backFileUri,
        fileUri: frontFileUri, // Required by schema
        fileType: 'png' as const,
        additionalDetails: {},
      };

      if (editId) {
        await updatePersonalCard(editId, cardData);
        Alert.alert('Success', 'Card updated successfully');
      } else {
        await createPersonalCard(cardData);
        Alert.alert('Success', 'Card created successfully');
      }

      router.back();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {editId ? 'Edit Visiting Card' : 'Add Visiting Card'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Card Images</Text>
        
        <TouchableOpacity 
          style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handlePickFrontImage}
        >
          {frontImageUri ? (
            <Image source={{ uri: frontImageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color={colors.textSecondary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                Add Front Image
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handlePickBackImage}
        >
          {backImageUri ? (
            <Image source={{ uri: backImageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color={colors.textSecondary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                Add Back Image (Optional)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.fullName}
            onChangeText={(text) => updateField('fullName', text)}
            placeholder="Your full name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Designation *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.designation}
            onChangeText={(text) => updateField('designation', text)}
            placeholder="e.g., Managing Director"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Company Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.companyName}
            onChangeText={(text) => updateField('companyName', text)}
            placeholder="Your company"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Industry</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.industry}
            onChangeText={(text) => updateField('industry', text as Industry)}
            placeholder="e.g., Technology, Finance"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Details</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="email@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Phone *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+880 1XXXXXXXXX"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Alternate Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.alternatePhone}
            onChangeText={(text) => updateField('alternatePhone', text)}
            placeholder="Alternate phone"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>WhatsApp</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.whatsappNumber}
            onChangeText={(text) => updateField('whatsappNumber', text)}
            placeholder="WhatsApp number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.website}
            onChangeText={(text) => updateField('website', text)}
            placeholder="https://example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>City</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Country</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={formData.country}
            onChangeText={(text) => updateField('country', text)}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0B0F17" />
          ) : (
            <Text style={styles.saveButtonText}>{editId ? 'Update Card' : 'Save Card'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2F3E',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  imageButton: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

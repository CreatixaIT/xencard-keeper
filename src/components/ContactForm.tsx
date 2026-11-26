import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { VisitingCard, Industry } from '../types';
import { getContact } from '../db/repositories/contactRepository';
import { useTheme } from '../contexts/ThemeContext';
import { GlassCard } from './glass/GlassCard';

interface ContactFormProps {
  initialContact?: Partial<VisitingCard>;
  onSave: (contact: Omit<VisitingCard, 'id' | 'createdTimestamp'>) => void;
  onCancel: () => void;
  contactId?: string;
  isEditing?: boolean;
}

const INDUSTRIES: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];

export default function ContactForm({ initialContact, onSave, onCancel, contactId, isEditing }: ContactFormProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [personName, setPersonName] = useState(initialContact?.personName || '');
  const [companyName, setCompanyName] = useState(initialContact?.companyName || '');
  const [jobTitle, setJobTitle] = useState(initialContact?.jobTitle || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(initialContact?.alternatePhone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialContact?.whatsappNumber || '');
  const [address, setAddress] = useState(initialContact?.address || '');
  const [city, setCity] = useState(initialContact?.city || '');
  const [country, setCountry] = useState(initialContact?.country || '');
  const [website, setWebsite] = useState(initialContact?.website || '');
  const [notes, setNotes] = useState(initialContact?.notes || '');
  const [industry, setIndustry] = useState<Industry>(initialContact?.industry || 'Other');
  const [existingImages, setExistingImages] = useState<{
    cardImageUri?: string;
    backImageUri?: string;
    thumbnailUri?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && contactId) {
      loadContact();
    }
  }, [isEditing, contactId]);

  const loadContact = async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const contact = await getContact(contactId);
      if (contact) {
        setPersonName(contact.personName);
        setCompanyName(contact.companyName);
        setJobTitle(contact.jobTitle || '');
        setEmail(contact.email || '');
        setPhone(contact.phone || '');
        setAlternatePhone(contact.alternatePhone || '');
        setWhatsappNumber(contact.whatsappNumber || '');
        setAddress(contact.address || '');
        setCity(contact.city || '');
        setCountry(contact.country || '');
        setWebsite(contact.website || '');
        setNotes(contact.notes || '');
        setIndustry(contact.industry);
        setExistingImages({
          cardImageUri: contact.cardImageUri,
          backImageUri: contact.backImageUri,
          thumbnailUri: contact.thumbnailUri,
        });
      }
    } catch (error) {
      console.error('Failed to load contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!personName.trim() && !companyName.trim()) {
      Alert.alert('Validation Error', 'Please enter at least a name or company.');
      return;
    }

    const contact: Omit<VisitingCard, 'id' | 'createdTimestamp'> = {
      personName: personName.trim() || 'Unknown Contact',
      companyName: companyName.trim() || 'General Network',
      jobTitle: jobTitle.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      alternatePhone: alternatePhone.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
      industry,
      cardImageUri: existingImages.cardImageUri || 'placeholder.png',
      backImageUri: existingImages.backImageUri,
      thumbnailUri: existingImages.thumbnailUri,
    };

    onSave(contact);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Contact...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.headerCloseBtn, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]} onPress={onCancel}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Contact' : 'New Contact Card'}
        </Text>
        <TouchableOpacity style={[styles.saveHeaderBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
          <Text style={styles.saveHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Main Glass Form */}
      <GlassCard variant="glow" style={styles.formCard}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Personal Identity</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={personName}
            onChangeText={setPersonName}
            placeholder="e.g. Alex Johnson"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Company *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Acme Corporation"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Job Title / Designation</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder="e.g. Chief Executive Officer"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Industry Sector</Text>
          <View style={styles.industryGrid}>
            {INDUSTRIES.map((ind) => {
              const active = industry === ind;
              return (
                <TouchableOpacity
                  key={ind}
                  style={[
                    styles.industryPill,
                    {
                      backgroundColor: active ? colors.accent : colors.glassCardSubtle,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setIndustry(ind)}
                >
                  <Text style={[styles.industryPillText, { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                    {ind}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </GlassCard>

      <GlassCard variant="default" style={styles.formCard}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Direct Communication</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Primary Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 234 567 890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Alternate Phone / Mobile</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={alternatePhone}
            onChangeText={setAlternatePhone}
            placeholder="+1 987 654 321"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>WhatsApp Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            placeholder="+1 234 567 890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="alex@acme.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://acme.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>
      </GlassCard>

      <GlassCard variant="default" style={styles.formCard}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Location & Notes</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Business Avenue, Suite 400"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. San Francisco"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Country</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={country}
              onChangeText={setCountry}
              placeholder="e.g. USA"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Notes & Context</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Met at Tech Summit, discussed enterprise licensing..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>
      </GlassCard>

      {/* Bottom Save & Cancel Buttons */}
      <View style={styles.bottomBtnRow}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel}>
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>{isEditing ? 'Update Contact' : 'Save Contact'}</Text>
        </TouchableOpacity>
      </View>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
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
  formCard: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.2,
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
    height: 80,
    textAlignVertical: 'top',
  },
  industryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  industryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  industryPillText: {
    fontSize: 12,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

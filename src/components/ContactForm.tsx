import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import type { VisitingCard, Industry } from '../types';
import { getContact } from '../db/repositories/contactRepository';

interface ContactFormProps {
  initialContact?: Partial<VisitingCard>;
  onSave: (contact: Omit<VisitingCard, 'id' | 'createdTimestamp'>) => void;
  onCancel: () => void;
  contactId?: string;
  isEditing?: boolean;
}

const INDUSTRIES: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];

export default function ContactForm({ initialContact, onSave, onCancel, contactId, isEditing }: ContactFormProps) {
  const [personName, setPersonName] = useState(initialContact?.personName || '');
  const [companyName, setCompanyName] = useState(initialContact?.companyName || '');
  const [jobTitle, setJobTitle] = useState(initialContact?.jobTitle || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialContact?.whatsappNumber || '');
  const [address, setAddress] = useState(initialContact?.address || '');
  const [website, setWebsite] = useState(initialContact?.website || '');
  const [industry, setIndustry] = useState<Industry>(initialContact?.industry || 'Other');
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
        setWhatsappNumber(contact.whatsappNumber || '');
        setAddress(contact.address || '');
        setWebsite(contact.website || '');
        setIndustry(contact.industry);
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
      personName: personName.trim() || 'Unknown',
      companyName: companyName.trim() || 'Unknown Company',
      jobTitle: jobTitle.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      address: address.trim() || undefined,
      website: website.trim() || undefined,
      industry,
      rawOcrText: undefined,
      cardImageUri: 'placeholder.png',
    };

    onSave(contact);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={personName}
          onChangeText={setPersonName}
          placeholder="Enter name"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Company *</Text>
        <TextInput
          style={styles.input}
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Enter company"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Job Title</Text>
        <TextInput
          style={styles.input}
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="Enter job title"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          placeholderTextColor="#8E8E93"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={styles.input}
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
          placeholder="Enter WhatsApp number"
          placeholderTextColor="#8E8E93"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor="#8E8E93"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Address</Text>
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

        <Text style={styles.label}>Industry</Text>
        <View style={styles.industryContainer}>
          {INDUSTRIES.map((ind) => (
            <TouchableOpacity
              key={ind}
              style={[styles.industryChip, industry === ind && styles.industryChipActive]}
              onPress={() => setIndustry(ind)}
            >
              <Text style={[styles.industryChipText, industry === ind && styles.industryChipTextActive]}>
                {ind}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{isEditing ? 'Update Contact' : 'Save Contact'}</Text>
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
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 100,
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
  industryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  industryChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  industryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  industryChipText: {
    fontSize: 14,
    color: '#000',
  },
  industryChipTextActive: {
    color: '#FFF',
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
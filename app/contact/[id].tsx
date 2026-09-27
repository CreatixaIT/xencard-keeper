import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContact, deleteContact } from '../../src/db/repositories/contactRepository';
import { useTheme } from '../../src/contexts/ThemeContext';
import type { VisitingCard } from '../../src/types';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [contact, setContact] = useState<VisitingCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    loadContact();
  }, [id]);

  const loadContact = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getContact(id);
      setContact(data);
    } catch (error) {
      console.error('Failed to load contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteContact(id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleCall = () => {
    if (contact?.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    } else {
      Alert.alert('No Phone', 'This contact does not have a phone number.');
    }
  };

  const handleWhatsApp = () => {
    const phone = contact?.whatsappNumber || contact?.phone;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    } else {
      Alert.alert('No Phone', 'This contact does not have a phone number for WhatsApp.');
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    } else {
      Alert.alert('No Email', 'This contact does not have an email address.');
    }
  };

  const handleMaps = () => {
    if (contact?.address) {
      const query = encodeURIComponent(contact.address);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    } else {
      Alert.alert('No Address', 'This contact does not have an address.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Contact not found</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View style={styles.contactHeader}>
          <Text style={[styles.name, { color: colors.text }]}>{contact.personName}</Text>
          <Text style={[styles.company, { color: colors.textSecondary }]}>{contact.companyName}</Text>
          {contact.jobTitle && <Text style={[styles.jobTitle, { color: colors.textSecondary }]}>{contact.jobTitle}</Text>}
          {contact.industry && (
            <View style={[styles.industryBadge, { backgroundColor: `${colors.accent}20` }]}>
              <Text style={[styles.industryText, { color: colors.accent }]}>{contact.industry}</Text>
            </View>
          )}
        </View>

        {/* Business Card Images */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Card</Text>
          
          {contact.cardImageUri && (
            <TouchableOpacity onPress={() => setFullScreenImage(contact.cardImageUri || null)}>
              <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>Front</Text>
              <Image source={{ uri: contact.cardImageUri }} style={styles.cardImage} resizeMode="contain" />
            </TouchableOpacity>
          )}
          
          {contact.backImageUri ? (
            <TouchableOpacity onPress={() => setFullScreenImage(contact.backImageUri || null)}>
              <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>Back</Text>
              <Image source={{ uri: contact.backImageUri }} style={styles.cardImage} resizeMode="contain" />
            </TouchableOpacity>
          ) : (
            <View style={styles.noBackImage}>
              <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>Back</Text>
              <Text style={[styles.noBackText, { color: colors.textSecondary }]}>Not available</Text>
            </View>
          )}
        </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
        
        {contact.phone && (
          <TouchableOpacity style={[styles.infoRow, { backgroundColor: colors.card }]} onPress={handleCall}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{contact.phone}</Text>
          </TouchableOpacity>
        )}
        
        {contact.whatsappNumber && (
          <TouchableOpacity style={[styles.infoRow, { backgroundColor: colors.card }]} onPress={handleWhatsApp}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>WhatsApp</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{contact.whatsappNumber}</Text>
          </TouchableOpacity>
        )}
        
        {contact.email && (
          <TouchableOpacity style={[styles.infoRow, { backgroundColor: colors.card }]} onPress={handleEmail}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{contact.email}</Text>
          </TouchableOpacity>
        )}
        
        {contact.address && (
          <TouchableOpacity style={[styles.infoRow, { backgroundColor: colors.card, alignItems: 'flex-start' }]} onPress={handleMaps}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Address</Text>
            <Text style={[styles.infoValue, { color: colors.text, flex: 1, textAlign: 'right' }]}>{contact.address}</Text>
          </TouchableOpacity>
        )}
        
        {contact.website && (
          <TouchableOpacity style={[styles.infoRow, { backgroundColor: colors.card }]} onPress={() => Linking.openURL(contact.website!)}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Website</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{contact.website}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={handleEmail}>
            <Ionicons name="mail" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={handleMaps}>
            <Ionicons name="map" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
        <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Added</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(contact.createdTimestamp)}</Text>
        </View>
        {contact.updatedTimestamp && (
          <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Updated</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(contact.updatedTimestamp)}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.accent }]} onPress={() => router.push(`/contact/create?id=${id}`)}>
          <Text style={styles.editButtonText}>Edit Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Contact</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* Full-screen image modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity
            style={styles.fullScreenClose}
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 100,
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
  headerSpacer: {
    width: 40,
  },
  contactHeader: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  company: {
    fontSize: 18,
    marginTop: 4,
  },
  jobTitle: {
    fontSize: 16,
    marginTop: 2,
  },
  industryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  industryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1A1F2E',
  },
  noBackImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1A1F2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBackText: {
    fontSize: 14,
    opacity: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 1,
    padding: 12,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

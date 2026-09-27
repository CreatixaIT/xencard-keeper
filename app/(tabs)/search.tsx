import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchContacts, filterContactsByIndustry, getContacts } from '../../src/db/repositories/contactRepository';
import type { VisitingCard, Industry } from '../../src/types';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<VisitingCard[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | 'All'>('All');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedContact, setSelectedContact] = useState<VisitingCard | null>(null);

  const industries: (Industry | 'All')[] = ['All', 'Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];

  useEffect(() => {
    loadAllContacts();
  }, []);

  useEffect(() => {
    performSearch();
  }, [query, selectedIndustry]);

  const loadAllContacts = async () => {
    const all = await getContacts();
    setContacts(all);
  };

  const performSearch = async () => {
    if (selectedIndustry === 'All') {
      const results = await searchContacts(query);
      setContacts(results);
    } else {
      const results = await filterContactsByIndustry(selectedIndustry);
      if (query) {
        const searchResults = await searchContacts(query);
        const filtered = searchResults.filter((c) => c.industry === selectedIndustry);
        setContacts(filtered);
      } else {
        setContacts(results);
      }
    }
  };

  const handleAction = (action: string) => {
    if (!selectedContact) return;

    switch (action) {
      case 'call':
        if (selectedContact.phone) {
          Linking.openURL(`tel:${selectedContact.phone}`);
        } else {
          Alert.alert('No Phone', 'This contact does not have a phone number');
        }
        break;
      case 'whatsapp':
        if (selectedContact.phone) {
          const whatsappUrl = `whatsapp://send?phone=${selectedContact.phone}`;
          Linking.openURL(whatsappUrl).catch(() => {
            Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on your device');
          });
        } else {
          Alert.alert('No Phone', 'This contact does not have a phone number');
        }
        break;
      case 'email':
        if (selectedContact.email) {
          Linking.openURL(`mailto:${selectedContact.email}`);
        } else {
          Alert.alert('No Email', 'This contact does not have an email address');
        }
        break;
      case 'maps':
        if (selectedContact.address) {
          const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(selectedContact.address)}`;
          Linking.openURL(mapsUrl);
        } else {
          Alert.alert('No Address', 'This contact does not have an address');
        }
        break;
    }

    setShowActionSheet(false);
    setSelectedContact(null);
  };

  const renderContact = ({ item }: { item: VisitingCard }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => router.push(`/contact/${item.id}`)}>
      {item.thumbnailUri ? (
        <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="person" size={24} color="#8E8E93" />
        </View>
      )}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.personName}</Text>
        <Text style={styles.contactCompany}>{item.companyName}</Text>
        {item.jobTitle && <Text style={styles.contactJobTitle}>{item.jobTitle}</Text>}
      </View>
      <Text style={styles.contactIndustry}>{item.industry}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Contacts</Text>
        <Text style={styles.headerSubtitle}>Find your business cards quickly</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, company, or phone..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#8E8E93"
          onSubmitEditing={performSearch}
        />
      </View>

      <View style={styles.industryFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={industries}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.industryChip, selectedIndustry === item && styles.industryChipActive]}
              onPress={() => setSelectedIndustry(item)}
            >
              <Text style={[styles.industryChipText, selectedIndustry === item && styles.industryChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptyHint}>Try searching by name, company, or phone number</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/contact/create')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {showActionSheet && selectedContact && (
        <View style={styles.actionSheet}>
          <View style={styles.actionSheetContent}>
            <Text style={styles.actionSheetTitle}>{selectedContact.personName}</Text>
            <Text style={styles.actionSheetSubtitle}>{selectedContact.companyName}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('call')}>
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('whatsapp')}>
                <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('email')}>
                <Text style={styles.actionButtonText}>✉️ Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('maps')}>
                <Text style={styles.actionButtonText}>📍 Maps</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowActionSheet(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  header: {
    padding: 20,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2F3E',
  },
  industryFilter: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  industryChip: {
    backgroundColor: '#1A1F2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A2F3E',
  },
  industryChipActive: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
  },
  industryChipText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  industryChipTextActive: {
    color: '#0B0F17',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2A2F3E',
  },
  thumbnailPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2A2F3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactCompany: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  contactJobTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  contactIndustry: {
    fontSize: 12,
    color: '#00F2FE',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 32,
    color: '#0B0F17',
    fontWeight: 'bold',
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#1A1F2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  actionSheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#00F2FE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#2A2F3E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

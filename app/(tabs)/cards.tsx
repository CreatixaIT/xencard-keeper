import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getContacts, deleteContact } from '../../src/db/repositories/contactRepository';
import * as Linking from 'expo-linking';

export default function CardsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const allContacts = await getContacts();
      setContacts(allContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleContactPress = (contact: any) => {
    router.push(`/contact/${contact.id}`);
  };

  const handleLongPress = (contact: any) => {
    setSelectedContact(contact);
    setShowActionSheet(true);
  };

  const handleCall = () => {
    if (selectedContact?.phone) {
      Linking.openURL(`tel:${selectedContact.phone}`);
    }
    setShowActionSheet(false);
  };

  const handleWhatsApp = () => {
    if (selectedContact?.whatsappNumber) {
      Linking.openURL(`whatsapp://send?phone=${selectedContact.whatsappNumber}`);
    } else if (selectedContact?.phone) {
      Linking.openURL(`whatsapp://send?phone=${selectedContact.phone}`);
    }
    setShowActionSheet(false);
  };

  const handleEmail = () => {
    if (selectedContact?.email) {
      Linking.openURL(`mailto:${selectedContact.email}`);
    }
    setShowActionSheet(false);
  };

  const handleMaps = () => {
    if (selectedContact?.address) {
      const query = encodeURIComponent(selectedContact.address);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
    setShowActionSheet(false);
  };

  const handleEdit = () => {
    setShowActionSheet(false);
    router.push(`/contact/${selectedContact.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (selectedContact) {
              await deleteContact(selectedContact.id);
              loadContacts();
            }
            setShowActionSheet(false);
          },
        },
      ]
    );
  };

  const renderContact = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
      onLongPress={() => handleLongPress(item)}
    >
      {item.thumbnailUri ? (
        <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="person" size={24} color="#8E8E93" />
        </View>
      )}
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.personName}</Text>
        <Text style={styles.contactDesignation}>{item.jobTitle}</Text>
        <Text style={styles.contactCompany}>{item.companyName}</Text>
        
        <View style={styles.contactActions}>
          {item.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
              <Ionicons name="call" size={18} color="#00F2FE" />
            </TouchableOpacity>
          )}
          {item.email && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
              <Ionicons name="mail" size={18} color="#00F2FE" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Cards</Text>
        <Text style={styles.headerCount}>{contacts.length} cards</Text>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color="#2A2F3E" />
            <Text style={styles.emptyText}>No business cards yet</Text>
            <Text style={styles.emptySubtext}>Scan your first card to get started</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/scan')}
            >
              <Text style={styles.emptyButtonText}>Scan Card</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            
            {selectedContact && (
              <>
                <View style={styles.actionSheetHeader}>
                  <Text style={styles.actionSheetTitle}>{selectedContact.personName}</Text>
                  <Text style={styles.actionSheetSubtitle}>{selectedContact.companyName}</Text>
                </View>

                <View style={styles.actionSheetActions}>
                  {selectedContact.phone && (
                    <TouchableOpacity style={styles.actionSheetButton} onPress={handleCall}>
                      <Ionicons name="call" size={24} color="#00F2FE" />
                      <Text style={styles.actionSheetButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}

                  {selectedContact.whatsappNumber && (
                    <TouchableOpacity style={styles.actionSheetButton} onPress={handleWhatsApp}>
                      <Ionicons name="logo-whatsapp" size={24} color="#00F2FE" />
                      <Text style={styles.actionSheetButtonText}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}

                  {selectedContact.email && (
                    <TouchableOpacity style={styles.actionSheetButton} onPress={handleEmail}>
                      <Ionicons name="mail" size={24} color="#00F2FE" />
                      <Text style={styles.actionSheetButtonText}>Email</Text>
                    </TouchableOpacity>
                  )}

                  {selectedContact.address && (
                    <TouchableOpacity style={styles.actionSheetButton} onPress={handleMaps}>
                      <Ionicons name="map" size={24} color="#00F2FE" />
                      <Text style={styles.actionSheetButtonText}>Maps</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.actionSheetButton} onPress={handleEdit}>
                    <Ionicons name="create" size={24} color="#4FACFE" />
                    <Text style={styles.actionSheetButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionSheetButton} onPress={handleDelete}>
                    <Ionicons name="trash" size={24} color="#FF6B6B" />
                    <Text style={[styles.actionSheetButtonText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerCount: {
    fontSize: 16,
    color: '#8E8E93',
  },
  listContent: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2A2F3E',
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2A2F3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  contactDesignation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 14,
    color: '#4FACFE',
    marginBottom: 8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#00F2FE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#1A1F2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#2A2F3E',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 2,
  },
  actionSheetHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionSheetSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  actionSheetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  actionSheetButton: {
    alignItems: 'center',
    width: 80,
    marginBottom: 20,
  },
  actionSheetButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
  },
  deleteText: {
    color: '#FF6B6B',
  },
});

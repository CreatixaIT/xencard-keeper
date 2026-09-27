import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { getActivePersonalCard, createPersonalCard, updatePersonalCard, deletePersonalCard } from '../../src/db/repositories/personalCardRepository';
import { shareAsync } from 'expo-sharing';
import PersonalCardForm from '../../src/components/PersonalCardForm';
import type { UserPersonalCard } from '../../src/types';

export default function PersonalCardScreen() {
  const [personalCard, setPersonalCard] = useState<UserPersonalCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonalCard();
  }, []);

  const loadPersonalCard = async () => {
    try {
      const card = await getActivePersonalCard();
      setPersonalCard(card);
    } catch (error) {
      console.error('Failed to load personal card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (card: Omit<UserPersonalCard, 'id' | 'createdTimestamp' | 'updatedTimestamp'>) => {
    try {
      if (personalCard) {
        await updatePersonalCard(personalCard.id, card);
      } else {
        await createPersonalCard(card);
      }
      await loadPersonalCard();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save personal card:', error);
      Alert.alert('Error', 'Failed to save personal card');
    }
  };

  const handleDelete = () => {
    if (!personalCard) return;
    
    Alert.alert('Delete Card', 'Are you sure you want to delete your personal card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePersonalCard(personalCard.id);
            setPersonalCard(null);
            setIsEditing(false);
          } catch (error) {
            console.error('Failed to delete personal card:', error);
            Alert.alert('Error', 'Failed to delete personal card');
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!personalCard?.fileUri) return;
    
    try {
      await shareAsync(personalCard.fileUri);
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share card');
    }
  };

  const handleOpenWebsite = () => {
    if (personalCard?.website) {
      Linking.openURL(personalCard.website);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isEditing || !personalCard) {
    return (
      <View style={styles.container}>
        <PersonalCardForm
          initialCard={personalCard || undefined}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Visiting Card</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{personalCard.fullName}</Text>
          <Text style={styles.designation}>{personalCard.designation}</Text>
          <Text style={styles.company}>{personalCard.companyName}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{personalCard.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{personalCard.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{personalCard.address}</Text>
          </View>

          {personalCard.website && (
            <TouchableOpacity style={styles.infoRow} onPress={handleOpenWebsite}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={styles.infoValueLink}>{personalCard.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.cardActionButton} onPress={handleShare}>
            <Text style={styles.cardActionButtonText}>Share Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cardActionButton, styles.cardActionButtonDelete]} onPress={handleDelete}>
            <Text style={styles.cardActionButtonText}>Delete</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    padding: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  designation: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
  },
  company: {
    fontSize: 14,
    color: '#E6F4FE',
  },
  cardBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  infoValueLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cardActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardActionButtonDelete: {
    backgroundColor: '#FF3B30',
  },
  cardActionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

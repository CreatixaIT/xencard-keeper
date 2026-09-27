import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { 
  getAllPersonalCards, 
  setActivePersonalCard, 
  deletePersonalCard 
} from '../../src/db/repositories/personalCardRepository';
import { sharingService } from '../../src/services/sharing/sharingService';
import QRCode from 'react-native-qrcode-svg';
import { qrService } from '../../src/services/qr/qrService';

export default function PersonalCardsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const allCards = await getAllPersonalCards();
      setCards(allCards);
    } catch {
      console.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActivePersonalCard(id);
      await loadCards();
      Alert.alert('Success', 'Card set as active');
    } catch {
      Alert.alert('Error', 'Failed to set active card');
    }
  };

  const handleDelete = (card: any) => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${card.fullName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonalCard(card.id);
              await loadCards();
            } catch {
              Alert.alert('Error', 'Failed to delete card');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (card: any) => {
    try {
      await sharingService.shareProfileLink(card.id);
    } catch {
      Alert.alert('Error', 'Failed to share card');
    }
  };

  const handleViewQR = (card: any) => {
    setSelectedCard(card);
    setShowQRModal(true);
  };

  const handleAddCard = () => {
    router.push('/personal-cards/create');
  };

  const handleEditCard = (id: string) => {
    router.push(`/personal-cards/create?id=${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Visiting Cards</Text>
        <TouchableOpacity onPress={handleAddCard} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No visiting cards yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first visiting card to get started
            </Text>
            <TouchableOpacity 
              style={[styles.createFirstButton, { backgroundColor: colors.accent }]} 
              onPress={handleAddCard}
            >
              <Text style={styles.createFirstButtonText}>Create Your First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((card) => (
            <View
              key={card.id}
              style={[
                styles.cardContainer,
                { 
                  backgroundColor: colors.card,
                  borderColor: card.isActive ? colors.accent : colors.border,
                  borderWidth: card.isActive ? 2 : 1,
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{card.fullName}</Text>
                  <Text style={[styles.cardCompany, { color: colors.textSecondary }]}>{card.companyName}</Text>
                  <Text style={[styles.cardDesignation, { color: colors.textSecondary }]}>{card.designation}</Text>
                </View>
                {card.isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: `${colors.accent}20` }]}>
                    <Text style={[styles.activeText, { color: colors.accent }]}>Active</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                {!card.isActive && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.background }]}
                    onPress={() => handleSetActive(card.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Set Active</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.background }]}
                  onPress={() => handleViewQR(card)}
                >
                  <Ionicons name="qr-code" size={20} color={colors.accent} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>QR</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.background }]}
                  onPress={() => handleShare(card)}
                >
                  <Ionicons name="share-social" size={20} color={colors.accent} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.background }]}
                  onPress={() => handleEditCard(card.id)}
                >
                  <Ionicons name="create" size={20} color={colors.accent} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.background }]}
                  onPress={() => handleDelete(card)}
                >
                  <Ionicons name="trash" size={20} color="#FF6B6B" />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Your QR Code</Text>

            {selectedCard && (
              <>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={qrService.generateProfileQRCodeData(selectedCard.id)}
                    size={200}
                    color="#0B0F17"
                    backgroundColor="#FFFFFF"
                  />
                </View>

                <Text style={[styles.cardNameDisplay, { color: colors.text }]}>{selectedCard.fullName}</Text>
                <Text style={[styles.cardCompanyDisplay, { color: colors.textSecondary }]}>{selectedCard.companyName}</Text>
              </>
            )}
          </View>
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
  addButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  createFirstButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  createFirstButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardCompany: {
    fontSize: 14,
    marginBottom: 2,
  },
  cardDesignation: {
    fontSize: 12,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardNameDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardCompanyDisplay: {
    fontSize: 14,
    textAlign: 'center',
  },
});

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
import { GlassCard } from '../../src/components/glass/GlassCard';
import { ExecutiveVisitingCard } from '../../src/components/glass/ExecutiveVisitingCard';

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
      Alert.alert('Success', 'Card set as primary active visiting card');
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
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Digital Wallet...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Digital Card Wallet</Text>
        <TouchableOpacity
          onPress={handleAddCard}
          style={[styles.headerBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.glassCard }]}>
              <Ionicons name="wallet-outline" size={54} color={colors.accent} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No Digital Cards Yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your executive business card with holographic QR and tap-to-share
            </Text>
            <TouchableOpacity 
              style={[styles.createFirstButton, { backgroundColor: colors.accent }]} 
              onPress={handleAddCard}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.createFirstButtonText}>Create Your First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              {/* Virtual Holographic Card Preview */}
              <ExecutiveVisitingCard
                card={card}
                onShare={() => handleShare(card)}
                onEdit={() => handleEditCard(card.id)}
              />

              {/* Card Meta & Control Bar */}
              <GlassCard variant="subtle" style={styles.cardControlsCard}>
                <View style={styles.controlHeaderRow}>
                  <View style={styles.activeStatusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: card.isActive ? colors.success : colors.textSecondary },
                      ]}
                    />
                    <Text style={[styles.statusLabel, { color: card.isActive ? colors.success : colors.textSecondary }]}>
                      {card.isActive ? 'Primary Active Visiting Card' : 'Alternative Card Profile'}
                    </Text>
                  </View>

                  {!card.isActive && (
                    <TouchableOpacity
                      style={[styles.setActiveBtn, { backgroundColor: colors.accent }]}
                      onPress={() => handleSetActive(card.id)}
                    >
                      <Text style={styles.setActiveBtnText}>Set Active</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.controlActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionChip, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
                    onPress={() => handleViewQR(card)}
                  >
                    <Ionicons name="qr-code-outline" size={16} color={colors.accent} />
                    <Text style={[styles.actionChipText, { color: colors.text }]}>QR Pass</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionChip, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
                    onPress={() => handleShare(card)}
                  >
                    <Ionicons name="share-social-outline" size={16} color={colors.accent} />
                    <Text style={[styles.actionChipText, { color: colors.text }]}>Share vCard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionChip, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
                    onPress={() => handleEditCard(card.id)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.accent} />
                    <Text style={[styles.actionChipText, { color: colors.text }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionChip, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}
                    onPress={() => handleDelete(card)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionChipText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </View>
          ))
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="glow" style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Executive QR Pass</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Scan to save full digital vCard contact profile
            </Text>

            {selectedCard && (
              <>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={qrService.generateProfileQRCodeData(selectedCard.id)}
                    size={200}
                    color="#1A0E0E"
                    backgroundColor="#FFFFFF"
                  />
                </View>

                <Text style={[styles.cardNameDisplay, { color: colors.text }]}>{selectedCard.fullName}</Text>
                <Text style={[styles.cardCompanyDisplay, { color: colors.accent }]}>{selectedCard.companyName}</Text>
                <Text style={[styles.cardDesignationDisplay, { color: colors.textSecondary }]}>
                  {selectedCard.designation}
                </Text>
              </>
            )}
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBtn: {
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
  cardWrapper: {
    marginBottom: 20,
  },
  cardControlsCard: {
    marginHorizontal: 16,
    marginTop: -4,
    padding: 14,
    borderRadius: 20,
  },
  controlHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  setActiveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  setActiveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  controlActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  cardNameDisplay: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardCompanyDisplay: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDesignationDisplay: {
    fontSize: 12,
    marginTop: 2,
  },
});

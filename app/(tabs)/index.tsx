import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContactCount, getRecentContacts } from '../../src/db/repositories/contactRepository';
import { getUserProfile } from '../../src/db/repositories/userProfileRepository';
import { getActivePersonalCard } from '../../src/db/repositories/personalCardRepository';
import { syncService } from '../../src/services/sync/syncService';
import * as Clipboard from 'expo-clipboard';
import { sharingService } from '../../src/services/sharing/sharingService';
import { useTheme } from '../../src/contexts/ThemeContext';

const XencardLogo = () => (
  <Svg width={120} height={40} viewBox="0 0 600 200">
    <Defs>
      <LinearGradient id="cyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#00F2FE" />
        <Stop offset="100%" stopColor="#4FACFE" />
      </LinearGradient>
      <LinearGradient id="darkShield" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
    </Defs>
    {/* Logo Mark */}
    <Path d="M 75,15 L 125,40 V 100 C 125,130 75,155 75,155 C 75,155 25,130 25,100 V 40 Z" 
          fill="url(#darkShield)" stroke="#1E293B" strokeWidth="3" />
    <Rect x="42" y="55" width="60" height="40" rx="6" 
          fill="#1E293B" stroke="#00F2FE" strokeWidth="1.5" strokeOpacity="0.5" 
          transform="rotate(-12 72 75)" />
    <Rect x="48" y="55" width="60" height="40" rx="6" 
          fill="url(#cyanBlue)" opacity="0.9"
          transform="rotate(8 78 75)" />
    <Path d="M 63,65 L 87,85 M 87,65 L 63,85" 
          stroke="#0B0F17" strokeWidth="4.5" strokeLinecap="round" 
          transform="rotate(8 78 75)" />
    {/* Wordmark */}
    <SvgText x="180" y="112" fontSize="38" fontWeight="800" fill="#FFFFFF" letterSpacing="1">XEN</SvgText>
    <SvgText x="268" y="112" fontSize="38" fontWeight="800" fill="#00F2FE" letterSpacing="1">CARD</SvgText>
    <SvgText x="182" y="140" fontSize="16" fontWeight="500" fill="#94A3B8" letterSpacing="7">KEEPER</SvgText>
  </Svg>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [contactCount, setContactCount] = useState(0);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [personalCard, setPersonalCard] = useState<any>(null);
  const [xencardId, setXencardId] = useState<string | null>(null);
  const [showXencardIdModal, setShowXencardIdModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [count, recent, userProfile, userCard, storedXencardId] = await Promise.all([
        getContactCount(),
        getRecentContacts(3),
        getUserProfile(),
        getActivePersonalCard(),
        syncService.getStoredXencardId(),
      ]);
      setContactCount(count);
      setRecentContacts(recent);
      setProfile(userProfile);
      setPersonalCard(userCard);
      setXencardId(storedXencardId);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleScanCard = () => {
    router.push('/scan');
  };

  const handleCreatePersonalCard = () => {
    router.push('/personal-cards');
  };

  const handleViewPersonalCard = () => {
    router.push('/personal-cards');
  };

  const handleContactPress = (contactId: string) => {
    router.push(`/contact/${contactId}`);
  };

  const handleCopyXencardId = async () => {
    if (xencardId) {
      await Clipboard.setStringAsync(xencardId);
    }
  };

  const handleShareXencardId = async () => {
    if (xencardId) {
      await sharingService.shareXencardId(xencardId);
    }
  };

  const cardLimit = profile?.cardLimit || 100;
  const remainingCards = cardLimit - contactCount;
  const showLowStorageWarning = remainingCards <= 10;

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <XencardLogo />
          {xencardId && (
            <TouchableOpacity onPress={() => setShowXencardIdModal(true)} style={styles.xencardIdBadge}>
              <Text style={styles.xencardIdText}>{xencardId.slice(0, 8)}...</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {personalCard ? (
        <TouchableOpacity style={styles.visitingCardContainer} onPress={handleViewPersonalCard}>
          <View style={styles.visitingCardPreview}>
            <View style={styles.visitingCardInfo}>
              <Text style={styles.visitingCardName}>{personalCard.fullName}</Text>
              <Text style={styles.visitingCardCompany}>{personalCard.companyName}</Text>
              <Text style={styles.visitingCardDesignation}>{personalCard.designation}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00F2FE" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.addCardButton} onPress={handleCreatePersonalCard}>
          <Ionicons name="add-circle" size={40} color="#00F2FE" />
          <Text style={styles.addCardText}>Add Visiting Card</Text>
          <Text style={styles.addCardSubtext}>Scan or enter your business card</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.scanButton} onPress={handleScanCard}>
        <Ionicons name="camera" size={24} color="#0B0F17" />
        <Text style={styles.scanButtonText}>Scan Business Card</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Storage</Text>
          {showLowStorageWarning && (
            <TouchableOpacity style={styles.warningBadge} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="warning" size={16} color="#FF6B6B" />
              <Text style={styles.warningText}>Low Storage</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.storageBar}>
          <View style={[styles.storageFill, { width: `${(contactCount / cardLimit) * 100}%` }]} />
        </View>
        <Text style={styles.storageText}>
          {contactCount} / {cardLimit} cards
        </Text>
      </View>

      {recentContacts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Cards</Text>
          {recentContacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactItem}
              onPress={() => handleContactPress(contact.id)}
            >
              {contact.thumbnailUri && (
                <Image source={{ uri: contact.thumbnailUri }} style={styles.contactThumbnail} />
              )}
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.personName}</Text>
                <Text style={styles.contactCompany}>{contact.companyName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </View>
      )}

    </ScrollView>

    <Modal
      visible={showXencardIdModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowXencardIdModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalClose}
            onPress={() => setShowXencardIdModal(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Your Xencard ID</Text>
          <View style={styles.modalXencardIdContainer}>
            <Text style={styles.xencardIdDisplay}>{xencardId}</Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={handleCopyXencardId}>
              <Ionicons name="copy" size={20} color="#00F2FE" />
              <Text style={styles.modalButtonText}>Copy ID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={handleShareXencardId}>
              <Ionicons name="share-social" size={20} color="#00F2FE" />
              <Text style={styles.modalButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xencardIdBadge: {
    backgroundColor: '#1A1F2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00F2FE',
    marginLeft: 12,
  },
  xencardIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00F2FE',
  },
  personalCard: {
    backgroundColor: '#1A1F2E',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F3E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDesignation: {
    fontSize: 16,
    color: '#00F2FE',
    marginBottom: 4,
  },
  cardCompany: {
    fontSize: 14,
    color: '#8E8E93',
  },
  createCardButton: {
    backgroundColor: '#1A1F2E',
    margin: 16,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00F2FE',
    borderStyle: 'dashed',
  },
  createCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  createCardSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2F3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#2A2F3E',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageFill: {
    height: '100%',
    backgroundColor: '#00F2FE',
    borderRadius: 4,
  },
  storageText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  contactThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2A2F3E',
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
  },
  xencardIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00F2FE',
  },
  xencardId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00F2FE',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1F2E',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#00F2FE',
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalXencardIdContainer: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#00F2FE',
  },
  xencardIdDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00F2FE',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2F3E',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00F2FE',
  },
  visitingCardsSection: {
    margin: 16,
    marginTop: 8,
  },
  visitingCardContainer: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F3E',
    marginBottom: 16,
  },
  visitingCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  visitingCardInfo: {
    flex: 1,
  },
  visitingCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  visitingCardCompany: {
    fontSize: 16,
    color: '#00F2FE',
    marginBottom: 4,
  },
  visitingCardDesignation: {
    fontSize: 14,
    color: '#8E8E93',
  },
  addCardButton: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00F2FE',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  addCardSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  scanButton: {
    backgroundColor: '#00F2FE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B0F17',
  },
});

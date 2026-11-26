import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getContactCount,
  getRecentContacts,
  getCompanyCount,
  getIndustryCount,
} from '../../src/db/repositories/contactRepository';
import { getUserProfile } from '../../src/db/repositories/userProfileRepository';
import { getActivePersonalCard } from '../../src/db/repositories/personalCardRepository';
import { syncService } from '../../src/services/sync/syncService';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { sharingService } from '../../src/services/sharing/sharingService';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { GlassKPI } from '../../src/components/glass/GlassKPI';
import { ExecutiveVisitingCard } from '../../src/components/glass/ExecutiveVisitingCard';
import { XencardLogo } from '../../src/components/XencardLogo';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [contactCount, setContactCount] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [industryCount, setIndustryCount] = useState(0);
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
      const [count, companies, industries, recent, userProfile, userCard, storedXencardId] =
        await Promise.all([
          getContactCount(),
          getCompanyCount(),
          getIndustryCount(),
          getRecentContacts(4),
          getUserProfile(),
          getActivePersonalCard(),
          syncService.getStoredXencardId(),
        ]);
      setContactCount(count);
      setCompanyCount(companies);
      setIndustryCount(industries);
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

  const handleContactPress = (contactId: string) => {
    router.push(`/contact/${contactId}`);
  };

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone?: string, name?: string) => {
    if (phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      const greeting = encodeURIComponent(
        `Hello ${name || ''}, nice connecting with you via Xencard!`
      );
      Linking.openURL(`https://wa.me/${clean}?text=${greeting}`);
    }
  };

  const handleCopyXencardId = async () => {
    if (xencardId) {
      await Clipboard.setStringAsync(xencardId);
      Alert.alert('Copied', 'Xencard ID copied to clipboard');
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
  const storagePercentage = Math.min(Math.round((contactCount / cardLimit) * 100), 100);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerLeft}>
            <XencardLogo size="navbar" />
            {xencardId && (
              <TouchableOpacity
                onPress={() => setShowXencardIdModal(true)}
                style={[
                  styles.xencardIdBadge,
                  {
                    backgroundColor: colors.glassCardSubtle,
                    borderColor: colors.glassBorderGlow,
                  },
                ]}
              >
                <Ionicons name="finger-print" size={13} color={colors.accentSecondary} />
                <Text style={[styles.xencardIdText, { color: colors.accentSecondary }]}>
                  {xencardId}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.glassCardSubtle,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Ionicons name="settings-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Executive Digital Visiting Card */}
        {personalCard ? (
          <ExecutiveVisitingCard
            card={personalCard}
            xencardId={xencardId}
            onShare={() => personalCard && sharingService.shareProfileLink(personalCard.id)}
            onEdit={() => router.push(`/personal-cards/create?id=${personalCard.id}`)}
          />
        ) : (
          <GlassCard
            variant="glow"
            style={styles.addCardPrompt}
            onPress={handleCreatePersonalCard}
          >
            <View style={styles.addCardPromptIcon}>
              <Ionicons name="card" size={28} color={colors.accent} />
            </View>
            <View style={styles.addCardPromptTextContainer}>
              <Text style={[styles.addCardTitle, { color: colors.text }]}>
                Create Your Executive Digital Card
              </Text>
              <Text style={[styles.addCardSubtitle, { color: colors.textSecondary }]}>
                Generate holographic QR, smart vCard, and tap-to-share
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.accent} />
          </GlassCard>
        )}

        {/* KPI Analytics Grid */}
        <View style={styles.kpiGrid}>
          <GlassKPI
            icon="albums"
            title="Total Cards"
            value={contactCount}
            subtitle={`${remainingCards} available`}
            color={colors.accent}
          />
          <GlassKPI
            icon="business"
            title="Companies"
            value={companyCount}
            subtitle="Networked"
            color={colors.accentSecondary}
          />
          <GlassKPI
            icon="pie-chart"
            title="Industries"
            value={industryCount}
            subtitle="Sectors"
            color="#FB923C"
          />
        </View>

        {/* Primary Glass Scan CTA */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.scanHeroButton,
            {
              backgroundColor: colors.accent,
              shadowColor: colors.glowCyan,
            },
          ]}
          onPress={handleScanCard}
        >
          <View style={styles.scanGlowLayer} />
          <View style={styles.scanContentRow}>
            <View style={styles.scanCameraCircle}>
              <Ionicons name="scan" size={26} color={colors.accent} />
            </View>
            <View style={styles.scanTextWrapper}>
              <View style={styles.scanBadgeRow}>
                <Text style={styles.scanHeroTitle}>Scan Business Card</Text>
                <View style={styles.scanAiBadge}>
                  <Text style={styles.scanAiBadgeText}>ON-DEVICE OCR</Text>
                </View>
              </View>
              <Text style={styles.scanHeroSubtitle}>
                Extract Name, Company, Phone, WhatsApp & Address
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Quick Action Matrix */}
        <View style={styles.quickActionsRow}>
          <GlassCard
            variant="default"
            style={styles.quickActionTile}
            onPress={() => router.push('/personal-cards')}
          >
            <View
              style={[
                styles.quickActionIconWrap,
                { backgroundColor: 'rgba(230, 51, 41, 0.14)' },
              ]}
            >
              <Ionicons name="wallet-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Card Wallet</Text>
          </GlassCard>

          <GlassCard
            variant="default"
            style={styles.quickActionTile}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View
              style={[
                styles.quickActionIconWrap,
                { backgroundColor: 'rgba(245, 166, 35, 0.14)' },
              ]}
            >
              <Ionicons name="sparkles" size={20} color={colors.accentSecondary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Xeni AI</Text>
          </GlassCard>

          <GlassCard
            variant="default"
            style={styles.quickActionTile}
            onPress={() => router.push('/contact/create')}
          >
            <View
              style={[
                styles.quickActionIconWrap,
                { backgroundColor: 'rgba(251, 146, 60, 0.14)' },
              ]}
            >
              <Ionicons name="person-add-outline" size={20} color="#FB923C" />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Manual Add</Text>
          </GlassCard>

          <GlassCard
            variant="default"
            style={styles.quickActionTile}
            onPress={() => setShowXencardIdModal(true)}
          >
            <View
              style={[
                styles.quickActionIconWrap,
                { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
              ]}
            >
              <Ionicons name="qr-code-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Share QR</Text>
          </GlassCard>
        </View>

        {/* Vault Storage Progress */}
        <GlassCard variant="default" style={styles.storageCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.storageTitleRow}>
              <Ionicons name="server-outline" size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Vault Storage Capacity
              </Text>
            </View>
            {showLowStorageWarning && (
              <TouchableOpacity
                style={styles.warningBadge}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.warningText}>Low Slots</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.storageBarTrack, { backgroundColor: isDark ? '#28191B' : '#FCE4E1' }]}>
            <View
              style={[
                styles.storageBarFill,
                {
                  width: `${storagePercentage}%`,
                  backgroundColor: storagePercentage > 90 ? '#EF4444' : colors.accent,
                },
              ]}
            />
          </View>

          <View style={styles.storageFooterRow}>
            <Text style={[styles.storageText, { color: colors.textSecondary }]}>
              {contactCount} of {cardLimit} Cards ({storagePercentage}%)
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={[styles.increaseLimitText, { color: colors.accent }]}>
                +20 Slots per Invite 🎁
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Recent Contacts Section */}
        {recentContacts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Added</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cards')}>
                <Text style={[styles.viewAllText, { color: colors.accent }]}>View All ({contactCount})</Text>
              </TouchableOpacity>
            </View>

            {recentContacts.map((contact) => (
              <GlassCard
                key={contact.id}
                variant="subtle"
                style={styles.contactItem}
                onPress={() => handleContactPress(contact.id)}
              >
                {contact.thumbnailUri ? (
                  <Image source={{ uri: contact.thumbnailUri }} style={styles.contactThumbnail} />
                ) : (
                  <View style={[styles.contactAvatarFallback, { backgroundColor: isDark ? '#26181A' : '#FEE2E2' }]}>
                    <Text style={[styles.avatarText, { color: colors.accent }]}>
                      {(contact.personName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                    {contact.personName}
                  </Text>
                  <Text style={[styles.contactCompany, { color: colors.textSecondary }]} numberOfLines={1}>
                    {contact.companyName}
                    {contact.jobTitle ? ` • ${contact.jobTitle}` : ''}
                  </Text>
                  {contact.industry ? (
                    <View style={styles.industryTag}>
                      <Text style={[styles.industryTagText, { color: colors.accent }]}>
                        {contact.industry}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Direct Action Quick Buttons */}
                <View style={styles.contactQuickActions}>
                  {contact.phone ? (
                    <TouchableOpacity
                      style={[styles.miniActionBtn, { backgroundColor: 'rgba(230, 51, 41, 0.14)' }]}
                      onPress={() => handleCall(contact.phone)}
                    >
                      <Ionicons name="call" size={16} color={colors.accent} />
                    </TouchableOpacity>
                  ) : null}

                  {contact.whatsappNumber || contact.phone ? (
                    <TouchableOpacity
                      style={[styles.miniActionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
                      onPress={() =>
                        handleWhatsApp(
                          contact.whatsappNumber || contact.phone,
                          contact.personName
                        )
                      }
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Glassmorphic Xencard ID Modal */}
      <Modal
        visible={showXencardIdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowXencardIdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="glow" style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowXencardIdModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(230, 51, 41, 0.15)' }]}>
                <Ionicons name="finger-print" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Your Xencard Vault ID</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Use this unique key to sync and exchange contact profiles
              </Text>
            </View>

            <View style={[styles.modalXencardIdContainer, { backgroundColor: colors.background, borderColor: colors.glassBorderGlow }]}>
              <Text style={[styles.xencardIdDisplay, { color: colors.accentSecondary }]}>{xencardId}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder }]}
                onPress={handleCopyXencardId}
              >
                <Ionicons name="copy-outline" size={18} color={colors.accentSecondary} />
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Copy ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={handleShareXencardId}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Share Profile
                </Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xencardIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  xencardIdText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addCardPrompt: {
    marginHorizontal: 16,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  addCardPromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(230, 51, 41, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardPromptTextContainer: {
    flex: 1,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  scanHeroButton: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: '#E63329',
    padding: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  scanGlowLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  scanContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scanCameraCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTextWrapper: {
    flex: 1,
  },
  scanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scanAiBadge: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scanAiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A0E0E',
    letterSpacing: 0.5,
  },
  scanHeroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  quickActionTile: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  storageCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 20,
  },
  storageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageBarTrack: {
    height: 9,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 8,
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  storageFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  increaseLimitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    gap: 12,
  },
  contactThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  contactAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  contactCompany: {
    fontSize: 12,
    fontWeight: '500',
  },
  industryTag: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  industryTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contactQuickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 24,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 2,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  modalXencardIdContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginVertical: 14,
  },
  xencardIdDisplay: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

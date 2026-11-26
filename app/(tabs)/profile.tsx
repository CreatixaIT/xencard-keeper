import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserProfile } from '../../src/db/repositories/userProfileRepository';
import { syncService } from '../../src/services/sync/syncService';
import { qrService } from '../../src/services/qr/qrService';
import { sharingService } from '../../src/services/sharing/sharingService';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/glass/GlassCard';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [xencardId, setXencardId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showAppDownloadModal, setShowAppDownloadModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userProfile, storedXencardId] = await Promise.all([
        getUserProfile(),
        syncService.getStoredXencardId(),
      ]);
      setProfile(userProfile);
      setXencardId(storedXencardId);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/settings');
  };

  const handleCopyXencardId = async () => {
    if (xencardId) {
      await Clipboard.setStringAsync(xencardId);
      Alert.alert('Copied', 'Xencard ID copied to clipboard');
    }
  };

  const handleShareProfile = async () => {
    if (xencardId) {
      try {
        await sharingService.shareProfileLink(xencardId);
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleShareReferral = async () => {
    if (profile?.referralCode) {
      try {
        await sharingService.shareReferralLink(profile.referralCode);
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleCopyReferralLink = async () => {
    if (profile?.referralCode) {
      const link = qrService.generateShareLink('referral', profile.referralCode);
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied', 'Referral link copied to clipboard');
    }
  };

  const handleContactUs = () => {
    Linking.openURL('https://xeni.xentroinfotech.com/');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of Xencard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncService.logoutUser();
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const profileUrl = xencardId ? qrService.generateProfileQRCodeData(xencardId) : '';
  const referralUrl = profile?.referralCode ? qrService.generateReferralQRCodeData(profile.referralCode) : '';
  const appDownloadUrl = qrService.getAppDownloadUrl();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 95 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Executive Profile</Text>
        <TouchableOpacity
          onPress={handleEditProfile}
          style={[styles.editIconBtn, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
        >
          <Ionicons name="settings-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      {profile && (
        <GlassCard variant="glow" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(230, 51, 41, 0.15)', borderColor: colors.accent }]}>
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                {(profile.fullName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile.fullName}</Text>
              <Text style={[styles.profileDesignation, { color: colors.accentSecondary }]}>{profile.designation}</Text>
              <Text style={[styles.profileCompany, { color: colors.textSecondary }]}>
                {profile.company || 'Enterprise Leader'}
              </Text>
            </View>
          </View>

          <View style={styles.profileDetailsGrid}>
            <View style={[styles.detailTile, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}>
              <Ionicons name="card" size={16} color={colors.accentSecondary} />
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vault ID</Text>
                <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                  {xencardId || 'Not Set'}
                </Text>
              </View>
            </View>

            <View style={[styles.detailTile, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}>
              <Ionicons name="server" size={16} color="#10B981" />
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Card Limit</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{profile.cardLimit} Cards</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Quick Action Matrix */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity & Networking</Text>

        <GlassCard
          variant="default"
          style={styles.menuCard}
          onPress={() => setShowQRModal(true)}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(230, 51, 41, 0.14)' }]}>
            <Ionicons name="qr-code" size={22} color={colors.accent} />
          </View>
          <View style={styles.menuTextContent}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>My Digital QR Pass</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Instant contact exchange without business cards
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </GlassCard>

        <GlassCard
          variant="accent"
          style={styles.menuCard}
          onPress={() => setShowReferralModal(true)}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="gift" size={22} color="#F59E0B" />
          </View>
          <View style={styles.menuTextContent}>
            <View style={styles.badgeRow}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Invite & Expand Vault</Text>
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>+20 SLOTS</Text>
              </View>
            </View>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Earn 20 extra card slots for every colleague who joins
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </GlassCard>

        <GlassCard
          variant="default"
          style={styles.menuCard}
          onPress={() => setShowAppDownloadModal(true)}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 166, 35, 0.14)' }]}>
            <Ionicons name="cloud-download-outline" size={22} color={colors.accentSecondary} />
          </View>
          <View style={styles.menuTextContent}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Share App Download QR</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Help others install Xencard APK
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </GlassCard>
      </View>

      {/* Preferences & Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>

        <GlassCard
          variant="subtle"
          style={styles.menuCard}
          onPress={() => router.push('/settings')}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 166, 35, 0.14)' }]}>
            <Ionicons name="color-palette-outline" size={22} color={colors.accentSecondary} />
          </View>
          <View style={styles.menuTextContent}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Appearance & Theme</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Glassmorphism Dark, Light & System Mode
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </GlassCard>

        <GlassCard
          variant="subtle"
          style={styles.menuCard}
          onPress={handleLogout}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </View>
          <View style={styles.menuTextContent}>
            <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Log Out</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Securely disconnect your local session
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </GlassCard>
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={[styles.footerTitle, { color: colors.text }]}>XENCARD</Text>
        <Text style={[styles.footerSubtitle, { color: colors.accentSecondary }]}>
          Powered by Xeni AI • Offline-First Executive Vault
        </Text>
        <TouchableOpacity onPress={handleContactUs}>
          <Text style={[styles.contactUs, { color: colors.accent }]}>Support & Documentation</Text>
        </TouchableOpacity>
      </View>

      {/* Personal QR Pass Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="glow" style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowQRModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Your Digital Pass</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Let anyone scan this to instantly download your business card
            </Text>

            {xencardId && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={profileUrl}
                  size={190}
                  color="#1A0E0E"
                  backgroundColor="#FFFFFF"
                />
              </View>
            )}

            <Text style={[styles.xencardIdDisplay, { color: colors.accentSecondary }]}>{xencardId}</Text>

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
                onPress={handleShareProfile}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Referral Modal */}
      <Modal
        visible={showReferralModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="glow" style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowReferralModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Invite Friends</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Earn +20 extra card slots for every colleague who registers with your code
            </Text>

            {profile?.referralCode && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={referralUrl}
                  size={180}
                  color="#1A0E0E"
                  backgroundColor="#FFFFFF"
                />
              </View>
            )}

            <View style={[styles.referralCodeContainer, { backgroundColor: colors.background, borderColor: colors.glassBorderGlow }]}>
              <Text style={[styles.referralCode, { color: colors.accentSecondary }]}>{profile?.referralCode}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder }]}
                onPress={handleCopyReferralLink}
              >
                <Ionicons name="copy-outline" size={18} color={colors.accentSecondary} />
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={handleShareReferral}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Invite
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* App Download QR Modal */}
      <Modal
        visible={showAppDownloadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppDownloadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="glow" style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAppDownloadModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Download App</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Scan this QR code to download the official Xencard APK
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={appDownloadUrl}
                size={180}
                color="#1A0E0E"
                backgroundColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={[styles.openDownloadBtn, { backgroundColor: colors.accent }]}
              onPress={() => Linking.openURL(appDownloadUrl)}
            >
              <Ionicons name="download" size={18} color="#FFFFFF" />
              <Text style={styles.openDownloadBtnText}>Open Download Page</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  editIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileDesignation: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  profileCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  profileDetailsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  detailTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  contactUs: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
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
    paddingHorizontal: 10,
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
    marginBottom: 14,
  },
  xencardIdDisplay: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  referralCodeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  openDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginTop: 8,
  },
  openDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

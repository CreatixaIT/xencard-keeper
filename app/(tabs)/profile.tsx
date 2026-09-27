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
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncService.logoutUser();
              router.replace('/auth/index');
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {profile && (
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={40} color={colors.accent} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile.fullName}</Text>
              <Text style={[styles.profileDesignation, { color: colors.textSecondary }]}>{profile.designation}</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="card" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Xencard ID</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{xencardId || 'Not set'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{profile.dateOfBirth}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="albums" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Card Limit</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{profile.cardLimit}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your QR Code</Text>
        <TouchableOpacity 
          style={[styles.qrButton, { backgroundColor: colors.card, borderColor: colors.accent }]}
          onPress={() => setShowQRModal(true)}
        >
          <Ionicons name="qr-code" size={32} color={colors.accent} />
          <Text style={[styles.qrButtonText, { color: colors.accent }]}>View QR Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite to Xencard Keeper</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Share your referral link and get +20 card slots for each friend who joins
        </Text>
        <TouchableOpacity 
          style={[styles.referralButton, { backgroundColor: colors.accent }]}
          onPress={() => setShowReferralModal(true)}
        >
          <Ionicons name="gift" size={24} color="#0B0F17" />
          <Text style={styles.referralButtonText}>Invite Friends</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Share App</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Share the Xencard Keeper app download QR code
        </Text>
        <TouchableOpacity 
          style={[styles.qrButton, { backgroundColor: colors.card, borderColor: colors.accent }]}
          onPress={() => setShowAppDownloadModal(true)}
        >
          <Ionicons name="qr-code" size={32} color={colors.accent} />
          <Text style={[styles.qrButtonText, { color: colors.accent }]}>App Download QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={handleEditProfile}>
          <Ionicons name="person-circle-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerTitle, { color: colors.text }]}>Xencard Keeper</Text>
        <Text style={[styles.footerSubtitle, { color: colors.accent }]}>Powered by Xeni</Text>
        <Text style={[styles.footerCopyright, { color: colors.textSecondary }]}>© Xencard Keeper. All rights reserved.</Text>
        <TouchableOpacity onPress={handleContactUs}>
          <Text style={[styles.contactUs, { color: colors.accent }]}>Contact Us</Text>
        </TouchableOpacity>
      </View>

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

            {xencardId && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={profileUrl}
                  size={200}
                  color="#0B0F17"
                  backgroundColor="#FFFFFF"
                />
              </View>
            )}

            <Text style={[styles.xencardIdDisplay, { color: colors.accent }]}>{xencardId}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleCopyXencardId}>
                <Ionicons name="copy" size={20} color={colors.accent} />
                <Text style={[styles.modalButtonText, { color: colors.accent }]}>Copy ID</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleShareProfile}>
                <Ionicons name="share-social" size={20} color={colors.accent} />
                <Text style={[styles.modalButtonText, { color: colors.accent }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReferralModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowReferralModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Invite Friends</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Share your referral link and get +20 card slots for each friend who joins
            </Text>

            {profile?.referralCode && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={referralUrl}
                  size={200}
                  color="#0B0F17"
                  backgroundColor="#FFFFFF"
                />
              </View>
            )}

            <View style={[styles.referralCodeContainer, { backgroundColor: colors.background, borderColor: colors.accent }]}>
              <Text style={[styles.referralCode, { color: colors.accent }]}>{profile?.referralCode}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleCopyReferralLink}>
                <Ionicons name="copy" size={20} color={colors.accent} />
                <Text style={[styles.modalButtonText, { color: colors.accent }]}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleShareReferral}>
                <Ionicons name="share-social" size={20} color={colors.accent} />
                <Text style={[styles.modalButtonText, { color: colors.accent }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAppDownloadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppDownloadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowAppDownloadModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Download Xencard Keeper</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Scan this QR code to download Xencard Keeper
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={appDownloadUrl}
                size={200}
                color="#0B0F17"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.appUrlText, { color: colors.textSecondary }]}>{appDownloadUrl}</Text>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                Linking.openURL(appDownloadUrl);
              }}
            >
              <Ionicons name="download" size={20} color={colors.accent} />
              <Text style={[styles.modalButtonText, { color: colors.accent }]}>Open Download Page</Text>
            </TouchableOpacity>
          </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileDesignation: {
    fontSize: 16,
  },
  profileDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  referralButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  referralButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0F17',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutText: {
    color: '#FF6B6B',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
    marginTop: 32,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    marginBottom: 16,
  },
  contactUs: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  xencardIdDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 24,
  },
  referralCodeContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  appUrlText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
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
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

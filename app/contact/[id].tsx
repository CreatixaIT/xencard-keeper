import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContact, deleteContact } from '../../src/db/repositories/contactRepository';
import { sharingService } from '../../src/services/sharing/sharingService';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/glass/GlassCard';
import * as Clipboard from 'expo-clipboard';
import type { VisitingCard } from '../../src/types';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [contact, setContact] = useState<VisitingCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

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
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact?.personName || 'this contact'} from your vault?`,
      [
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
      ]
    );
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
      const greeting = encodeURIComponent(
        `Hello ${contact?.personName || ''}, connecting with you via Xencard!`
      );
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${greeting}`);
    } else {
      Alert.alert('No WhatsApp', 'This contact does not have a phone number for WhatsApp.');
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
    const location = contact?.address || `${contact?.city || ''} ${contact?.country || ''}`.trim();
    if (location) {
      const query = encodeURIComponent(location);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    } else {
      Alert.alert('No Address', 'This contact does not have a saved address.');
    }
  };

  const handleExportVCard = async () => {
    if (!contact) return;
    try {
      await sharingService.shareContactCard(contact);
    } catch (error) {
      console.error('Failed to share vCard:', error);
      Alert.alert('Error', 'Could not export vCard');
    }
  };

  const copyToClipboard = async (label: string, text?: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Contact Details...</Text>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Contact Not Found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: colors.accent }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentImageUri = activeSide === 'front' ? contact.cardImageUri : (contact.backImageUri || contact.cardImageUri);

  return (
    <>
      {/* Top Glass App Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Executive Contact</Text>

        <TouchableOpacity
          onPress={handleExportVCard}
          style={[styles.headerBtn, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
        >
          <Ionicons name="share-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Profile Card */}
        <GlassCard variant="glow" style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={[styles.heroAvatar, { backgroundColor: 'rgba(230, 51, 41, 0.15)', borderColor: colors.accent }]}>
              <Text style={[styles.heroAvatarText, { color: colors.accent }]}>
                {(contact.personName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.heroIdentity}>
              <Text style={[styles.heroName, { color: colors.text }]}>{contact.personName}</Text>
              <Text style={[styles.heroDesignation, { color: colors.accent }]}>
                {contact.jobTitle || 'Executive'}
              </Text>
              <Text style={[styles.heroCompany, { color: colors.textSecondary }]}>
                {contact.companyName}
              </Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {contact.industry ? (
              <View style={[styles.industryBadge, { backgroundColor: `${colors.accent}20` }]}>
                <Ionicons name="briefcase-outline" size={12} color={colors.accent} />
                <Text style={[styles.industryText, { color: colors.accent }]}>{contact.industry}</Text>
              </View>
            ) : null}

            <View style={[styles.dateBadge, { backgroundColor: colors.glassCardSubtle }]}>
              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                Added {formatDate(contact.createdTimestamp)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick 1-Tap Action Bar */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
            onPress={handleCall}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(230, 51, 41, 0.15)' }]}>
              <Ionicons name="call" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
            onPress={handleWhatsApp}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
            </View>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
            onPress={handleEmail}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245, 166, 35, 0.15)' }]}>
              <Ionicons name="mail" size={20} color={colors.accentSecondary} />
            </View>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
            onPress={handleMaps}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
              <Ionicons name="map" size={20} color="#FB923C" />
            </View>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Maps</Text>
          </TouchableOpacity>
        </View>

        {/* One-Tap Save to Phone Contacts (vCard) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.vCardBanner, { backgroundColor: colors.accent, shadowColor: colors.glowCyan }]}
          onPress={handleExportVCard}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.vCardBannerText}>Save to Phonebook (Export vCard)</Text>
        </TouchableOpacity>

        {/* Business Card Photo Flip Viewer */}
        <View style={styles.section}>
          <View style={styles.cardPhotoHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Original Business Card</Text>

            {contact.backImageUri && (
              <View style={[styles.sideToggle, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}>
                <TouchableOpacity
                  style={[styles.sideBtn, activeSide === 'front' && { backgroundColor: colors.accent }]}
                  onPress={() => setActiveSide('front')}
                >
                  <Text style={[styles.sideBtnText, { color: activeSide === 'front' ? '#FFFFFF' : colors.textSecondary }]}>
                    Front
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sideBtn, activeSide === 'back' && { backgroundColor: colors.accent }]}
                  onPress={() => setActiveSide('back')}
                >
                  <Text style={[styles.sideBtnText, { color: activeSide === 'back' ? '#FFFFFF' : colors.textSecondary }]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cardImageWrapper}
            onPress={() => currentImageUri && setFullScreenImage(currentImageUri)}
          >
            {currentImageUri ? (
              <Image source={{ uri: currentImageUri }} style={styles.cardImage} resizeMode="contain" />
            ) : (
              <View style={[styles.noImagePlaceholder, { backgroundColor: colors.glassCardSubtle }]}>
                <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
                <Text style={[styles.noImageText, { color: colors.textSecondary }]}>No image scanned</Text>
              </View>
            )}
            <View style={styles.zoomPill}>
              <Ionicons name="expand" size={14} color="#FFFFFF" />
              <Text style={styles.zoomPillText}>Tap to Zoom</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Structured Contact Fields Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

          {contact.phone && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => copyToClipboard('Phone number', contact.phone)}
              >
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(230, 51, 41, 0.14)' }]}>
                  <Ionicons name="call-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Primary Phone</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>{contact.phone}</Text>
                </View>
                <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </GlassCard>
          )}

          {contact.alternatePhone && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => copyToClipboard('Alternate phone', contact.alternatePhone)}
              >
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(230, 51, 41, 0.14)' }]}>
                  <Ionicons name="call-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Alternate Phone</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>{contact.alternatePhone}</Text>
                </View>
                <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </GlassCard>
          )}

          {contact.whatsappNumber && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => copyToClipboard('WhatsApp number', contact.whatsappNumber)}
              >
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>WhatsApp Number</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>{contact.whatsappNumber}</Text>
                </View>
                <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </GlassCard>
          )}

          {contact.email && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => copyToClipboard('Email', contact.email)}
              >
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(245, 166, 35, 0.14)' }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.accentSecondary} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>{contact.email}</Text>
                </View>
                <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </GlassCard>
          )}

          {(contact.address || contact.city || contact.country) && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <TouchableOpacity style={styles.infoRow} onPress={handleMaps}>
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(251, 146, 60, 0.14)' }]}>
                  <Ionicons name="location-outline" size={18} color="#FB923C" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address & City</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>
                    {[contact.address, contact.city, contact.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <Ionicons name="navigate-outline" size={18} color={colors.accent} />
              </TouchableOpacity>
            </GlassCard>
          )}

          {contact.website && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => Linking.openURL(contact.website!)}
              >
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <Ionicons name="globe-outline" size={18} color="#F59E0B" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Website</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>{contact.website}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </GlassCard>
          )}

          {contact.notes ? (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.fieldIcon, { backgroundColor: 'rgba(245, 166, 35, 0.14)' }]}>
                  <Ionicons name="document-text-outline" size={18} color={colors.accentSecondary} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>{contact.notes}</Text>
                </View>
              </View>
            </GlassCard>
          ) : null}
        </View>

        {/* Raw OCR Accordion for Verification */}
        {contact.rawOcrText ? (
          <View style={styles.section}>
            <GlassCard variant="subtle" style={styles.ocrAccordion}>
              <TouchableOpacity
                style={styles.ocrHeaderRow}
                onPress={() => setShowRawOcr(!showRawOcr)}
              >
                <View style={styles.ocrHeaderLeft}>
                  <Ionicons name="code-working-outline" size={18} color={colors.accent} />
                  <Text style={[styles.ocrHeaderTitle, { color: colors.text }]}>
                    Raw On-Device OCR Data
                  </Text>
                </View>
                <Ionicons
                  name={showRawOcr ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showRawOcr && (
                <View style={[styles.rawOcrBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.rawOcrText, { color: colors.textSecondary }]}>
                    {contact.rawOcrText}
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.footerActionRow}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder }]}
            onPress={() => router.push(`/contact/create?id=${id}`)}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={[styles.editBtnText, { color: colors.text }]}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full-Screen Image Zoom Modal */}
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
            <Ionicons name="close" size={30} color="#FFFFFF" />
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 17,
    fontWeight: '800',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarText: {
    fontSize: 26,
    fontWeight: '800',
  },
  heroIdentity: {
    flex: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroDesignation: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  heroCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  industryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  industryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vCardBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  vCardBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  cardPhotoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  sideToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
    gap: 4,
  },
  sideBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sideBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardImageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 210,
    backgroundColor: '#161012',
  },
  noImagePlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noImageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  zoomPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  ocrAccordion: {
    padding: 14,
    borderRadius: 18,
  },
  ocrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ocrHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rawOcrBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  rawOcrText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 24,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
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
    zIndex: 2,
    padding: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});

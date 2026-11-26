import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContacts, deleteContact, filterContactsByIndustry } from '../../src/db/repositories/contactRepository';
import { sharingService } from '../../src/services/sharing/sharingService';
import * as Linking from 'expo-linking';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/glass/GlassCard';
import type { VisitingCard, Industry } from '../../src/types';

const INDUSTRIES: (Industry | 'All')[] = [
  'All',
  'Technology',
  'Finance',
  'Healthcare',
  'Automotive',
  'Real Estate',
  'Other',
];

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [contacts, setContacts] = useState<VisitingCard[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | 'All'>('All');
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [selectedContact, setSelectedContact] = useState<VisitingCard | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [selectedIndustry, sortAlphabetical]);

  const loadContacts = async () => {
    try {
      let list: VisitingCard[] = [];
      if (selectedIndustry === 'All') {
        list = await getContacts();
      } else {
        list = await filterContactsByIndustry(selectedIndustry);
      }

      if (sortAlphabetical) {
        list = [...list].sort((a, b) => a.personName.localeCompare(b.personName));
      }

      setContacts(list);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleContactPress = (contact: VisitingCard) => {
    router.push(`/contact/${contact.id}`);
  };

  const handleLongPress = (contact: VisitingCard) => {
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
    const phone = selectedContact?.whatsappNumber || selectedContact?.phone;
    if (phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      const greeting = encodeURIComponent(`Hello ${selectedContact?.personName || ''}, connecting via Xencard!`);
      Linking.openURL(`https://wa.me/${clean}?text=${greeting}`);
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

  const handleShareVCard = async () => {
    if (selectedContact) {
      try {
        await sharingService.shareContactCard(selectedContact);
      } catch (error) {
        console.error('Share error:', error);
      }
    }
    setShowActionSheet(false);
  };

  const handleEdit = () => {
    setShowActionSheet(false);
    if (selectedContact) {
      router.push(`/contact/create?id=${selectedContact.id}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Card',
      `Permanently delete "${selectedContact?.personName || 'this contact'}" from your vault?`,
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

  const renderContact = ({ item }: { item: VisitingCard }) => (
    <GlassCard
      variant="subtle"
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => handleLongPress(item)}
        style={styles.contactRow}
      >
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? '#26181A' : '#FEE2E2' }]}>
            <Text style={[styles.avatarInitial, { color: colors.accent }]}>
              {(item.personName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.contactInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
              {item.personName}
            </Text>
            {item.industry ? (
              <View style={[styles.industryBadge, { backgroundColor: `${colors.accent}18` }]}>
                <Text style={[styles.industryBadgeText, { color: colors.accent }]}>
                  {item.industry}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.contactDesignation, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.jobTitle ? `${item.jobTitle} • ` : ''}{item.companyName}
          </Text>

          {/* Quick Action Dock */}
          <View style={styles.contactActions}>
            {item.phone ? (
              <TouchableOpacity
                style={[styles.miniAction, { backgroundColor: 'rgba(230, 51, 41, 0.14)' }]}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Ionicons name="call" size={14} color={colors.accent} />
              </TouchableOpacity>
            ) : null}

            {item.whatsappNumber || item.phone ? (
              <TouchableOpacity
                style={[styles.miniAction, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
                onPress={() => {
                  const phone = item.whatsappNumber || item.phone;
                  const clean = phone!.replace(/[^0-9]/g, '');
                  Linking.openURL(`https://wa.me/${clean}`);
                }}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#10B981" />
              </TouchableOpacity>
            ) : null}

            {item.email ? (
              <TouchableOpacity
                style={[styles.miniAction, { backgroundColor: 'rgba(245, 166, 35, 0.14)' }]}
                onPress={() => Linking.openURL(`mailto:${item.email}`)}
              >
                <Ionicons name="mail" size={14} color={colors.accentSecondary} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.miniAction, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
              onPress={() => handleLongPress(item)}
            >
              <Ionicons name="ellipsis-horizontal" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
      </TouchableOpacity>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Card Vault</Text>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {contacts.length} cards organized
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              {
                backgroundColor: sortAlphabetical ? colors.accent : colors.glassCard,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={() => setSortAlphabetical(!sortAlphabetical)}
          >
            <Ionicons
              name={sortAlphabetical ? 'text' : 'time-outline'}
              size={18}
              color={sortAlphabetical ? '#FFFFFF' : colors.accent}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scanFab, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/scan')}
          >
            <Ionicons name="scan" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Industry Filter Chips */}
      <View style={styles.filterScrollWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={INDUSTRIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = selectedIndustry === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.accent : colors.glassCardSubtle,
                    borderColor: isActive ? colors.accent : colors.glassBorder,
                  },
                ]}
                onPress={() => setSelectedIndustry(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#FFFFFF' : colors.textSecondary, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Cards List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.glassCard }]}>
              <Ionicons name="card-outline" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No Business Cards Found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {selectedIndustry === 'All'
                ? 'Scan your first physical card or create one manually'
                : `No cards in ${selectedIndustry} yet`}
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="scan" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Scan First Card</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Glassmorphic Action Sheet Modal */}
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
          <GlassCard variant="elevated" style={styles.actionSheet}>
            <View style={[styles.actionSheetHandle, { backgroundColor: colors.border }]} />

            {selectedContact && (
              <>
                <View style={styles.actionSheetHeader}>
                  <Text style={[styles.actionSheetTitle, { color: colors.text }]} numberOfLines={1}>
                    {selectedContact.personName}
                  </Text>
                  <Text style={[styles.actionSheetSubtitle, { color: colors.accent }]} numberOfLines={1}>
                    {selectedContact.companyName}
                  </Text>
                </View>

                <View style={styles.actionGrid}>
                  {selectedContact.phone && (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                      <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(230, 51, 41, 0.15)' }]}>
                        <Ionicons name="call" size={22} color={colors.accent} />
                      </View>
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Call</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
                    <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
                    </View>
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>WhatsApp</Text>
                  </TouchableOpacity>

                  {selectedContact.email && (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
                      <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245, 166, 35, 0.15)' }]}>
                        <Ionicons name="mail" size={22} color={colors.accentSecondary} />
                      </View>
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Email</Text>
                    </TouchableOpacity>
                  )}

                  {selectedContact.address && (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleMaps}>
                      <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                        <Ionicons name="map" size={22} color="#FB923C" />
                      </View>
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Maps</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.actionBtn} onPress={handleShareVCard}>
                    <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245, 166, 35, 0.15)' }]}>
                      <Ionicons name="share-social" size={22} color="#F5A623" />
                    </View>
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Save/Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
                    <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(230, 51, 41, 0.15)' }]}>
                      <Ionicons name="create" size={22} color={colors.accent} />
                    </View>
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                    <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Ionicons name="trash" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </GlassCard>
        </TouchableOpacity>
      </Modal>
    </View>
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
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scanFab: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollWrapper: {
    marginVertical: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  contactItem: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  thumbnailPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
  },
  contactInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  industryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  industryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contactDesignation: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniAction: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  actionSheetHandle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 2,
  },
  actionSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  actionSheetSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionBtn: {
    alignItems: 'center',
    width: 74,
    gap: 6,
    marginBottom: 10,
  },
  actionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

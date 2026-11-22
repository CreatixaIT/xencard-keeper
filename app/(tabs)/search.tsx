import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchContacts, filterContactsByIndustry, getContacts } from '../../src/db/repositories/contactRepository';
import { parseXeniIntent, resolveContactForAction } from '../../src/services/xeni/xeniIntentParser';
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

const PROMPT_SUGGESTIONS = [
  'Tech in Dhaka',
  'Call Alex',
  'WhatsApp Maria',
  'Healthcare',
  'Finance',
  'Where is Google',
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<VisitingCard[]>([]);
  const [allContacts, setAllContacts] = useState<VisitingCard[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | 'All'>('All');
  const [detectedAction, setDetectedAction] = useState<{
    type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MAPS';
    targetName: string;
    matchedContact: VisitingCard | null;
  } | null>(null);

  useEffect(() => {
    loadAllContacts();
  }, []);

  useEffect(() => {
    performSmartSearch();
  }, [query, selectedIndustry]);

  const loadAllContacts = async () => {
    const all = await getContacts();
    setAllContacts(all);
    setContacts(all);
  };

  const performSmartSearch = async () => {
    const trimmed = query.trim();

    // Check for natural language assistant intent
    if (trimmed) {
      const intent = parseXeniIntent(trimmed);
      if (['CALL', 'WHATSAPP', 'EMAIL', 'MAPS'].includes(intent.type) && 'targetName' in intent && intent.targetName) {
        const contactId = resolveContactForAction(intent, allContacts, intent.targetName);
        const match = contactId ? allContacts.find((c) => c.id === contactId) || null : null;
        setDetectedAction({
          type: intent.type as any,
          targetName: intent.targetName,
          matchedContact: match,
        });
      } else {
        setDetectedAction(null);
      }
    } else {
      setDetectedAction(null);
    }

    if (selectedIndustry === 'All') {
      const results = await searchContacts(trimmed);
      setContacts(results);
    } else {
      const results = await filterContactsByIndustry(selectedIndustry);
      if (trimmed) {
        const searchResults = await searchContacts(trimmed);
        const filtered = searchResults.filter((c) => c.industry === selectedIndustry);
        setContacts(filtered);
      } else {
        setContacts(results);
      }
    }
  };

  const executeDetectedAction = () => {
    if (!detectedAction?.matchedContact) return;
    const c = detectedAction.matchedContact;

    switch (detectedAction.type) {
      case 'CALL':
        if (c.phone) Linking.openURL(`tel:${c.phone}`);
        else Alert.alert('No Phone', 'Contact has no phone number');
        break;
      case 'WHATSAPP': {
        const p = c.whatsappNumber || c.phone;
        if (p) {
          const clean = p.replace(/[^0-9]/g, '');
          Linking.openURL(`https://wa.me/${clean}`);
        } else {
          Alert.alert('No WhatsApp', 'No mobile number found');
        }
        break;
      }
      case 'EMAIL':
        if (c.email) Linking.openURL(`mailto:${c.email}`);
        else Alert.alert('No Email', 'No email address registered');
        break;
      case 'MAPS':
        if (c.address) {
          Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(c.address)}`);
        } else {
          Alert.alert('No Address', 'No location saved for this contact');
        }
        break;
    }
  };

  const renderContact = ({ item }: { item: VisitingCard }) => (
    <GlassCard
      variant="subtle"
      style={styles.contactItem}
      onPress={() => router.push(`/contact/${item.id}`)}
    >
      <View style={styles.contactRow}>
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <Text style={[styles.avatarInitial, { color: colors.accent }]}>
              {(item.personName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.contactInfo}>
          <View style={styles.contactHeaderLine}>
            <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
              {item.personName}
            </Text>
            {item.industry ? (
              <View style={[styles.industryBadge, { backgroundColor: `${colors.accent}15` }]}>
                <Text style={[styles.industryBadgeText, { color: colors.accent }]}>
                  {item.industry}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.contactCompany, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.jobTitle ? `${item.jobTitle} • ` : ''}{item.companyName}
          </Text>

          {item.phone || item.city ? (
            <Text style={[styles.contactMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.phone || ''}{item.phone && item.city ? ' • ' : ''}{item.city || ''}
            </Text>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="sparkles" size={24} color={colors.accent} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Xeni Smart Search</Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Instant offline search, industry filter & natural voice-like actions
        </Text>
      </View>

      {/* Glass Search Input */}
      <View style={styles.searchContainer}>
        <GlassCard variant="glow" style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.accent} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, company, city, or 'Call Alex'..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>

      {/* Smart Query Suggestion Pills */}
      <View style={styles.suggestionWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PROMPT_SUGGESTIONS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.suggestionList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: colors.glassCardSubtle,
                  borderColor: colors.glassBorder,
                },
              ]}
              onPress={() => setQuery(item)}
            >
              <Ionicons name="bulb-outline" size={12} color={colors.accent} />
              <Text style={[styles.suggestionChipText, { color: colors.textSecondary }]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Detected Xeni Action Card */}
      {detectedAction && detectedAction.matchedContact && (
        <GlassCard variant="accent" style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <View style={styles.actionBadgeWrap}>
              <Ionicons
                name={
                  detectedAction.type === 'CALL'
                    ? 'call'
                    : detectedAction.type === 'WHATSAPP'
                    ? 'logo-whatsapp'
                    : detectedAction.type === 'EMAIL'
                    ? 'mail'
                    : 'map'
                }
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.actionBadgeTitle, { color: colors.accent }]}>
                XENI DIRECT ACTION
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.executeButton, { backgroundColor: colors.accent }]}
              onPress={executeDetectedAction}
            >
              <Text style={styles.executeButtonText}>
                {detectedAction.type} NOW
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.actionContactName, { color: colors.text }]}>
            Target: {detectedAction.matchedContact.personName} ({detectedAction.matchedContact.companyName})
          </Text>
        </GlassCard>
      )}

      {/* Industry Filter Bar */}
      <View style={styles.industryFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={INDUSTRIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterChipList}
          renderItem={({ item }) => {
            const active = selectedIndustry === item;
            return (
              <TouchableOpacity
                style={[
                  styles.industryChip,
                  {
                    backgroundColor: active ? colors.accent : colors.glassCardSubtle,
                    borderColor: active ? colors.accent : colors.glassBorder,
                  },
                ]}
                onPress={() => setSelectedIndustry(item)}
              >
                <Text
                  style={[
                    styles.industryChipText,
                    { color: active ? '#0B0F17' : colors.textSecondary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Results List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.glassCard }]}>
              <Ionicons name="search" size={40} color={colors.accent} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No Contacts Found</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Try searching by company, title, city, or phone number
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  suggestionWrap: {
    marginTop: 8,
  },
  suggestionList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  executeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  executeButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B0F17',
    letterSpacing: 0.5,
  },
  actionContactName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  industryFilter: {
    marginTop: 10,
    marginBottom: 6,
  },
  filterChipList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  industryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  industryChipText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  contactItem: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  thumbnailPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  contactName: {
    fontSize: 15,
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
  contactCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  contactMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});

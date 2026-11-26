import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { qrService } from '../../services/qr/qrService';

interface ExecutiveVisitingCardProps {
  card: {
    id: string;
    fullName: string;
    companyName: string;
    designation: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  xencardId?: string | null;
  onShare?: () => void;
  onEdit?: () => void;
}

export const ExecutiveVisitingCard: React.FC<ExecutiveVisitingCardProps> = ({
  card,
  xencardId,
  onShare,
  onEdit,
}) => {
  const { colors, isDark } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);

  const qrData = xencardId
    ? qrService.generateProfileQRCodeData(xencardId)
    : qrService.generateProfileQRCodeData(card.id);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => setIsFlipped(!isFlipped)}
        style={[
          styles.cardContainer,
          {
            borderColor: isDark ? 'rgba(245, 166, 35, 0.40)' : 'rgba(217, 43, 34, 0.35)',
            backgroundColor: isDark ? '#181113' : '#FFFFFF',
            shadowColor: colors.glowCyan,
          },
        ]}
      >
        {/* Holographic Geometric Background Shimmer */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="holoCard" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#2B1518' : '#FFF5F5'} stopOpacity="0.95" />
              <Stop offset="50%" stopColor={isDark ? '#181012' : '#FEF2F2'} stopOpacity="0.96" />
              <Stop offset="100%" stopColor={isDark ? '#0D0A0B' : '#FFFBEB'} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#E63329" />
              <Stop offset="100%" stopColor="#F5A623" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx="24" fill="url(#holoCard)" />
          {/* Subtle decorative mesh arcs */}
          <Path d="M 0,0 C 120,40 220,120 380,80" stroke="rgba(230, 51, 41, 0.16)" strokeWidth="2" fill="none" />
          <Path d="M 0,60 C 140,100 240,180 400,140" stroke="rgba(245, 166, 35, 0.14)" strokeWidth="1.5" fill="none" />
          <Circle cx="320" cy="40" r="80" fill="rgba(245, 166, 35, 0.05)" />
        </Svg>

        {!isFlipped ? (
          /* FRONT SIDE */
          <View style={styles.frontContent}>
            {/* Top Bar with EMV Chip & Brand */}
            <View style={styles.cardTopRow}>
              <View style={styles.chipWrapper}>
                <Svg width={38} height={28} viewBox="0 0 38 28">
                  <Defs>
                    <LinearGradient id="goldChip" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#F59E0B" />
                      <Stop offset="50%" stopColor="#FCD34D" />
                      <Stop offset="100%" stopColor="#D97706" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="1" y="1" width="36" height="26" rx="5" fill="url(#goldChip)" stroke="#B45309" strokeWidth="1" />
                  <Path d="M 1,14 H 37 M 13,1 V 27 M 25,1 V 27" stroke="#92400E" strokeWidth="0.8" />
                  <Circle cx="19" cy="14" r="4" fill="#D97706" opacity="0.6" />
                </Svg>
                <View style={styles.nfcIcon}>
                  <Ionicons name="radio-outline" size={16} color={colors.accentSecondary} />
                </View>
              </View>

              <View style={styles.topRightBadge}>
                <View style={[styles.verifiedPill, { backgroundColor: 'rgba(245, 166, 35, 0.14)', borderColor: colors.accentSecondary }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.accentSecondary} />
                  <Text style={[styles.verifiedText, { color: colors.accentSecondary }]}>EXECUTIVE</Text>
                </View>
              </View>
            </View>

            {/* Main Info */}
            <View style={styles.identitySection}>
              <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
                {card.fullName}
              </Text>
              <Text style={[styles.designation, { color: colors.accent }]} numberOfLines={1}>
                {card.designation}
              </Text>
              <Text style={[styles.companyName, { color: colors.textSecondary }]} numberOfLines={1}>
                {card.companyName}
              </Text>
            </View>

            {/* Bottom Row */}
            <View style={styles.cardBottomRow}>
              <View style={styles.contactPills}>
                {card.phone ? (
                  <View style={styles.miniPill}>
                    <Ionicons name="call" size={12} color={colors.textSecondary} />
                    <Text style={[styles.miniPillText, { color: colors.textSecondary }]}>{card.phone}</Text>
                  </View>
                ) : null}
                {card.email ? (
                  <View style={styles.miniPill}>
                    <Ionicons name="mail" size={12} color={colors.textSecondary} />
                    <Text style={[styles.miniPillText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {card.email}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={14} color={colors.accent} />
                <Text style={[styles.flipHintText, { color: colors.accent }]}>Tap to Flip</Text>
              </View>
            </View>
          </View>
        ) : (
          /* BACK SIDE */
          <View style={styles.backContent}>
            <View style={styles.backHeader}>
              <View>
                <Text style={[styles.backTitle, { color: colors.text }]}>SCAN TO CONNECT</Text>
                <Text style={[styles.backSubtitle, { color: colors.textSecondary }]}>
                  Instant vCard & Profile Sync
                </Text>
              </View>
              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={14} color={colors.accent} />
                <Text style={[styles.flipHintText, { color: colors.accent }]}>Flip Front</Text>
              </View>
            </View>

            <View style={styles.qrRow}>
              <View style={styles.qrFrame}>
                <QRCode
                  value={qrData}
                  size={100}
                  color="#1A0E0E"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <View style={styles.backDetails}>
                {xencardId && (
                  <View style={styles.backMetaItem}>
                    <Text style={[styles.backMetaLabel, { color: colors.textSecondary }]}>XENCARD ID</Text>
                    <Text style={[styles.backMetaValue, { color: colors.accent }]}>{xencardId}</Text>
                  </View>
                )}
                {card.website && (
                  <View style={styles.backMetaItem}>
                    <Text style={[styles.backMetaLabel, { color: colors.textSecondary }]}>WEBSITE</Text>
                    <Text style={[styles.backMetaValue, { color: colors.text }]} numberOfLines={1}>
                      {card.website}
                    </Text>
                  </View>
                )}
                {card.address && (
                  <View style={styles.backMetaItem}>
                    <Text style={[styles.backMetaLabel, { color: colors.textSecondary }]}>LOCATION</Text>
                    <Text style={[styles.backMetaValue, { color: colors.text }]} numberOfLines={1}>
                      {card.address}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Action Footer Buttons */}
      <View style={styles.actionButtonsRow}>
        {onShare && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={onShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Share Card</Text>
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={onEdit}>
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit Card</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  cardContainer: {
    borderRadius: 24,
    padding: 20,
    minHeight: 215,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  frontContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nfcIcon: {
    opacity: 0.8,
  },
  topRightBadge: {
    flexDirection: 'row',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  identitySection: {
    marginVertical: 14,
  },
  fullName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  designation: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactPills: {
    flex: 1,
    gap: 4,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(230, 51, 41, 0.12)',
  },
  flipHintText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  backSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qrFrame: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backDetails: {
    flex: 1,
    gap: 8,
  },
  backMetaItem: {
    gap: 2,
  },
  backMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  backMetaValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

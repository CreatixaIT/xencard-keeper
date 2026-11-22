import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassCard } from './GlassCard';

interface GlassKPIProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  badge?: string;
}

export const GlassKPI: React.FC<GlassKPIProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  badge,
}) => {
  const { colors } = useTheme();
  const accentColor = color || colors.accent;

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` }]}>
          <Ionicons name={icon} size={20} color={accentColor} />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${colors.success}20` }]}>
            <Text style={[styles.badgeText, { color: colors.success }]}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    padding: 14,
    borderRadius: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

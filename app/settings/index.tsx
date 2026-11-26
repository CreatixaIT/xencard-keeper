import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ThemeMode } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/glass/GlassCard';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, colors } = useTheme();

  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.glassCardSubtle, borderColor: colors.glassBorder }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Appearance</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Display Theme</Text>

        <GlassCard
          variant={mode === 'dark' ? 'glow' : 'subtle'}
          style={styles.option}
          onPress={() => handleThemeChange('dark')}
        >
          <View style={styles.optionContent}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(230, 51, 41, 0.14)' }]}>
              <Ionicons name="moon" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.optionText, { color: colors.text }]}>Dark Glassmorphism</Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>Deep dark glass with Xentro crimson & gold glow</Text>
            </View>
          </View>
          {mode === 'dark' && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
        </GlassCard>

        <GlassCard
          variant={mode === 'light' ? 'glow' : 'subtle'}
          style={styles.option}
          onPress={() => handleThemeChange('light')}
        >
          <View style={styles.optionContent}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 166, 35, 0.14)' }]}>
              <Ionicons name="sunny" size={20} color={colors.accentSecondary} />
            </View>
            <View>
              <Text style={[styles.optionText, { color: colors.text }]}>Light Frosted</Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>Clean bright translucent aesthetic</Text>
            </View>
          </View>
          {mode === 'light' && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
        </GlassCard>

        <GlassCard
          variant={mode === 'system' ? 'glow' : 'subtle'}
          style={styles.option}
          onPress={() => handleThemeChange('system')}
        >
          <View style={styles.optionContent}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(251, 146, 60, 0.14)' }]}>
              <Ionicons name="phone-portrait" size={20} color="#FB923C" />
            </View>
            <View>
              <Text style={[styles.optionText, { color: colors.text }]}>System Default</Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>Match operating system preference</Text>
            </View>
          </View>
          {mode === 'system' && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Application Info</Text>
        <GlassCard variant="default" style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Application</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Xencard</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Engine</Text>
            <Text style={[styles.infoValue, { color: colors.accent }]}>Powered by Xeni AI</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Architecture</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>100% Offline-First (SQLite + ML Kit)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Build Version</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>v1.1.0 (Release)</Text>
          </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
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
  placeholder: {
    width: 38,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    padding: 16,
    borderRadius: 18,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});

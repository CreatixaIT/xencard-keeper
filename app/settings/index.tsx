import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ThemeMode } from '../../src/contexts/ThemeContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, colors } = useTheme();

  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        
        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => handleThemeChange('dark')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="moon" size={24} color={colors.accent} />
            <Text style={[styles.optionText, { color: colors.text }]}>Dark</Text>
          </View>
          {mode === 'dark' && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => handleThemeChange('light')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="sunny" size={24} color={colors.accent} />
            <Text style={[styles.optionText, { color: colors.text }]}>Light</Text>
          </View>
          {mode === 'light' && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => handleThemeChange('system')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="phone-portrait" size={24} color={colors.accent} />
            <Text style={[styles.optionText, { color: colors.text }]}>System</Text>
          </View>
          {mode === 'system' && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>Xencard Keeper</Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>Powered by Xeni</Text>
        </View>
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
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    marginBottom: 4,
  },
});

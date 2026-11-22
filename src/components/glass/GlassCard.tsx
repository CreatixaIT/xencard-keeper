import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glow' | 'accent' | 'subtle' | 'elevated';
  onPress?: () => void;
  activeOpacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  activeOpacity = 0.85,
}) => {
  const { colors, isDark } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'glow':
        return {
          backgroundColor: colors.glassCard,
          borderColor: colors.glassBorderGlow,
          borderWidth: 1.5,
          shadowColor: colors.glowCyan,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.15,
          shadowRadius: 12,
          elevation: 6,
        };
      case 'accent':
        return {
          backgroundColor: isDark ? 'rgba(0, 242, 254, 0.08)' : 'rgba(2, 132, 199, 0.08)',
          borderColor: isDark ? 'rgba(0, 242, 254, 0.35)' : 'rgba(2, 132, 199, 0.35)',
          borderWidth: 1,
        };
      case 'subtle':
        return {
          backgroundColor: colors.glassCardSubtle,
          borderColor: colors.glassBorder,
          borderWidth: 1,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.glassCard,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 8,
          elevation: 4,
        };
    }
  };

  const containerStyle = [
    styles.card,
    getVariantStyles(),
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
});

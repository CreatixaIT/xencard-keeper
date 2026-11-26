import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface XencardLogoProps {
  size?: 'navbar' | 'hero';
}

/**
 * Shared Xencard brand mark & wordmark styled in Xentro Red (#E63329) & Gold (#F5A623).
 * Uses native Text beside a crisp SVG emblem so the title stays bold and unclipped at any DPI.
 */
export const XencardLogo: React.FC<XencardLogoProps> = ({ size = 'navbar' }) => {
  const { colors, isDark } = useTheme();
  const isHero = size === 'hero';
  const iconSize = isHero ? 64 : 42;
  const fontSize = isHero ? 34 : 23;
  const shieldTop = isDark ? '#2B181A' : '#1F1213';
  const shieldBottom = isDark ? '#120B0C' : '#0D0809';

  return (
    <View style={[styles.container, isHero && styles.heroContainer]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 88 92">
        <Defs>
          <LinearGradient id={`xentroLogoGrad_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E63329" />
            <Stop offset="100%" stopColor="#F5A623" />
          </LinearGradient>
          <LinearGradient id={`shieldBg_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={shieldTop} />
            <Stop offset="100%" stopColor={shieldBottom} />
          </LinearGradient>
        </Defs>
        {/* Outer Shield */}
        <Path
          d="M 44,4 L 82,20 V 54 C 82,73 44,88 44,88 C 44,88 6,73 6,54 V 20 Z"
          fill={`url(#shieldBg_${size})`}
          stroke="#F5A623"
          strokeWidth="2.2"
          strokeOpacity="0.65"
        />
        {/* Back Stacked Card */}
        <Rect
          x="18"
          y="29"
          width="46"
          height="30"
          rx="5"
          fill="#221315"
          stroke="#F5A623"
          strokeWidth="1.6"
          strokeOpacity="0.8"
          transform="rotate(-12 41 44)"
        />
        {/* Front Glowing Card */}
        <Rect
          x="23"
          y="29"
          width="46"
          height="30"
          rx="5"
          fill={`url(#xentroLogoGrad_${size})`}
          transform="rotate(8 46 44)"
        />
        {/* Crisp X Cutout Accent */}
        <Path
          d="M 35,36 L 57,52 M 57,36 L 35,52"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(8 46 44)"
        />
      </Svg>

      <Text style={[styles.wordmark, { fontSize }]}>
        <Text style={{ color: colors.text }}>XEN</Text>
        <Text style={{ color: colors.accent }}>CARD</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroContainer: {
    gap: 12,
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

interface ReferralQRProps {
  referralCode: string;
  size?: number;
}

export default function ReferralQR({ referralCode, size = 200 }: ReferralQRProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code using a public API
    const referralUrl = `https://xencard.com/download?ref=${referralCode}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(referralUrl)}`;
    setQrUrl(qrApiUrl);
  }, [referralCode, size]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {qrUrl ? (
        <Image 
          source={{ uri: qrUrl }} 
          style={{ width: size - 32, height: size - 32 }}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading QR...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#8E8E93',
    fontSize: 14,
  },
});
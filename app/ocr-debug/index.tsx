import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

interface OCRDebugData {
  rawText?: string;
  ocrBlocks?: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  lines?: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  extractedData?: any;
  overallConfidence?: number;
  engine?: string;
  imageSize?: { width: number; height: number };
}

export default function OCRDebugScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  
  const debugData: OCRDebugData = params.data ? JSON.parse(params.data as string) : null;

  if (!debugData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>No debug data available</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.accent }]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.header, { color: colors.text }]}>OCR Debug Output</Text>

      {/* OCR Engine and Image Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>OCR ENGINE & IMAGE INFO</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Engine:</Text>
        <Text style={[styles.value, { color: colors.text }]}>{debugData.engine || 'Unknown'}</Text>
        {debugData.imageSize && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Image Size:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {debugData.imageSize.width} x {debugData.imageSize.height}
            </Text>
          </>
        )}
      </View>

      {/* Raw OCR Text */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>RAW OCR TEXT</Text>
        <Text style={[styles.text, { color: colors.text }]}>{debugData.rawText || 'No raw text'}</Text>
      </View>

      {/* OCR Blocks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>OCR BLOCKS</Text>
        {debugData.ocrBlocks?.map((block, index) => (
          <View key={index} style={styles.block}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>Block {index + 1}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Text:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{block.text}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confidence:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{(block.confidence * 100).toFixed(1)}%</Text>
            {block.boundingBox && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Bounding Box:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  X: {block.boundingBox.x}, Y: {block.boundingBox.y}, W: {block.boundingBox.width}, H: {block.boundingBox.height}
                </Text>
              </>
            )}
          </View>
        ))}
      </View>

      {/* Reconstructed Lines */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>RECONSTRUCTED LINES</Text>
        {debugData.lines?.map((line, index) => (
          <View key={index} style={styles.block}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>Line {index + 1}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{line.text}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confidence: {(line.confidence * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      {/* Extracted Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>FINAL EXTRACTED DATA</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Overall Confidence: {(debugData.overallConfidence || 0 * 100).toFixed(1)}%</Text>
        
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Name:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.fullName?.value || 'Not detected'}
          </Text>
          {debugData.extractedData?.fullName?.confidence && (
            <Text style={[styles.confidence, { color: colors.textSecondary }]}>
              Conf: {(debugData.extractedData.fullName.confidence * 100).toFixed(1)}%
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Designation:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.designation?.value || 'Not detected'}
          </Text>
          {debugData.extractedData?.designation?.confidence && (
            <Text style={[styles.confidence, { color: colors.textSecondary }]}>
              Conf: {(debugData.extractedData.designation.confidence * 100).toFixed(1)}%
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Company:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.company?.value || 'Not detected'}
          </Text>
          {debugData.extractedData?.company?.confidence && (
            <Text style={[styles.confidence, { color: colors.textSecondary }]}>
              Conf: {(debugData.extractedData.company.confidence * 100).toFixed(1)}%
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Phone:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.phone?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Mobile:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.alternatePhone?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>WhatsApp:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.whatsappNumber?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Email:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.email?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Website:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.website?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Address:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.address?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>City:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.city?.value || 'Not detected'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.accent }]}>Country:</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {debugData.extractedData?.country?.value || 'Not detected'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  block: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  field: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
  },
  confidence: {
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
});

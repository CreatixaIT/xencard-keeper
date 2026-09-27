import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ocrService } from '../../src/services/ocr/ocrService';
import { BusinessCardData } from '../../src/services/ocr/ocrEngine';
import { imageCaptureService } from '../../src/services/image/imageCaptureService';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScanStep = 'front' | 'back' | 'review';

const getFieldValue = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (field && field.value) return field.value;
  return '';
};

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanStep, setScanStep] = useState<ScanStep>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<BusinessCardData | null>(null);
  const [ocrDebugData, setOcrDebugData] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.accent} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            Xencard Keeper needs access to your camera to scan business cards.
          </Text>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.accent }]} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async (side: 'front' | 'back') => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        
        // Use image capture service for proper normalization
        // This creates separate display and OCR derivatives
        const captureResult = await imageCaptureService.captureForOCR(photo.uri);
        
        if (side === 'front') {
          setFrontImage(captureResult.displayUri);
          setScanStep('back');
        } else {
          setBackImage(captureResult.displayUri);
          await processImages();
        }
      } catch (error) {
        console.error('Capture error:', error);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const handleRetake = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setScanStep('front');
    } else {
      setBackImage(null);
      setScanStep('back');
    }
  };

  const handleSkipBack = async () => {
    setBackImage(null);
    await processImages();
  };

  const processImages = async () => {
    if (!frontImage) return;
    
    setIsProcessing(true);
    try {
      // OCR the front image (or both if back exists)
      let result;
      if (backImage) {
        result = await ocrService.recognizeBusinessCardWithBack(frontImage, backImage);
      } else {
        result = await ocrService.recognizeBusinessCard(frontImage);
      }
      
      if (result.success) {
        setOcrResult(result.data);
        // Store debug data
        if (result.debugData) {
          setOcrDebugData(result.debugData);
        }
      } else {
        Alert.alert('OCR Warning', result.error || 'Could not extract all information. You can edit manually.');
        setOcrResult({});
      }
      setScanStep('review');
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process card');
      setOcrResult({});
      setScanStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceed = () => {
    router.push({
      pathname: '/scan/confirm',
      params: {
        frontImageUri: frontImage || '',
        backImageUri: backImage || '',
        ocrData: JSON.stringify(ocrResult),
      },
    });
  };

  const handleBack = () => {
    if (scanStep === 'review') {
      setScanStep('back');
      setOcrResult(null);
    } else if (scanStep === 'back') {
      setScanStep('front');
      setBackImage(null);
    }
  };

  // Review step - show both images and OCR results
  if (scanStep === 'review' && frontImage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Review Card</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.imageSection}>
            <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>FRONT</Text>
            <TouchableOpacity onPress={() => {/* TODO: Enlarge image */}}>
              <Image source={{ uri: frontImage }} style={styles.cardImage} />
            </TouchableOpacity>
          </View>

          {backImage && (
            <View style={styles.imageSection}>
              <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>BACK</Text>
              <TouchableOpacity onPress={() => {/* TODO: Enlarge image */}}>
                <Image source={{ uri: backImage }} style={styles.cardImage} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.ocrSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.ocrTitle, { color: colors.text }]}>Extracted Information</Text>
            <View style={styles.ocrItem}>
              <Ionicons name="person" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.fullName) || 'Not detected'}</Text>
            </View>
            <View style={styles.ocrItem}>
              <Ionicons name="briefcase" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.designation) || 'Not detected'}</Text>
            </View>
            <View style={styles.ocrItem}>
              <Ionicons name="business" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.company) || 'Not detected'}</Text>
            </View>
            <View style={styles.ocrItem}>
              <Ionicons name="call" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.phone) || 'Not detected'}</Text>
            </View>
            <View style={styles.ocrItem}>
              <Ionicons name="mail" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.email) || 'Not detected'}</Text>
            </View>
            <View style={styles.ocrItem}>
              <Ionicons name="globe" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.website) || 'Not detected'}</Text>
            </View>
            <View style={styles.ocrItem}>
              <Ionicons name="location" size={20} color={colors.accent} />
              <Text style={[styles.ocrText, { color: colors.textSecondary }]}>{getFieldValue(ocrResult?.address) || 'Not detected'}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 16 }]}>
          {ocrDebugData && (
            <TouchableOpacity style={[styles.debugButton, { backgroundColor: '#FF9500' }]} onPress={() => router.push({ pathname: '/ocr-debug', params: { data: JSON.stringify(ocrDebugData) } })}>
              <Ionicons name="bug" size={20} color="#fff" />
              <Text style={styles.debugButtonText}>View OCR Debug</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.accent }]} onPress={handleBack}>
            <Ionicons name="camera" size={20} color={colors.accent} />
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={handleProceed}>
            <Text style={styles.primaryButtonText}>Continue to Edit</Text>
            <Ionicons name="arrow-forward" size={20} color="#0B0F17" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Back capture step
  if (scanStep === 'back' && frontImage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => handleRetake('front')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Scan Back</Text>
          <View style={styles.placeholder} />
        </View>

        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraGuide}>
              <View style={[styles.corner, { borderColor: colors.accent }]} />
              <View style={[styles.corner, styles.cornerRight, { borderColor: colors.accent }]} />
              <View style={[styles.corner, styles.cornerBottom, { borderColor: colors.accent }]} />
              <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.accent }]} />
            </View>

            <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 32 }]}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureButton} onPress={() => handleCapture('back')}>
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={handleSkipBack}>
                <Text style={[styles.skipText, { color: colors.text }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // Front capture step (default)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Scan Front</Text>
        <View style={styles.placeholder} />
      </View>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraGuide}>
            <View style={[styles.corner, { borderColor: colors.accent }]} />
            <View style={[styles.corner, styles.cornerRight, { borderColor: colors.accent }]} />
            <View style={[styles.corner, styles.cornerBottom, { borderColor: colors.accent }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.accent }]} />
          </View>

          <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 32 }]}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={() => handleCapture('front')}>
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>

      {isProcessing && (
        <Modal visible={isProcessing} transparent animationType="fade">
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.processingText, { color: colors.text }]}>Processing card...</Text>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 3,
  },
  cornerRight: {
    right: 60,
  },
  cornerBottom: {
    top: 60,
  },
  cornerBottomRight: {
    right: 60,
    top: 60,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 32,
    paddingBottom: 48,
  },
  controlButton: {
    padding: 16,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    margin: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  ocrSummary: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
  },
  ocrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ocrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ocrText: {
    fontSize: 16,
    flex: 1,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  debugButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

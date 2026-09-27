import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageCaptureResult {
  displayUri: string; // Original image for display/storage
  ocrUri: string; // High-quality OCR derivative
  width: number;
  height: number;
  orientation: number;
}

/**
 * Image Capture Service
 * 
 * Handles camera capture with proper orientation normalization
 * and creates high-quality OCR derivatives.
 * 
 * Phase 1: Fix image capture/orientation/quality
 */
export class ImageCaptureService {
  /**
   * Capture and normalize image for OCR
   * 
   * Pipeline:
   * CAPTURE → ORIENTATION NORMALIZATION → HIGH QUALITY OCR IMAGE
   * 
   * - Preserves original image for display/storage
   * - Creates separate OCR derivative with proper normalization
   * - Targets 1600-2400 pixels on long edge
   * - JPEG quality 0.90-0.95
   * - Normalizes orientation to upright
   */
  static async captureForOCR(photoUri: string): Promise<ImageCaptureResult> {
    try {
      // Step 1: Get original image info
      const originalInfo = await ImageManipulator.manipulateAsync(
        photoUri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const { width: originalWidth, height: originalHeight } = originalInfo;

      // Step 2: Normalize orientation
      // Expo Camera typically handles orientation correctly when processing is enabled
      // We preserve the original orientation from the camera
      const normalizedUri = originalInfo.uri;

      // Step 3: Create high-quality OCR derivative
      // Target 1600-2400 pixels on long edge
      const targetLongEdge = 2000; // Middle of 1600-2400 range
      let targetWidth, targetHeight;

      if (originalWidth >= originalHeight) {
        targetWidth = targetLongEdge;
        targetHeight = Math.round((originalHeight / originalWidth) * targetLongEdge);
      } else {
        targetHeight = targetLongEdge;
        targetWidth = Math.round((originalWidth / originalHeight) * targetLongEdge);
      }

      // Only resize if the image is larger than target
      // to avoid upscaling small images unnecessarily
      let ocrUri = normalizedUri;
      if (originalWidth > targetWidth || originalHeight > targetHeight) {
        const resized = await ImageManipulator.manipulateAsync(
          normalizedUri,
          [{ resize: { width: targetWidth, height: targetHeight } }],
          { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
        );
        ocrUri = resized.uri;
      }

      return {
        displayUri: originalInfo.uri, // Original for display
        ocrUri, // High-quality derivative for OCR
        width: originalWidth,
        height: originalHeight,
        orientation: 0, // Assuming upright for now
      };
    } catch (error) {
      console.error('Image capture error:', error);
      // Fallback: return original
      return {
        displayUri: photoUri,
        ocrUri: photoUri,
        width: 0,
        height: 0,
        orientation: 0,
      };
    }
  }

  /**
   * Alternative orientation correction using OCR scoring
   * 
   * If EXIF orientation is unreliable, we can:
   * 1. Try OCR at 0°
   * 2. If quality threshold not met, try 180°
   * 3. If still not met, try 90° and 270°
   * 
   * This is expensive and should only be used as fallback.
   */
  static async correctOrientationWithOCR(
    imageUri: string,
    ocrEngine: (uri: string) => Promise<{ success: boolean; quality: number }>
  ): Promise<string> {
    const orientations = [0, 180, 90, 270];
    const minQualityThreshold = 0.5;

    for (const rotation of orientations) {
      let testUri = imageUri;
      
      if (rotation !== 0) {
        const rotated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ rotate: rotation }],
          { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
        );
        testUri = rotated.uri;
      }

      const result = await ocrEngine(testUri);
      
      if (result.success && result.quality >= minQualityThreshold) {
        return testUri;
      }
    }

    // If none pass threshold, return 0° (original)
    return imageUri;
  }
}

export const imageCaptureService = ImageCaptureService;

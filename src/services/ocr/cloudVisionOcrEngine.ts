import * as FileSystem from 'expo-file-system';
import type { OcrEngine, OcrDocument } from './ocrEngine';

/**
 * Cloud Vision OCR Engine
 * 
 * Uses the backend endpoint to perform Google Cloud Vision OCR.
 * Falls back gracefully if the backend is unavailable or times out.
 */
export class CloudVisionOcrEngine implements OcrEngine {
  private backendUrl: string;

  constructor(backendUrl: string = 'https://xeni.xentroinfotech.com/api/ocr/business-card') {
    this.backendUrl = backendUrl;
  }

  async recognize(imageUri: string): Promise<OcrDocument> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      // Read image and convert to base64
      const base64 = await this.imageToBase64(imageUri);

      // Call backend endpoint with timeout
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OCR backend error: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.document) {
        throw new Error('Invalid response from OCR backend');
      }

      // Convert backend response to OcrDocument
      return {
        width: result.document.width || 1000,
        height: result.document.height || 1000,
        engine: 'google-cloud-vision',
        blocks: result.document.blocks || [],
        lines: result.document.lines || [],
        words: result.document.words || [],
        rawText: result.document.rawText || '',
        overallConfidence: this.calculateOverallConfidence(result.document),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Cloud Vision OCR error (falling back to offline ML Kit):', error);
      throw error;
    }
  }

  getEngineName(): string {
    return 'google-cloud-vision';
  }

  /**
   * Convert image URI to base64
   */
  private async imageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Calculate overall confidence from document
   */
  private calculateOverallConfidence(document: any): number {
    const confidences = [
      ...(document.blocks || []).map((b: any) => b.confidence),
      ...(document.lines || []).map((l: any) => l.confidence),
      ...(document.words || []).map((w: any) => w.confidence),
    ].filter((c: any) => typeof c === 'number');

    if (confidences.length === 0) return 0.85;

    const sum = confidences.reduce((a: number, b: number) => a + b, 0);
    return sum / confidences.length;
  }
}

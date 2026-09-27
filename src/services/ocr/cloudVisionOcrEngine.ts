import * as FileSystem from 'expo-file-system';
import { OcrEngine, OcrDocument } from './ocrEngine';

/**
 * Cloud Vision OCR Engine
 * 
 * Phase 3: Implement CloudVisionOcrEngine
 * 
 * Uses the backend endpoint to perform Google Cloud Vision OCR.
 * Falls back gracefully if the backend is unavailable.
 */
export class CloudVisionOcrEngine implements OcrEngine {
  private backendUrl: string;

  constructor(backendUrl: string = 'https://xeni.xentroinfotech.com/api/ocr/business-card') {
    this.backendUrl = backendUrl;
  }

  async recognize(imageUri: string): Promise<OcrDocument> {
    try {
      // Read image and convert to base64
      const base64 = await this.imageToBase64(imageUri);
      
      // Call backend endpoint
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR backend error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Convert backend response to OcrDocument
      return {
        width: result.document.width,
        height: result.document.height,
        engine: 'google-cloud-vision',
        blocks: result.document.blocks,
        lines: result.document.lines,
        words: result.document.words,
        overallConfidence: this.calculateOverallConfidence(result.document),
      };
    } catch (error) {
      console.error('Cloud Vision OCR error:', error);
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
      ...document.blocks.map((b: any) => b.confidence),
      ...document.lines.map((l: any) => l.confidence),
      ...document.words.map((w: any) => w.confidence),
    ];

    if (confidences.length === 0) return 0;

    const sum = confidences.reduce((a: number, b: number) => a + b, 0);
    return sum / confidences.length;
  }
}

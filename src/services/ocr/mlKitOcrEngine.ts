import { recognizeText } from 'expo-ocr-kit';
import { OcrEngine, OcrDocument, OcrBoundingBox, OcrWord, OcrLine, OcrBlock } from './ocrEngine';

/**
 * ML Kit OCR Engine (Offline Fallback)
 * 
 * Phase 9: Keep ML Kit as offline fallback
 * 
 * Wraps expo-ocr-kit to return OcrDocument format.
 * Used when cloud OCR is unavailable or when offline.
 */
export class MlKitOcrEngine implements OcrEngine {
  async recognize(imageUri: string): Promise<OcrDocument> {
    try {
      const result = await recognizeText(imageUri);
      
      if (!result || !result.blocks) {
        throw new Error('ML Kit returned no results');
      }

      // Convert ML Kit format to OcrDocument format
      return this.convertToOcrDocument(result);
    } catch (error) {
      console.error('ML Kit OCR error:', error);
      throw error;
    }
  }

  getEngineName(): string {
    return 'ml-kit';
  }

  /**
   * Convert expo-ocr-kit result to OcrDocument format
   */
  private convertToOcrDocument(result: any): OcrDocument {
    const blocks: OcrBlock[] = [];
    const lines: OcrLine[] = [];
    const words: OcrWord[] = [];

    let maxWidth = 0;
    let maxHeight = 0;

    // Process blocks
    for (const rawBlock of result.blocks || []) {
      const boundingBox = this.normalizeBoundingBox(rawBlock.boundingBox);
      
      if (boundingBox) {
        maxWidth = Math.max(maxWidth, boundingBox.x + boundingBox.width);
        maxHeight = Math.max(maxHeight, boundingBox.y + boundingBox.height);
      }

      const blockLines: OcrLine[] = [];
      
      // ML Kit may have nested structure, extract lines
      const blockText = rawBlock.text || '';
      const blockConfidence = rawBlock.confidence || 0.5;

      // Create line from block text
      const line: OcrLine = {
        text: blockText,
        words: [
          {
            text: blockText,
            confidence: blockConfidence,
            boundingBox: boundingBox || { x: 0, y: 0, width: 0, height: 0 },
          },
        ],
        confidence: blockConfidence,
        boundingBox: boundingBox || { x: 0, y: 0, width: 0, height: 0 },
      };

      lines.push(line);
      blockLines.push(line);
      words.push(line.words[0]);

      blocks.push({
        text: blockText,
        confidence: blockConfidence,
        boundingBox: boundingBox || { x: 0, y: 0, width: 0, height: 0 },
        lines: blockLines,
      });
    }

    return {
      width: maxWidth || 1000,
      height: maxHeight || 1000,
      engine: 'ml-kit',
      blocks,
      lines,
      words,
      overallConfidence: this.calculateOverallConfidence(blocks),
    };
  }

  /**
   * Normalize bounding box to our format
   */
  private normalizeBoundingBox(boundingBox: any): OcrBoundingBox | null {
    if (!boundingBox) return null;

    return {
      x: boundingBox.x || 0,
      y: boundingBox.y || 0,
      width: boundingBox.width || 0,
      height: boundingBox.height || 0,
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(blocks: OcrBlock[]): number {
    if (blocks.length === 0) return 0;

    const confidences = blocks.map(b => b.confidence);
    const sum = confidences.reduce((a, b) => a + b, 0);
    return sum / confidences.length;
  }
}

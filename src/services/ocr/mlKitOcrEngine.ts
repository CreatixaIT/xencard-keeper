import { recognizeText } from 'expo-ocr-kit';
import type { OcrEngine, OcrDocument, OcrBoundingBox, OcrWord, OcrLine, OcrBlock } from './ocrEngine';

/**
 * ML Kit OCR Engine (On-Device OCR)
 * 
 * Wraps expo-ocr-kit to return standard OcrDocument format.
 * Accurately extracts blocks, lines, and words.
 */
export class MlKitOcrEngine implements OcrEngine {
  async recognize(imageUri: string): Promise<OcrDocument> {
    try {
      const result = await recognizeText(imageUri);

      if (!result || !result.blocks) {
        throw new Error('ML Kit returned no results');
      }

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

    for (const rawBlock of result.blocks || []) {
      const blockBox = this.normalizeBoundingBox(rawBlock.boundingBox) || { x: 0, y: 0, width: 0, height: 0 };
      maxWidth = Math.max(maxWidth, blockBox.x + blockBox.width);
      maxHeight = Math.max(maxHeight, blockBox.y + blockBox.height);

      const blockConfidence = rawBlock.confidence || 0.85;
      const blockLines: OcrLine[] = [];

      // Check if ML Kit provided nested lines
      if (rawBlock.lines && Array.isArray(rawBlock.lines) && rawBlock.lines.length > 0) {
        for (const rawLine of rawBlock.lines) {
          const lineBox = this.normalizeBoundingBox(rawLine.boundingBox) || blockBox;
          const lineConfidence = rawLine.confidence || blockConfidence;
          const lineText = (rawLine.text || '').trim();
          if (!lineText) continue;

          const lineWords: OcrWord[] = [];
          const rawElements = rawLine.elements || rawLine.words;

          if (rawElements && Array.isArray(rawElements) && rawElements.length > 0) {
            for (const elem of rawElements) {
              const elemText = (elem.text || '').trim();
              if (!elemText) continue;
              const elemBox = this.normalizeBoundingBox(elem.boundingBox) || lineBox;
              const wordObj: OcrWord = {
                text: elemText,
                confidence: elem.confidence || lineConfidence,
                boundingBox: elemBox,
              };
              lineWords.push(wordObj);
              words.push(wordObj);
            }
          } else {
            // Generate words from line text
            const splitWords = lineText.split(/\s+/).filter(Boolean);
            const wordWidth = lineBox.width / Math.max(splitWords.length, 1);
            splitWords.forEach((wText: string, wIdx: number) => {
              const wordObj: OcrWord = {
                text: wText,
                confidence: lineConfidence,
                boundingBox: {
                  x: lineBox.x + wIdx * wordWidth,
                  y: lineBox.y,
                  width: wordWidth,
                  height: lineBox.height,
                },
              };
              lineWords.push(wordObj);
              words.push(wordObj);
            });
          }

          const lineObj: OcrLine = {
            text: lineText,
            words: lineWords,
            confidence: lineConfidence,
            boundingBox: lineBox,
          };

          lines.push(lineObj);
          blockLines.push(lineObj);
        }
      } else {
        // Fallback: rawBlock has only text (which might contain newlines)
        const blockText = (rawBlock.text || '').trim();
        const splitLines = blockText.split('\n').map((l: string) => l.trim()).filter(Boolean);
        const lineCount = Math.max(splitLines.length, 1);
        const lineH = blockBox.height / lineCount;

        splitLines.forEach((lText: string, lIdx: number) => {
          const lineBox: OcrBoundingBox = {
            x: blockBox.x,
            y: blockBox.y + lIdx * lineH,
            width: blockBox.width,
            height: lineH,
          };

          const lineWords: OcrWord[] = [];
          const splitWords = lText.split(/\s+/).filter(Boolean);
          const wordW = lineBox.width / Math.max(splitWords.length, 1);

          splitWords.forEach((wText: string, wIdx: number) => {
            const wordObj: OcrWord = {
              text: wText,
              confidence: blockConfidence,
              boundingBox: {
                x: lineBox.x + wIdx * wordW,
                y: lineBox.y,
                width: wordW,
                height: lineH,
              },
            };
            lineWords.push(wordObj);
            words.push(wordObj);
          });

          const lineObj: OcrLine = {
            text: lText,
            words: lineWords,
            confidence: blockConfidence,
            boundingBox: lineBox,
          };

          lines.push(lineObj);
          blockLines.push(lineObj);
        });
      }

      blocks.push({
        text: rawBlock.text || blockLines.map(l => l.text).join('\n'),
        confidence: blockConfidence,
        boundingBox: blockBox,
        lines: blockLines,
      });
    }

    const rawText = result.text || lines.map(l => l.text).join('\n');

    return {
      width: maxWidth || 1000,
      height: maxHeight || 1000,
      engine: 'ml-kit',
      blocks,
      lines,
      words,
      rawText,
      overallConfidence: this.calculateOverallConfidence(blocks),
    };
  }

  private normalizeBoundingBox(boundingBox: any): OcrBoundingBox | null {
    if (!boundingBox) return null;

    return {
      x: boundingBox.x ?? boundingBox.left ?? 0,
      y: boundingBox.y ?? boundingBox.top ?? 0,
      width: boundingBox.width ?? 0,
      height: boundingBox.height ?? 0,
    };
  }

  private calculateOverallConfidence(blocks: OcrBlock[]): number {
    if (blocks.length === 0) return 0;
    const confidences = blocks.map(b => b.confidence);
    const sum = confidences.reduce((a, b) => a + b, 0);
    return sum / confidences.length;
  }
}

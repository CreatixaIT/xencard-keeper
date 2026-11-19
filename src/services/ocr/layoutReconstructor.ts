import type { OcrDocument, OcrLine, OcrBlock, OcrWord, OcrBoundingBox } from './ocrEngine';

/**
 * Layout Reconstructor
 * 
 * Reconstructs lines from OCR words using geometric analysis.
 * Uses normalized coordinates and adaptive tolerances based on word height.
 */
export class LayoutReconstructor {
  /**
   * Reconstruct lines from words using geometric analysis
   */
  static reconstructLines(document: OcrDocument): OcrLine[] {
    // If no words are provided, fallback to existing document lines
    if (!document.words || document.words.length === 0) {
      if (document.lines && document.lines.length > 0) {
        return this.splitMultilineEntries(document.lines);
      }
      return [];
    }

    // Filter valid words
    const validWords = document.words.filter(w => w.text && w.text.trim().length > 0);
    if (validWords.length === 0) {
      if (document.lines && document.lines.length > 0) {
        return this.splitMultilineEntries(document.lines);
      }
      return [];
    }

    // Calculate median word height for adaptive vertical line tolerance
    const wordHeights = validWords
      .map(w => w.boundingBox?.height || 0)
      .filter(h => h > 0);

    const medianWordHeight = this.calculateMedian(wordHeights) || 20;
    const lineTolerance = Math.max(medianWordHeight * 0.5, 5);

    // Sort words primarily by vertical position (Y)
    const sortedWords = [...validWords].sort((a, b) => {
      const aY = a.boundingBox.y + a.boundingBox.height / 2;
      const bY = b.boundingBox.y + b.boundingBox.height / 2;
      return aY - bY;
    });

    // Group words into line clusters using vertical proximity and overlap
    const clusters: OcrWord[][] = [];

    for (const word of sortedWords) {
      const wordCenterY = word.boundingBox.y + word.boundingBox.height / 2;
      const wordTop = word.boundingBox.y;
      const wordBottom = word.boundingBox.y + word.boundingBox.height;

      let bestCluster: OcrWord[] | null = null;
      let minDiff = Infinity;

      for (const cluster of clusters) {
        const clusterTop = Math.min(...cluster.map(w => w.boundingBox.y));
        const clusterBottom = Math.max(...cluster.map(w => w.boundingBox.y + w.boundingBox.height));
        const clusterCenterY = clusterTop + (clusterBottom - clusterTop) / 2;

        const diff = Math.abs(wordCenterY - clusterCenterY);
        const overlap = Math.min(clusterBottom, wordBottom) - Math.max(clusterTop, wordTop);
        const minHeight = Math.min(clusterBottom - clusterTop, word.boundingBox.height);

        if (diff < lineTolerance || (minHeight > 0 && overlap / minHeight > 0.4)) {
          if (diff < minDiff) {
            minDiff = diff;
            bestCluster = cluster;
          }
        }
      }

      if (bestCluster) {
        bestCluster.push(word);
      } else {
        clusters.push([word]);
      }
    }

    // Convert each cluster to an OcrLine, sorting words horizontally (X)
    const lines: OcrLine[] = clusters.map(cluster => this.createLineFromWords(cluster));

    // Sort lines vertically from top to bottom
    lines.sort((a, b) => a.boundingBox.y - b.boundingBox.y);

    return lines;
  }

  /**
   * Helper to ensure lines containing \n are broken into separate lines
   */
  private static splitMultilineEntries(lines: OcrLine[]): OcrLine[] {
    const result: OcrLine[] = [];
    for (const line of lines) {
      const text = line.text || '';
      if (text.includes('\n')) {
        const parts = text.split('\n').map(p => p.trim()).filter(Boolean);
        const count = Math.max(parts.length, 1);
        const subHeight = line.boundingBox.height / count;
        parts.forEach((p, idx) => {
          result.push({
            text: p,
            confidence: line.confidence,
            boundingBox: {
              x: line.boundingBox.x,
              y: line.boundingBox.y + idx * subHeight,
              width: line.boundingBox.width,
              height: subHeight,
            },
            words: line.words || [],
          });
        });
      } else {
        result.push(line);
      }
    }
    return result;
  }

  /**
   * Create a line from a group of words
   */
  private static createLineFromWords(words: OcrWord[]): OcrLine {
    // Sort words left-to-right
    const sortedWords = [...words].sort((a, b) => a.boundingBox.x - b.boundingBox.x);

    const text = sortedWords.map(w => w.text).join(' ');
    const confidence = sortedWords.reduce((sum, w) => sum + (w.confidence || 0.8), 0) / sortedWords.length;

    // Calculate combined bounding box
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const word of sortedWords) {
      minX = Math.min(minX, word.boundingBox.x);
      minY = Math.min(minY, word.boundingBox.y);
      maxX = Math.max(maxX, word.boundingBox.x + word.boundingBox.width);
      maxY = Math.max(maxY, word.boundingBox.y + word.boundingBox.height);
    }

    const boundingBox: OcrBoundingBox = {
      x: isFinite(minX) ? minX : 0,
      y: isFinite(minY) ? minY : 0,
      width: isFinite(maxX) && isFinite(minX) ? Math.max(maxX - minX, 0) : 0,
      height: isFinite(maxY) && isFinite(minY) ? Math.max(maxY - minY, 0) : 0,
    };

    return {
      text,
      words: sortedWords,
      confidence,
      boundingBox,
    };
  }

  /**
   * Calculate median of an array of numbers
   */
  private static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Reconstruct blocks from lines
   */
  static reconstructBlocks(lines: OcrLine[]): OcrBlock[] {
    if (lines.length === 0) {
      return [];
    }

    const blocks: OcrBlock[] = [];
    const lineSpacingTolerance = this.calculateMedianLineSpacing(lines);

    let currentBlockLines: OcrLine[] = [lines[0]];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const lastLine = currentBlockLines[currentBlockLines.length - 1];

      const verticalSpacing = currentLine.boundingBox.y - (lastLine.boundingBox.y + lastLine.boundingBox.height);

      if (verticalSpacing < lineSpacingTolerance * 2.5) {
        currentBlockLines.push(currentLine);
      } else {
        blocks.push(this.createBlockFromLines(currentBlockLines));
        currentBlockLines = [currentLine];
      }
    }

    if (currentBlockLines.length > 0) {
      blocks.push(this.createBlockFromLines(currentBlockLines));
    }

    return blocks;
  }

  private static createBlockFromLines(lines: OcrLine[]): OcrBlock {
    const text = lines.map(l => l.text).join('\n');
    const confidence = lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length;

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const line of lines) {
      minX = Math.min(minX, line.boundingBox.x);
      minY = Math.min(minY, line.boundingBox.y);
      maxX = Math.max(maxX, line.boundingBox.x + line.boundingBox.width);
      maxY = Math.max(maxY, line.boundingBox.y + line.boundingBox.height);
    }

    const boundingBox: OcrBoundingBox = {
      x: isFinite(minX) ? minX : 0,
      y: isFinite(minY) ? minY : 0,
      width: isFinite(maxX) && isFinite(minX) ? Math.max(maxX - minX, 0) : 0,
      height: isFinite(maxY) && isFinite(minY) ? Math.max(maxY - minY, 0) : 0,
    };

    return {
      text,
      confidence,
      boundingBox,
      lines,
    };
  }

  private static calculateMedianLineSpacing(lines: OcrLine[]): number {
    if (lines.length < 2) return 20;

    const spacings: number[] = [];
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const lastLine = lines[i - 1];
      const spacing = currentLine.boundingBox.y - (lastLine.boundingBox.y + lastLine.boundingBox.height);
      if (spacing > 0) {
        spacings.push(spacing);
      }
    }

    if (spacings.length === 0) return 20;
    return this.calculateMedian(spacings);
  }
}

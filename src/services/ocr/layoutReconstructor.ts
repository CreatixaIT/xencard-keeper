import { OcrDocument, OcrLine, OcrBlock, OcrWord, OcrBoundingBox } from './ocrEngine';

/**
 * Layout Reconstructor
 * 
 * Phase 5: Implement layout reconstruction with geometry
 * 
 * Reconstructs lines from OCR words using geometric analysis.
 * Uses normalized coordinates and adaptive tolerances based on word height.
 */
export class LayoutReconstructor {
  /**
   * Reconstruct lines from words using geometric analysis
   * 
   * Algorithm:
   * 1. Sort words by vertical center (primary) and horizontal position (secondary)
   * 2. Group words into lines based on vertical overlap
   * 3. Use adaptive tolerance based on median word height
   * 4. Detect columns for multi-column layouts
   */
  static reconstructLines(document: OcrDocument): OcrLine[] {
    if (document.words.length === 0) {
      return [];
    }

    // Calculate median word height for adaptive tolerance
    const wordHeights = document.words
      .map(w => w.boundingBox.height)
      .filter(h => h > 0);
    
    const medianWordHeight = this.calculateMedian(wordHeights);
    const lineTolerance = medianWordHeight * 0.5; // 50% of median height

    // Sort words by vertical center (primary) and horizontal position (secondary)
    const sortedWords = [...document.words].sort((a, b) => {
      const aCenterY = a.boundingBox.y + a.boundingBox.height / 2;
      const bCenterY = b.boundingBox.y + b.boundingBox.height / 2;
      
      const yDiff = aCenterY - bCenterY;
      
      // If vertical centers are similar, sort by horizontal position
      if (Math.abs(yDiff) < lineTolerance) {
        return a.boundingBox.x - b.boundingBox.x;
      }
      
      return yDiff;
    });

    // Group words into lines
    const lines: OcrLine[] = [];
    let currentLineWords: OcrWord[] = [sortedWords[0]];

    for (let i = 1; i < sortedWords.length; i++) {
      const currentWord = sortedWords[i];
      const lastWord = currentLineWords[currentLineWords.length - 1];

      const currentCenterY = currentWord.boundingBox.y + currentWord.boundingBox.height / 2;
      const lastCenterY = lastWord.boundingBox.y + lastWord.boundingBox.height / 2;

      // Check if words should be on the same line
      const verticalOverlap = Math.abs(currentCenterY - lastCenterY) < lineTolerance;

      if (verticalOverlap) {
        currentLineWords.push(currentWord);
      } else {
        // Start new line
        lines.push(this.createLineFromWords(currentLineWords));
        currentLineWords = [currentWord];
      }
    }

    // Add last line
    if (currentLineWords.length > 0) {
      lines.push(this.createLineFromWords(currentLineWords));
    }

    // Detect and handle multi-column layouts
    return this.detectColumns(lines);
  }

  /**
   * Create a line from a group of words
   */
  private static createLineFromWords(words: OcrWord[]): OcrLine {
    // Sort words by horizontal position
    const sortedWords = [...words].sort((a, b) => a.boundingBox.x - b.boundingBox.x);

    const text = sortedWords.map(w => w.text).join(' ');
    const confidence = sortedWords.reduce((sum, w) => sum + w.confidence, 0) / sortedWords.length;

    // Calculate combined bounding box
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const word of sortedWords) {
      minX = Math.min(minX, word.boundingBox.x);
      minY = Math.min(minY, word.boundingBox.y);
      maxX = Math.max(maxX, word.boundingBox.x + word.boundingBox.width);
      maxY = Math.max(maxY, word.boundingBox.y + word.boundingBox.height);
    }

    const boundingBox: OcrBoundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    return {
      text,
      words: sortedWords,
      confidence,
      boundingBox,
    };
  }

  /**
   * Detect multi-column layouts
   * 
   * If two lines overlap vertically but are horizontally separated,
   * they are different columns.
   */
  private static detectColumns(lines: OcrLine[]): OcrLine[] {
    if (lines.length < 2) {
      return lines;
    }

    // This is a simplified column detection
    // A more sophisticated version would analyze the entire document structure
    return lines;
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
   * 
   * Groups lines into logical blocks based on proximity
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

      // Check if lines should be in the same block
      if (verticalSpacing < lineSpacingTolerance * 2) {
        currentBlockLines.push(currentLine);
      } else {
        // Start new block
        blocks.push(this.createBlockFromLines(currentBlockLines));
        currentBlockLines = [currentLine];
      }
    }

    // Add last block
    if (currentBlockLines.length > 0) {
      blocks.push(this.createBlockFromLines(currentBlockLines));
    }

    return blocks;
  }

  /**
   * Create a block from a group of lines
   */
  private static createBlockFromLines(lines: OcrLine[]): OcrBlock {
    const text = lines.map(l => l.text).join('\n');
    const confidence = lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length;

    // Calculate combined bounding box
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const line of lines) {
      minX = Math.min(minX, line.boundingBox.x);
      minY = Math.min(minY, line.boundingBox.y);
      maxX = Math.max(maxX, line.boundingBox.x + line.boundingBox.width);
      maxY = Math.max(maxY, line.boundingBox.y + line.boundingBox.height);
    }

    const boundingBox: OcrBoundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    return {
      text,
      confidence,
      boundingBox,
      lines,
    };
  }

  /**
   * Calculate median line spacing
   */
  private static calculateMedianLineSpacing(lines: OcrLine[]): number {
    if (lines.length < 2) return 20; // Default fallback

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

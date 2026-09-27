/**
 * OCR Engine Interface and Types
 * 
 * Phase 4: Create engine-independent OcrDocument interface
 * 
 * This defines the interface that both Cloud Vision and ML Kit must implement,
 * ensuring the field extraction code is engine-independent.
 */

export interface OcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrPolygon {
  x: number;
  y: number;
}[];

export interface OcrWord {
  text: string;
  confidence: number;
  boundingBox: OcrBoundingBox;
  polygon?: OcrPolygon;
}

export interface OcrLine {
  text: string;
  words: OcrWord[];
  confidence: number;
  boundingBox: OcrBoundingBox;
}

export interface OcrBlock {
  text: string;
  confidence: number;
  boundingBox: OcrBoundingBox;
  lines: OcrLine[];
  type?: 'text' | 'title' | 'list_item' | 'other';
}

export interface OcrDocument {
  width: number;
  height: number;
  engine: 'google-cloud-vision' | 'ml-kit' | 'fallback';
  blocks: OcrBlock[];
  lines: OcrLine[];
  words: OcrWord[];
  rawText?: string;
  overallConfidence: number;
}

export interface OcrEngine {
  /**
   * Perform OCR on an image
   * @param imageUri - URI of the image to process
   * @returns Promise with OcrDocument
   */
  recognize(imageUri: string): Promise<OcrDocument>;

  /**
   * Get engine name for debugging
   */
  getEngineName(): string;
}

/**
 * Field extraction result with confidence
 */
export interface FieldExtraction {
  value: string;
  confidence: number;
  source: string; // 'cloud-vision' | 'ml-kit' | 'merged'
  evidence?: string[]; // word IDs or line indices
}

/**
 * Business card data with confidence scoring
 */
export interface BusinessCardData {
  fullName?: FieldExtraction;
  designation?: FieldExtraction;
  company?: FieldExtraction;
  industry?: FieldExtraction;
  phone?: FieldExtraction;
  alternatePhone?: FieldExtraction;
  whatsappNumber?: FieldExtraction;
  email?: FieldExtraction;
  website?: FieldExtraction;
  address?: FieldExtraction;
  city?: FieldExtraction;
  country?: FieldExtraction;
  additionalAddresses?: Array<{ label: string; address: string; confidence: number }>;
  notes?: string;
  rawText?: string;
  ocrDocument?: OcrDocument;
}

/**
 * OCR result with debug data
 */
export interface OCRResult {
  success: boolean;
  data: BusinessCardData;
  overallConfidence: number;
  rawText?: string;
  ocrBlocks?: OcrBlock[];
  error?: string;
  debugData?: {
    rawText?: string;
    ocrBlocks?: Array<{
      text: string;
      confidence: number;
      boundingBox?: OcrBoundingBox;
    }>;
    lines?: Array<{
      text: string;
      confidence: number;
      boundingBox?: OcrBoundingBox;
    }>;
    extractedData?: BusinessCardData;
    overallConfidence?: number;
    engine?: string;
    imageSize?: { width: number; height: number };
  };
}

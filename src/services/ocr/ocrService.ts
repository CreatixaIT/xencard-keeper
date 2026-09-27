import { OcrDocument, OCRResult, BusinessCardData } from './ocrEngine';
import { CloudVisionOcrEngine } from './cloudVisionOcrEngine';
import { MlKitOcrEngine } from './mlKitOcrEngine';
import { LayoutReconstructor } from './layoutReconstructor';
import { businessCardExtractor } from './businessCardExtractor';
import { fieldValidator } from './fieldValidator';
import { businessCardMerger } from './businessCardMerger';
import { imageCaptureService } from '../image/imageCaptureService';

/**
 * OCR Service - Main Orchestrator
 * 
 * Phase 9: Update main OCR service with new architecture
 * 
 * Pipeline:
 * Camera → Image Capture/Normalization → Choose OCR Engine → OcrDocument
 * → Layout Reconstruction → Business Card Extractor → Validation/Confidence
 * → Front/Back Merge → Review Card
 * 
 * Online: Cloud Vision (primary)
 * Offline: ML Kit (fallback)
 */
class OCRService {
  private cloudVisionEngine: CloudVisionOcrEngine;
  private mlKitEngine: MlKitOcrEngine;

  constructor() {
    this.cloudVisionEngine = new CloudVisionOcrEngine();
    this.mlKitEngine = new MlKitOcrEngine();
  }

  /**
   * Recognize business card from image
   */
  async recognizeBusinessCard(imageUri: string): Promise<OCRResult> {
    try {
      console.warn('=== OCR START ===');
      console.warn('Image:', imageUri);

      // Step 1: Image capture and normalization
      const captureResult = await imageCaptureService.captureForOCR(imageUri);
      console.warn('Image dimensions:', captureResult.width, 'x', captureResult.height);
      console.warn('OCR derivative size will be optimized for recognition');

      // Step 2: Try Cloud Vision first, fall back to ML Kit if it fails
      let document: OcrDocument;
      let engineName: string;

      try {
        // Try Cloud Vision
        const cloudVisionEngine = this.cloudVisionEngine;
        engineName = 'google-cloud-vision (attempting online)';
        console.warn('Attempting Cloud Vision OCR...');
        
        document = await cloudVisionEngine.recognize(captureResult.ocrUri);
        
        // If successful, use Cloud Vision
        if (document.overallConfidence > 0.3) {
          engineName = 'google-cloud-vision (online)';
          console.warn('Using Cloud Vision OCR (online)');
        } else {
          throw new Error('Cloud Vision returned low confidence');
        }
      } catch (error) {
        console.warn('Cloud Vision unavailable or failed, falling back to ML Kit:', error);
        document = await this.mlKitEngine.recognize(captureResult.ocrUri);
        engineName = 'ml-kit (offline fallback)';
        console.warn('Using ML Kit OCR (offline)');
      }

      // Step 3: Layout reconstruction
      const reconstructedLines = LayoutReconstructor.reconstructLines(document);
      const reconstructedBlocks = LayoutReconstructor.reconstructBlocks(reconstructedLines);
      console.warn('Reconstructed lines:', reconstructedLines.length);
      console.warn('Reconstructed blocks:', reconstructedBlocks.length);

      // Update document with reconstructed data
      document.lines = reconstructedLines;
      document.blocks = reconstructedBlocks;

      // Step 4: Business card extraction
      const extractedData = businessCardExtractor.extract(document);
      console.warn('Extracted name:', extractedData.fullName?.value);
      console.warn('Extracted designation:', extractedData.designation?.value);
      console.warn('Extracted company:', extractedData.company?.value);
      console.warn('Extracted phone:', extractedData.phone?.value);
      console.warn('Extracted mobile:', extractedData.alternatePhone?.value);
      console.warn('Extracted email:', extractedData.email?.value);
      console.warn('Extracted website:', extractedData.website?.value);
      console.warn('Extracted address:', extractedData.address?.value);

      // Step 6: Validation and confidence scoring
      const validatedData = fieldValidator.validate(extractedData);
      console.warn('Validated data confidence:', {
        name: validatedData.fullName?.confidence,
        designation: validatedData.designation?.confidence,
        company: validatedData.company?.confidence,
        phone: validatedData.phone?.confidence,
        email: validatedData.email?.confidence,
      });

      // Step 7: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(validatedData);

      const rawText = document.rawText || reconstructedLines.map(l => l.text).join('\n');
      console.warn('Raw OCR text:', rawText);
      console.warn('=== OCR END ===');

      return {
        success: true,
        data: validatedData,
        overallConfidence,
        rawText,
        ocrBlocks: document.blocks,
        debugData: {
          rawText,
          ocrBlocks: document.blocks.map(b => ({
            text: b.text,
            confidence: b.confidence,
            boundingBox: b.boundingBox,
          })),
          lines: reconstructedLines.map(l => ({
            text: l.text,
            confidence: l.confidence,
            boundingBox: l.boundingBox,
          })),
          extractedData: validatedData,
          overallConfidence,
          engine: engineName,
          imageSize: { width: captureResult.width, height: captureResult.height },
        },
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return {
        success: false,
        data: {},
        overallConfidence: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  /**
   * Recognize both front and back cards and merge
   */
  async recognizeBusinessCardWithBack(frontUri: string, backUri: string): Promise<OCRResult> {
    try {
      // OCR front
      const frontResult = await this.recognizeBusinessCard(frontUri);
      
      if (!frontResult.success) {
        return frontResult;
      }

      // OCR back
      const backResult = await this.recognizeBusinessCard(backUri);
      
      if (!backResult.success) {
        // Return front result if back fails
        return frontResult;
      }

      // Merge results
      const mergedData = businessCardMerger.merge(frontResult.data, backResult.data);
      
      const overallConfidence = this.calculateOverallConfidence(mergedData);

      return {
        success: true,
        data: mergedData,
        overallConfidence,
        rawText: [frontResult.rawText, backResult.rawText].filter(Boolean).join('\n\n--- BACK ---\n\n'),
        ocrBlocks: frontResult.ocrBlocks,
        debugData: {
          ...frontResult.debugData,
          extractedData: mergedData,
          overallConfidence,
        },
      };
    } catch (error) {
      console.error('OCR Error (front/back):', error);
      return {
        success: false,
        data: {},
        overallConfidence: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  /**
   * Calculate overall confidence from all fields
   */
  private calculateOverallConfidence(data: BusinessCardData): number {
    const fields = [
      data.fullName,
      data.designation,
      data.company,
      data.industry,
      data.phone,
      data.alternatePhone,
      data.whatsappNumber,
      data.email,
      data.website,
      data.address,
      data.city,
      data.country,
    ];

    const confidences = fields
      .filter(f => f !== undefined)
      .map(f => f?.confidence || 0);

    if (confidences.length === 0) return 0;

    const sum = confidences.reduce((a, b) => a + b, 0);
    return sum / confidences.length;
  }
}

export const ocrService = new OCRService();

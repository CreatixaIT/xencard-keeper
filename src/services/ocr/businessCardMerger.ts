import { BusinessCardData, FieldExtraction } from './ocrEngine';

/**
 * Business Card Merger
 * 
 * Phase 8: Front/back merge with confidence-aware logic
 * 
 * Merges front and back OCR results, preserving stronger candidates
 * and combining complementary information.
 */
export class BusinessCardMerger {
  /**
   * Merge front and back business card data
   */
  merge(front: BusinessCardData, back: BusinessCardData): BusinessCardData {
    const merged: BusinessCardData = {};

    // Merge each field with confidence-aware logic
    merged.fullName = this.mergeField(front.fullName, back.fullName);
    merged.designation = this.mergeField(front.designation, back.designation);
    merged.company = this.mergeField(front.company, back.company);
    merged.industry = this.mergeField(front.industry, back.industry);
    merged.phone = this.mergeField(front.phone, back.phone);
    merged.alternatePhone = this.mergeAlternatePhone(front.alternatePhone, back.alternatePhone);
    merged.whatsappNumber = this.mergeField(front.whatsappNumber, back.whatsappNumber);
    merged.email = this.mergeField(front.email, back.email);
    merged.website = this.mergeField(front.website, back.website);
    merged.address = this.mergeField(front.address, back.address);
    merged.city = this.mergeField(front.city, back.city);
    merged.country = this.mergeField(front.country, back.country);

    // Preserve raw text from both sides
    merged.rawText = [front.rawText, back.rawText].filter(Boolean).join('\n\n--- BACK ---\n\n');

    return merged;
  }

  /**
   * Merge a single field with confidence comparison
   */
  private mergeField(frontField: FieldExtraction | undefined, backField: FieldExtraction | undefined): FieldExtraction | undefined {
    if (!frontField && !backField) {
      return undefined;
    }

    if (!frontField) {
      return backField;
    }

    if (!backField) {
      return frontField;
    }

    // Both exist - choose based on confidence
    if (frontField.confidence >= backField.confidence) {
      return frontField;
    }

    return backField;
  }

  /**
   * Merge alternate phone fields, avoiding duplicates
   */
  private mergeAlternatePhone(
    frontAlt: FieldExtraction | undefined,
    backAlt: FieldExtraction | undefined
  ): FieldExtraction | undefined {
    const candidates: FieldExtraction[] = [];

    if (frontAlt) candidates.push(frontAlt);
    if (backAlt) candidates.push(backAlt);

    // Remove duplicates
    const uniqueCandidates = this.removeDuplicates(candidates);

    if (uniqueCandidates.length === 0) {
      return undefined;
    }

    if (uniqueCandidates.length === 1) {
      return uniqueCandidates[0];
    }

    // Return the highest confidence candidate
    return uniqueCandidates.sort((a, b) => b.confidence - a.confidence)[0];
  }

  /**
   * Remove duplicate field values
   */
  private removeDuplicates(fields: FieldExtraction[]): FieldExtraction[] {
    const seen = new Set<string>();
    const unique: FieldExtraction[] = [];

    for (const field of fields) {
      const normalized = field.value.replace(/[\s-()]/g, '');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(field);
      }
    }

    return unique;
  }
}

export const businessCardMerger = new BusinessCardMerger();

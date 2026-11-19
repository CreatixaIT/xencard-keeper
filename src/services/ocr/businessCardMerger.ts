import type { BusinessCardData, FieldExtraction } from './ocrEngine';

/**
 * Business Card Merger
 * 
 * Merges front and back OCR results, preserving stronger candidates
 * and combining complementary information (such as secondary phones and addresses).
 */
export class BusinessCardMerger {
  /**
   * Merge front and back business card data
   */
  merge(front: BusinessCardData, back: BusinessCardData): BusinessCardData {
    const merged: BusinessCardData = {};

    merged.fullName = this.mergeField(front.fullName, back.fullName);
    merged.designation = this.mergeField(front.designation, back.designation);
    merged.company = this.mergeField(front.company, back.company);
    merged.industry = this.mergeField(front.industry, back.industry);

    // Smart phone merging
    const phoneCandidates: FieldExtraction[] = [];
    if (front.phone) phoneCandidates.push(front.phone);
    if (front.alternatePhone) phoneCandidates.push(front.alternatePhone);
    if (back.phone) phoneCandidates.push(back.phone);
    if (back.alternatePhone) phoneCandidates.push(back.alternatePhone);

    const uniquePhones = this.removeDuplicatePhones(phoneCandidates);
    if (uniquePhones.length > 0) {
      merged.phone = uniquePhones[0];
    }
    if (uniquePhones.length > 1) {
      merged.alternatePhone = uniquePhones[1];
    }

    merged.whatsappNumber = this.mergeField(front.whatsappNumber, back.whatsappNumber);
    merged.email = this.mergeField(front.email, back.email);
    merged.website = this.mergeField(front.website, back.website);

    // Address merging
    merged.address = this.mergeField(front.address, back.address);
    if (front.address && back.address && this.normalizeAddress(front.address.value) !== this.normalizeAddress(back.address.value)) {
      merged.additionalAddresses = [
        {
          label: 'Back Address',
          address: back.address.value,
          confidence: back.address.confidence,
        },
      ];
    }

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
    return (frontField.confidence >= backField.confidence) ? frontField : backField;
  }

  /**
   * Remove duplicate phone numbers
   */
  private removeDuplicatePhones(fields: FieldExtraction[]): FieldExtraction[] {
    const seen = new Set<string>();
    const unique: FieldExtraction[] = [];

    for (const field of fields) {
      const normalized = field.value.replace(/\D/g, '');
      // Match on last 8 digits to catch local vs international representations
      const key = normalized.length >= 8 ? normalized.slice(-8) : normalized;
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(field);
      }
    }

    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  private normalizeAddress(addr: string): string {
    return addr.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}

export const businessCardMerger = new BusinessCardMerger();

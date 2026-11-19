import type { BusinessCardData, FieldExtraction } from './ocrEngine';

/**
 * Field Validator and Confidence Scorer
 * 
 * Validates extracted fields and assigns confidence scores based on multiple factors.
 */
export class FieldValidator {
  /**
   * Validate and score all fields
   */
  validate(data: BusinessCardData): BusinessCardData {
    const validated: BusinessCardData = {};

    if (data.fullName) {
      validated.fullName = this.validateName(data.fullName);
    }
    if (data.designation) {
      validated.designation = this.validateDesignation(data.designation);
    }
    if (data.company) {
      validated.company = this.validateCompany(data.company);
    }
    if (data.industry) {
      validated.industry = this.validateIndustry(data.industry);
    }
    if (data.phone) {
      validated.phone = this.validatePhone(data.phone);
    }
    if (data.alternatePhone) {
      validated.alternatePhone = this.validatePhone(data.alternatePhone);
    }
    if (data.whatsappNumber) {
      validated.whatsappNumber = this.validatePhone(data.whatsappNumber);
    }
    if (data.email) {
      validated.email = this.validateEmail(data.email);
    }
    if (data.website) {
      validated.website = this.validateWebsite(data.website);
    }
    if (data.address) {
      validated.address = this.validateAddress(data.address);
    }
    if (data.city) {
      validated.city = this.validateCity(data.city);
    }
    if (data.country) {
      validated.country = this.validateCountry(data.country);
    }

    // Preserve raw text and document
    validated.rawText = data.rawText;
    validated.ocrDocument = data.ocrDocument;

    return validated;
  }

  /**
   * Validate name field
   */
  private validateName(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Penalty for numbers
    if (/\d/.test(value)) {
      confidence *= 0.3;
    }

    // Penalty for email/phone patterns
    if (/@/.test(value) || /(\+\d{1,3}[-.\s]?\(?\d{2,4}\)?)/.test(value)) {
      confidence *= 0.2;
    }

    // Penalty for organization terms (with word boundaries)
    const orgTerms = [/\bLtd\b/i, /\bInc\b/i, /\bCorp\b/i, /\bCompany\b/i, /\bGroup\b/i, /\bLLC\b/i, /\bBank\b/i, /\bInstitute\b/i];
    if (orgTerms.some(term => term.test(value))) {
      confidence *= 0.3;
    }

    // Penalty for address terms
    const addressTerms = [/\bRoad\b/i, /\bStreet\b/i, /\bBuilding\b/i, /\bFloor\b/i, /\bTower\b/i];
    if (addressTerms.some(term => term.test(value))) {
      confidence *= 0.3;
    }

    // Boost for reasonable word count (2 to 5 words)
    const wordCount = value.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 5) {
      confidence *= 1.05;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate designation field
   */
  private validateDesignation(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Penalty if contains phone/email/website
    if (/@/.test(value) || /www\./i.test(value) || /(\+\d{1,3})/.test(value)) {
      confidence *= 0.2;
    }

    // Penalty if looks like address
    const addressTerms = [/\bRoad\b/i, /\bStreet\b/i, /\bFloor\b/i, /\bBuilding\b/i];
    if (addressTerms.some(term => term.test(value))) {
      confidence *= 0.3;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate company field
   */
  private validateCompany(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Penalty if contains phone/email
    if (/@/.test(value) || /(\+\d{1,3})/.test(value)) {
      confidence *= 0.2;
    }

    // Penalty if looks like address
    const addressTerms = [/\bRoad\b/i, /\bStreet\b/i, /\bFloor\b/i];
    if (addressTerms.some(term => term.test(value))) {
      confidence *= 0.4;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate industry field
   */
  private validateIndustry(field: FieldExtraction): FieldExtraction {
    return {
      value: field.value,
      confidence: Math.min(field.confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate phone field
   */
  private validatePhone(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Check actual digits count
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      confidence *= 1.05;
    } else {
      confidence *= 0.4;
    }

    // Penalty if looks like postal code alone
    if (/^\d{4}$/.test(value.trim()) || /^\d{3,4}-\d{3,4}$/.test(value.trim())) {
      confidence *= 0.3;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate email field
   */
  private validateEmail(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Boost for valid email pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailPattern.test(value)) {
      confidence *= 1.05;
    } else {
      confidence *= 0.3;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate website field
   */
  private validateWebsite(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Boost for valid URL pattern
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i;
    if (urlPattern.test(value)) {
      confidence *= 1.05;
    } else {
      confidence *= 0.8;
    }

    // Penalty if looks like email
    if (/@/.test(value)) {
      confidence *= 0.1;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate address field
   */
  private validateAddress(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Boost for address indicators
    const addressIndicators = [/\bRoad\b/i, /\bStreet\b/i, /\bBuilding\b/i, /\bFloor\b/i, /\bTower\b/i, /\bBlock\b/i, /\bHouse\b/i];
    if (addressIndicators.some(ind => ind.test(value))) {
      confidence *= 1.05;
    }

    // Penalty if contains email/phone
    if (/@/.test(value) || /(\+\d{1,3})/.test(value)) {
      confidence *= 0.2;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate city field
   */
  private validateCity(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    if (/\d/.test(value)) {
      confidence *= 0.5;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }

  /**
   * Validate country field
   */
  private validateCountry(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }
}

export const fieldValidator = new FieldValidator();

import { BusinessCardData, FieldExtraction } from './ocrEngine';

/**
 * Field Validator and Confidence Scorer
 * 
 * Phase 7: Validation and confidence scoring
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

    // Penalty for organization terms
    const orgTerms = ['Ltd', 'Inc', 'Corp', 'Company', 'Group', 'LLC', 'Bank', 'Institute'];
    if (orgTerms.some(term => value.includes(term))) {
      confidence *= 0.3;
    }

    // Penalty for address terms
    const addressTerms = ['Road', 'Street', 'Building', 'Floor', 'Tower'];
    if (addressTerms.some(term => value.includes(term))) {
      confidence *= 0.3;
    }

    // Boost for reasonable word count
    const wordCount = value.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 4) {
      confidence *= 1.1;
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
    const addressTerms = ['Road', 'Street', 'Building', 'Floor', 'Tower'];
    if (addressTerms.some(term => value.includes(term))) {
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
    const addressTerms = ['Road', 'Street', 'Building', 'Floor'];
    if (addressTerms.some(term => value.includes(term))) {
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
   * Validate phone field
   */
  private validatePhone(field: FieldExtraction): FieldExtraction {
    const value = field.value;
    let confidence = field.confidence;

    // Boost for valid phone pattern
    const phonePattern = /\+?\d{10,}/;
    if (phonePattern.test(value)) {
      confidence *= 1.1;
    } else {
      confidence *= 0.5;
    }

    // Penalty if looks like postal code
    if (/^\d{4}$/.test(value) || /^\d{3,4}-\d{3,4}$/.test(value)) {
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
      confidence *= 1.1;
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
    const urlPattern = /^https?:\/\/.+\..+/;
    if (urlPattern.test(value)) {
      confidence *= 1.1;
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
    const addressIndicators = ['Road', 'Street', 'Building', 'Floor', 'Tower', 'Block', 'House'];
    if (addressIndicators.some(ind => value.includes(ind))) {
      confidence *= 1.1;
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

    // Penalty if contains numbers
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

    // Boost for known country names
    const countries = ['Bangladesh', 'India', 'USA', 'United States', 'UK', 'United Kingdom'];
    if (countries.some(c => value.toLowerCase().includes(c.toLowerCase()))) {
      confidence *= 1.1;
    }

    return {
      value,
      confidence: Math.min(confidence, 1.0),
      source: field.source,
      evidence: field.evidence,
    };
  }
}

export const fieldValidator = new FieldValidator();

import { OcrDocument, OcrLine, BusinessCardData } from './ocrEngine';

/**
 * Business Card Extractor
 * 
 * Phase 6: Deterministic business-card extraction
 * 
 * Engine-independent parser that extracts business card fields from OcrDocument.
 * Uses geometry, semantics, patterns, and confidence scoring.
 */
export class BusinessCardExtractor {
  private jobTitleDictionary: Set<string>;
  private organizationTerms: Set<string>;
  private organizationSuffixes: Set<string>;
  private countryNames: Set<string>;
  private cityNames: Set<string>;

  constructor() {
    this.jobTitleDictionary = new Set([
      'Director', 'Managing Director', 'Executive Director', 'Additional Director',
      'Founder', 'Co-Founder', 'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CIO',
      'Chairman', 'Chairperson', 'President', 'Vice President', 'VP',
      'Managing Partner', 'Partner', 'Proprietor',
      'Manager', 'General Manager', 'Deputy General Manager', 'Assistant Manager',
      'Head', 'Officer', 'Senior Officer', 'Executive',
      'Engineer', 'Senior Engineer', 'Software Engineer', 'Consultant',
      'Architect', 'Lawyer', 'Advocate', 'Doctor', 'Professor',
      'Coordinator', 'Administrator', 'Supervisor',
    ]);

    this.organizationTerms = new Set([
      'Unit', 'Department', 'Division', 'Authority', 'Agency', 'Institute',
      'Bureau', 'Office', 'Center', 'Centre', 'Association', 'Foundation',
      'Corporation', 'Company', 'Organization', 'Federation', 'Union',
      'Council', 'Board', 'Commission', 'Ministry', 'Bank', 'Financial',
      'Intelligence', 'Investigation', 'Research', 'Development', 'Services',
      'Solutions', 'Systems', 'Technologies', 'Technology', 'Industries',
      'International', 'National', 'Regional', 'Government', 'Public', 'Private',
    ]);

    this.organizationSuffixes = new Set([
      'Ltd', 'Limited', 'PLC', 'LLC', 'Inc', 'Corp', 'Corporation',
      'Group', 'Holdings', 'Technologies', 'Technology', 'Energy',
      'Solutions', 'Industries', 'International', 'Enterprises',
      'Company', 'Co.', 'Pvt', 'Private', 'GmbH', 'AG', 'SA',
    ]);

    this.countryNames = new Set([
      'Bangladesh', 'India', 'USA', 'United States', 'UK', 'United Kingdom',
      'Australia', 'Canada', 'Germany', 'France', 'Japan', 'China', 'Singapore',
    ]);

    this.cityNames = new Set([
      'Dhaka', 'Chittagong', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna',
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Karachi',
    ]);
  }

  /**
   * Extract all business card fields from OcrDocument
   */
  extract(document: OcrDocument): BusinessCardData {
    const data: BusinessCardData = {};
    const usedWordIndices = new Set<number>();

    // Normalize coordinates
    const normLines = this.normalizeCoordinates(document.lines, document.width, document.height);

    // Extract label-value pairs first (before individual field extraction)
    this.extractLabelValueFields(normLines, data, usedWordIndices);

    // Extract in order of priority
    this.extractName(normLines, data, usedWordIndices);
    this.extractDesignation(normLines, data, usedWordIndices);
    this.extractCompany(normLines, data, usedWordIndices);
    this.extractWhatsApp(normLines, data, usedWordIndices);
    this.extractPhone(normLines, data, usedWordIndices);
    this.extractEmail(normLines, data, usedWordIndices);
    this.extractWebsite(normLines, data, usedWordIndices);
    this.extractAddress(normLines, data, usedWordIndices);
    this.extractCityCountry(normLines, data, usedWordIndices);

    // Store raw text
    data.rawText = document.rawText || normLines.map(l => l.text).join('\n');
    data.ocrDocument = document;

    return data;
  }

  /**
   * Normalize coordinates to 0-1 range for resolution independence
   */
  private normalizeCoordinates(lines: OcrLine[], width: number, height: number): OcrLine[] {
    return lines.map(line => ({
      ...line,
      boundingBox: {
        x: line.boundingBox.x / width,
        y: line.boundingBox.y / height,
        width: line.boundingBox.width / width,
        height: line.boundingBox.height / height,
      },
      words: line.words.map(word => ({
        ...word,
        boundingBox: {
          x: word.boundingBox.x / width,
          y: word.boundingBox.y / height,
          width: word.boundingBox.width / width,
          height: word.boundingBox.height / height,
        },
      })),
    }));
  }

  /**
   * Extract all label-value pairs in one pass
   */
  private extractLabelValueFields(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    const emailPattern = /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/;
    const emailNormalize = (email: string) => email.replace(/\s*@\s*/g, '@').replace(/\s*\.\s*/g, '.');
    const websitePattern = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+(?:\/[^\s]*)?/;
    const phonePatterns = [
      /\+88[-\s]?02[-\s]?\d{7,8}/,
      /\+88[-\s]?01[3-9]\d{8}/,
      /\+88[-\s]?01[3-9]\d[-\s]?\d{6,7}/,
      /\+8801[3-9]\d{8}/,
      /\+8802\d{7,8}/,
      /01[3-9]\d{8}/,
      /\+\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4,}/,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    ];

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();
      const pairs = this.extractLabelValuePairs(text);

      if (pairs.length > 0) {
        for (const pair of pairs) {
          if (pair.label === 'email') {
            const emailMatch = pair.value.match(emailPattern);
            if (emailMatch && !data.email) {
              data.email = {
                value: emailNormalize(emailMatch[0]),
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            }
          } else if (pair.label === 'website') {
            const websiteMatch = pair.value.match(websitePattern);
            if (websiteMatch && !data.website) {
              let url = websiteMatch[0];
              if (!url.startsWith('http')) {
                url = 'https://' + url;
              }
              data.website = {
                value: url,
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            }
          } else if (pair.label === 'phone') {
            const phoneMatch = this.matchPhonePattern(pair.value, phonePatterns);
            if (phoneMatch && !data.phone) {
              data.phone = {
                value: phoneMatch,
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            }
          } else if (pair.label === 'mobile') {
            const phoneMatch = this.matchPhonePattern(pair.value, phonePatterns);
            if (phoneMatch && !data.alternatePhone) {
              data.alternatePhone = {
                value: phoneMatch,
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            }
          } else if (pair.label === 'whatsapp') {
            // Use a more lenient pattern for WhatsApp numbers
            const whatsappPattern = /\+?[\d-]{10,}/;
            const phoneMatch = pair.value.match(whatsappPattern);
            if (phoneMatch && !data.whatsappNumber) {
              const cleaned = phoneMatch[0].replace(/[-\s]/g, '');
              data.whatsappNumber = {
                value: cleaned,
                confidence: 0.98,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            }
          }
        }
        used.add(i);
      }
    }
  }

  /**
   * Extract person name
   */
  private extractName(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Negative signals
      if (this.isOrganizationTerm(text)) continue;
      if (this.isEmail(text)) continue;
      if (this.isPhone(text)) continue;
      if (this.isWebsite(text)) continue;
      if (this.isCountry(text)) continue;

      // Positive signals
      const wordCount = text.split(/\s+/).length;
      const hasNumbers = /\d/.test(text);
      const isProminent = line.confidence > 0.7;
      const isUpperThird = line.boundingBox.y < 0.33;

      // Check proximity to designation
      const nextLine = lines[i + 1];
      const nextIsDesignation = nextLine && this.isDesignation(nextLine.text);
      const prevLine = lines[i - 1];
      const prevIsDesignation = prevLine && this.isDesignation(prevLine.text);

      if (wordCount >= 2 && wordCount <= 4 && !hasNumbers && 
          (isProminent || nextIsDesignation || prevIsDesignation || isUpperThird)) {
        data.fullName = {
          value: text,
          confidence: (nextIsDesignation || prevIsDesignation) ? 0.95 : 0.80,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        used.add(i);
        return;
      }
    }
  }

  /**
   * Extract designation
   */
  private extractDesignation(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      if (this.isDesignation(text)) {
        data.designation = {
          value: text,
          confidence: 0.97,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        used.add(i);
        return;
      }
    }
  }

  /**
   * Extract company/organization
   */
  private extractCompany(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Negative signals
      if (this.isEmail(text)) continue;
      if (this.isPhone(text)) continue;
      if (this.isWebsite(text)) continue;
      if (this.isDesignation(text)) continue;

      // Positive signals
      const hasOrgSuffix = this.hasOrganizationSuffix(text);
      const hasOrgTerm = this.isOrganizationTerm(text);
      const isProminent = line.confidence > 0.7;
      const isCapitalized = text === text.toUpperCase() && text.length > 2;
      const isUpperHalf = line.boundingBox.y < 0.5;

      if (hasOrgSuffix || (hasOrgTerm && isProminent) || (isCapitalized && isUpperHalf)) {
        data.company = {
          value: text,
          confidence: hasOrgSuffix ? 0.92 : 0.75,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        used.add(i);
        return;
      }
    }
  }

  /**
   * Extract phone numbers
   */
  private extractPhone(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    const phonePatterns = [
      /\+88[-\s]?02[-\s]?\d{7,8}/, // Bangladesh landline
      /\+88[-\s]?01[3-9]\d{8}/, // Bangladesh mobile full
      /\+88[-\s]?01[3-9]\d[-\s]?\d{6,7}/, // Bangladesh mobile with dash
      /\+8801[3-9]\d{8}/, // Bangladesh mobile no spaces
      /\+8802\d{7,8}/, // Bangladesh landline no spaces
      /01[3-9]\d{8}/, // Local format
      /\+\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4,}/, // International
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // US format
    ];

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Check for label-value pairs on same line
      const pairs = this.extractLabelValuePairs(text);
      if (pairs.length > 0) {
        for (const pair of pairs) {
          if (pair.label === 'phone' || pair.label === 'mobile') {
            const phoneMatch = this.matchPhonePattern(pair.value, phonePatterns);
            if (phoneMatch) {
              if (!data.phone) {
                data.phone = {
                  value: phoneMatch,
                  confidence: 0.99,
                  source: 'ocr',
                  evidence: [`line ${i}`],
                };
              } else if (!data.alternatePhone) {
                data.alternatePhone = {
                  value: phoneMatch,
                  confidence: 0.99,
                  source: 'ocr',
                  evidence: [`line ${i}`],
                };
              }
            }
          }
        }
        used.add(i);
        continue;
      }

      // Check for label on previous line
      const prevLine = lines[i - 1];
      if (prevLine && !used.has(i - 1)) {
        const prevText = prevLine.text.toLowerCase();
        if (prevText.includes('phone') || prevText.includes('tel')) {
          const phoneMatch = this.matchPhonePattern(text, phonePatterns);
          if (phoneMatch) {
            data.phone = {
              value: phoneMatch,
              confidence: 0.99,
              source: 'ocr',
              evidence: [`line ${i}`],
            };
            used.add(i - 1);
            used.add(i);
            continue;
          }
        }
        if (prevText.includes('mobile') || prevText.includes('cell')) {
          const phoneMatch = this.matchPhonePattern(text, phonePatterns);
          if (phoneMatch) {
            if (!data.phone) {
              data.phone = {
                value: phoneMatch,
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            } else {
              data.alternatePhone = {
                value: phoneMatch,
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
            }
            used.add(i - 1);
            used.add(i);
            continue;
          }
        }
      }

      // Direct phone detection
      const phoneMatch = this.matchPhonePattern(text, phonePatterns);
      if (phoneMatch) {
        if (!data.phone) {
          data.phone = {
            value: phoneMatch,
            confidence: 0.95,
            source: 'ocr',
            evidence: [`line ${i}`],
          };
        } else if (!data.alternatePhone) {
          data.alternatePhone = {
            value: phoneMatch,
            confidence: 0.95,
            source: 'ocr',
            evidence: [`line ${i}`],
          };
        }
        used.add(i);
      }
    }
  }

  /**
   * Extract email
   */
  private extractEmail(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    // More lenient pattern for OCR errors (spaces around @ and .)
    const emailPattern = /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/;
    const emailNormalize = (email: string) => email.replace(/\s*@\s*/g, '@').replace(/\s*\.\s*/g, '.');

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Check for label-value pairs
      const pairs = this.extractLabelValuePairs(text);
      if (pairs.length > 0) {
        for (const pair of pairs) {
          if (pair.label === 'email') {
            const emailMatch = pair.value.match(emailPattern);
            if (emailMatch) {
              data.email = {
                value: emailNormalize(emailMatch[0]),
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`, `value: ${pair.value}`],
              };
              used.add(i);
              return;
            }
          }
        }
        // Don't skip - still check for direct email detection
      }

      // Check for label on previous line
      const prevLine = lines[i - 1];
      if (prevLine && !used.has(i - 1)) {
        const prevText = prevLine.text.toLowerCase();
        if (prevText.includes('email') || prevText.includes('e-mail')) {
          const emailMatch = text.match(emailPattern);
          if (emailMatch) {
            data.email = {
              value: emailNormalize(emailMatch[0]),
              confidence: 0.99,
              source: 'ocr',
              evidence: [`line ${i}`],
            };
            used.add(i - 1);
            used.add(i);
            return;
          }
        }
      }

      // Direct email detection
      const emailMatch = text.match(emailPattern);
      if (emailMatch) {
        data.email = {
          value: emailNormalize(emailMatch[0]),
          confidence: 0.99,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        used.add(i);
        return;
      }
    }
  }

  /**
   * Extract website
   */
  private extractWebsite(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    const websitePattern = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+(?:\/[^\s]*)?/;

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Check for label-value pairs
      const pairs = this.extractLabelValuePairs(text);
      if (pairs.length > 0) {
        for (const pair of pairs) {
          if (pair.label === 'website') {
            const websiteMatch = pair.value.match(websitePattern);
            if (websiteMatch) {
              let url = websiteMatch[0];
              if (!url.startsWith('http')) {
                url = 'https://' + url;
              }
              data.website = {
                value: url,
                confidence: 0.99,
                source: 'ocr',
                evidence: [`line ${i}`],
              };
              used.add(i);
              return;
            }
          }
        }
        // Don't skip - still check for direct website detection
      }

      // Direct website detection
      const websiteMatch = text.match(websitePattern);
      if (websiteMatch) {
        let url = websiteMatch[0];
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        data.website = {
          value: url,
          confidence: 0.99,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        used.add(i);
        return;
      }
    }
  }

  /**
   * Extract address (multi-line, geometry-aware)
   */
  private extractAddress(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    const addressIndicators = [
      'Road', 'Rd', 'Street', 'St', 'Avenue', 'Ave', 'Lane', 'Ln',
      'Building', 'Floor', 'Tower', 'Block', 'House', 'Suite', 'Office',
      'Head Office', 'Branch', 'Sector', 'Area', 'Nagar', 'Bazar',
    ];

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Check if this looks like an address line
      const hasIndicator = addressIndicators.some(ind => 
        text.toLowerCase().includes(ind.toLowerCase())
      );
      const hasNumber = /\d+/.test(text);
      const isPostalCode = /\d{4}$/.test(text) || /-\d{4}$/.test(text);
      const isCity = this.cityNames.has(text);
      const isCountry = this.countryNames.has(text);

      if (hasIndicator || hasNumber || isPostalCode || isCity || isCountry) {
        // Collect consecutive address-like lines
        const addressLines: string[] = [];
        let j = i;
        
        while (j < lines.length && !used.has(j)) {
          const lineText = lines[j].text.trim();
          const lineHasIndicator = addressIndicators.some(ind => 
            lineText.toLowerCase().includes(ind.toLowerCase())
          );
          const lineHasNumber = /\d+/.test(lineText);
          
          if (lineHasIndicator || lineHasNumber || lineText.includes(',') || isCity || isCountry) {
            addressLines.push(lineText);
            used.add(j);
            j++;
          } else if (addressLines.length > 0 && lineText.length < 30) {
            // Allow short continuation lines
            addressLines.push(lineText);
            used.add(j);
            j++;
          } else {
            break;
          }
        }

        if (addressLines.length > 0) {
          data.address = {
            value: addressLines.join(', '),
            confidence: 0.88,
            source: 'ocr',
            evidence: addressLines.map((_, idx) => `line ${i + idx}`),
          };
          return;
        }
      }
    }
  }

  /**
   * Extract city and country
   */
  private extractCityCountry(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Extract country
      for (const country of this.countryNames) {
        if (text.toLowerCase().includes(country.toLowerCase())) {
          data.country = {
            value: country,
            confidence: 0.90,
            source: 'ocr',
            evidence: [`line ${i}`],
          };
          used.add(i);
          break;
        }
      }

      // Extract city
      for (const city of this.cityNames) {
        if (text.toLowerCase().includes(city.toLowerCase())) {
          data.city = {
            value: city,
            confidence: 0.85,
            source: 'ocr',
            evidence: [`line ${i}`],
          };
          used.add(i);
          break;
        }
      }
    }
  }

  /**
   * Extract WhatsApp
   */
  private extractWhatsApp(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.toLowerCase();

      if (text.includes('whatsapp') || text.includes('wa') || text.includes('w/a')) {
        // Check for label-value pair on same line
        const pairs = this.extractLabelValuePairs(line.text);
        if (pairs.length > 0) {
          for (const pair of pairs) {
            if (pair.label === 'whatsapp') {
              const phonePattern = /\+?\d{10,}/;
              const phoneMatch = pair.value.match(phonePattern);
              if (phoneMatch) {
                data.whatsappNumber = {
                  value: phoneMatch[0],
                  confidence: 0.98,
                  source: 'ocr',
                  evidence: [`line ${i}`],
                };
                used.add(i);
                return;
              }
            }
          }
        }
        
        // Fallback: Find nearest phone number
        const phonePattern = /\+?\d{10,}/;
        const phoneMatch = text.match(phonePattern);
        if (phoneMatch) {
          data.whatsappNumber = {
            value: phoneMatch[0],
            confidence: 0.98,
            source: 'ocr',
            evidence: [`line ${i}`],
          };
          used.add(i);
          return;
        }
      }
    }
  }

  /**
   * Extract label-value pairs from a line
   * Handles: "Phone : VALUE", "Phone : VALUE Mobile : VALUE", etc.
   */
  extractLabelValuePairs(line: string): Array<{ label: string; value: string }> {
    const pairs: Array<{ label: string; value: string }> = [];
    
    const labelPatterns = [
      { pattern: /phone\s*[:\s]+/i, field: 'phone' },
      { pattern: /tel\s*[:\s]+/i, field: 'phone' },
      { pattern: /mobile\s*[:\s]+/i, field: 'mobile' },
      { pattern: /cell\s*[:\s]+/i, field: 'mobile' },
      { pattern: /email\s*[:\s]+/i, field: 'email' },
      { pattern: /e-?mail\s*[:\s]+/i, field: 'email' },
      { pattern: /website\s*[:\s]+/i, field: 'website' },
      { pattern: /web\s*[:\s]+/i, field: 'website' },
      { pattern: /address\s*[:\s]+/i, field: 'address' },
      { pattern: /whatsapp\s*[:\s]+/i, field: 'whatsapp' },
    ];

    let remainingLine = line;
    let index = 0;
    
    while (index < labelPatterns.length) {
      const { pattern, field } = labelPatterns[index];
      const match = remainingLine.match(pattern);
      
      if (match) {
        const labelIndex = match.index || 0;
        const labelEnd = labelIndex + match[0].length;
        
        // Extract everything from the label to the next label or end of line
        let valueEnd = remainingLine.length;
        
        // Find next label
        for (const nextPattern of labelPatterns) {
          const nextMatch = remainingLine.slice(labelEnd).match(nextPattern.pattern);
          if (nextMatch && nextMatch.index !== undefined) {
            valueEnd = labelEnd + nextMatch.index;
            break;
          }
        }
        
        const value = remainingLine.slice(labelEnd, valueEnd).trim();
        if (value) {
          pairs.push({ label: field, value });
        }
        
        remainingLine = remainingLine.slice(valueEnd).trim();
        index = 0; // Restart from beginning of pattern list
      } else {
        index++;
      }
    }
    
    return pairs;
  }

  /**
   * Match phone pattern
   */
  private matchPhonePattern(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  // Helper methods
  private isDesignation(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (const title of this.jobTitleDictionary) {
      if (lowerText.includes(title.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  private isOrganizationTerm(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (const term of this.organizationTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  private hasOrganizationSuffix(text: string): boolean {
    for (const suffix of this.organizationSuffixes) {
      if (text.includes(suffix) || text.endsWith(suffix)) {
        return true;
      }
    }
    return false;
  }

  private isEmail(text: string): boolean {
    return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  }

  private isPhone(text: string): boolean {
    return /(\+\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4})|(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/.test(text);
  }

  private isWebsite(text: string): boolean {
    return /https?:\/\/|www\./.test(text);
  }

  private isCountry(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (const country of this.countryNames) {
      if (lowerText.includes(country.toLowerCase())) {
        return true;
      }
    }
    return false;
  }
}

export const businessCardExtractor = new BusinessCardExtractor();

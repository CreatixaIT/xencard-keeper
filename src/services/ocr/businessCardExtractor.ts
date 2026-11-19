import type { OcrDocument, OcrLine, BusinessCardData, FieldExtraction } from './ocrEngine';
import type { Industry } from '../../types';

/**
 * Business Card Extractor
 * 
 * Engine-independent deterministic parser that extracts business card fields
 * from OcrDocument using geometry, regex semantics, lexicons, and confidence scoring.
 */
export class BusinessCardExtractor {
  private jobTitleKeywords: string[];
  private organizationSuffixes: RegExp[];
  private organizationTerms: RegExp[];
  private countryNames: string[];
  private cityNames: string[];
  private namePrefixes: RegExp[];

  constructor() {
    this.namePrefixes = [
      /^(?:Dr\.?|Doctor)\b/i,
      /^(?:Prof\.?|Professor)\b/i,
      /^(?:Engr\.?|Engineer)\b/i,
      /^(?:Adv\.?|Advocate|Barrister)\b/i,
      /^(?:Mr\.?|Ms\.?|Mrs\.?)\b/i,
      /^(?:Md\.?|Mohammad|Mohammed|Muhammad)\b/i,
      /^(?:Sheikh|Syed|Kazi|Chowdhury)\b/i,
    ];

    this.jobTitleKeywords = [
      'Managing Director', 'Executive Director', 'Additional Director', 'Deputy Director',
      'Assistant Director', 'Technical Director', 'Finance Director', 'Director',
      'Chief Executive Officer', 'Chief Technology Officer', 'Chief Financial Officer',
      'Chief Operating Officer', 'Chief Marketing Officer', 'Chief Information Officer',
      'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CIO', 'MD',
      'Chairman', 'Chairperson', 'Vice Chairman', 'President', 'Vice President', 'VP', 'AVP', 'SVP',
      'Managing Partner', 'Senior Partner', 'Partner', 'Proprietor', 'Founder', 'Co-Founder', 'Owner',
      'General Manager', 'Deputy General Manager', 'Assistant General Manager', 'Branch Manager',
      'Project Manager', 'Product Manager', 'Sales Manager', 'Marketing Manager', 'Operations Manager',
      'Service Manager', 'HR Manager', 'Finance Manager', 'Account Manager', 'Manager',
      'Software Architect', 'Solutions Architect', 'Enterprise Architect', 'Architect',
      'Senior Software Engineer', 'Software Engineer', 'Senior Engineer', 'Lead Engineer',
      'Principal Engineer', 'DevOps Engineer', 'Frontend Engineer', 'Backend Engineer', 'Engineer',
      'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Web Developer', 'Mobile Developer', 'Developer',
      'Data Scientist', 'Data Analyst', 'Business Analyst', 'System Analyst', 'Financial Analyst', 'Analyst',
      'Senior Consultant', 'Consultant', 'Advisor', 'Strategist', 'Specialist',
      'Team Lead', 'Tech Lead', 'Lead', 'Head of', 'Head',
      'Senior Officer', 'Chief Officer', 'Officer', 'Executive', 'Senior Executive',
      'Associate Director', 'Senior Associate', 'Associate',
      'Advocate', 'Lawyer', 'Barrister', 'Legal Counsel', 'Counsel',
      'Doctor', 'Physician', 'Surgeon', 'Professor', 'Assistant Professor', 'Associate Professor', 'Lecturer',
      'Company Secretary', 'Auditor', 'Chartered Accountant', 'Accountant',
      'Coordinator', 'Administrator', 'Supervisor', 'Representative', 'Registrar',
    ];

    this.organizationSuffixes = [
      /\b(?:Ltd\.?|Limited)\b/i,
      /\b(?:PLC|LLC|LLP)\b/i,
      /\b(?:Inc\.?|Incorporated)\b/i,
      /\b(?:Corp\.?|Corporation)\b/i,
      /\b(?:Group|Holdings?)\b/i,
      /\b(?:Pvt\.?|Private)\s+(?:Ltd\.?|Limited)\b/i,
      /\b(?:Enterprises?|Ventures?)\b/i,
      /\b(?:Co\.?|Company)\b/i,
      /\b(?:GmbH|AG|SA|B\.?V\.?|S\.?A\.?)\b/i,
      /\b(?:Technologies|Technology|Tech)\b/i,
      /\b(?:Solutions?|Services?|Systems?)\b/i,
      /\b(?:Industries|Industry)\b/i,
      /\b(?:International|Global)\b/i,
    ];

    this.organizationTerms = [
      /\b(?:Bank|Banking)\b/i,
      /\b(?:Financial|Finance|Investment|Insurance|Capital|Securities)\b/i,
      /\b(?:Intelligence|Investigation)\b/i,
      /\b(?:Unit|Department|Division|Authority|Agency|Institute|Bureau|Commission|Ministry|Board|Council)\b/i,
      /\b(?:Foundation|Association|Federation|Chamber of Commerce|Trust|Society|Union)\b/i,
      /\b(?:Hospital|Medical Center|Clinic|Healthcare|Pharma|Pharmaceuticals)\b/i,
      /\b(?:University|College|School|Academy|Research Center)\b/i,
      /\b(?:Motors?|Automotive|Logistics|Airlines|Shipping|Transport)\b/i,
      /\b(?:Properties|Real Estate|Builders|Developers|Housing)\b/i,
      /\b(?:Energy|Power|Gas|Petroleum|Oil|Solar)\b/i,
    ];

    this.countryNames = [
      'Bangladesh', 'India', 'Pakistan', 'USA', 'United States', 'United States of America',
      'UK', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China',
      'Singapore', 'Malaysia', 'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar',
      'Kuwait', 'Oman', 'Bahrain', 'Nepal', 'Sri Lanka', 'Thailand', 'Indonesia',
      'Philippines', 'Vietnam', 'South Korea', 'Netherlands', 'Switzerland', 'Sweden',
      'Norway', 'Italy', 'Spain',
    ];

    this.cityNames = [
      'Dhaka', 'Chattogram', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal',
      'Rangpur', 'Mymensingh', 'Cumilla', 'Comilla', 'Cox\'s Bazar', 'Gazipur',
      'Narayanganj', 'Bogura', 'Bogra', 'Jessore', 'Kushtia', 'Kolkata', 'Delhi',
      'New Delhi', 'Mumbai', 'Bengaluru', 'Bangalore', 'Chennai', 'Hyderabad',
      'Pune', 'Ahmedabad', 'Karachi', 'Lahore', 'Islamabad', 'Dubai', 'Abu Dhabi',
      'Singapore', 'Kuala Lumpur', 'Bangkok', 'Tokyo', 'London', 'New York',
      'San Francisco', 'Los Angeles', 'Chicago', 'Toronto', 'Vancouver', 'Sydney',
      'Melbourne', 'Berlin', 'Paris', 'Sunnyvale',
    ];
  }

  /**
   * Extract all business card fields from OcrDocument
   */
  extract(document: OcrDocument): BusinessCardData {
    const data: BusinessCardData = {};
    const usedIndices = new Set<number>();

    // Normalize coordinates & split any multi-line items
    const normLines = this.prepareLines(document);

    // 1. Label-Value pairs (Phone, Email, Web, etc.)
    this.extractLabelValueFields(normLines, data, usedIndices);

    // 2. High-confidence structured extractions
    this.extractEmail(normLines, data, usedIndices);
    this.extractWebsite(normLines, data, usedIndices);
    this.extractWhatsApp(normLines, data, usedIndices);
    this.extractPhone(normLines, data, usedIndices);

    // 3. Designation & Name
    this.extractDesignation(normLines, data, usedIndices);
    this.extractName(normLines, data, usedIndices);

    // 4. Company
    this.extractCompany(normLines, data, usedIndices);

    // 5. Address
    this.extractAddress(normLines, data, usedIndices);

    // 6. City & Country (extracted from address or remaining lines)
    this.extractCityCountry(normLines, data);

    // 7. Industry Classification
    this.extractIndustry(normLines, data);

    // Store raw text
    data.rawText = document.rawText || normLines.map(l => l.text).join('\n');
    data.ocrDocument = document;

    return data;
  }

  /**
   * Split multi-line strings and normalize coordinates
   */
  private prepareLines(document: OcrDocument): OcrLine[] {
    const flattenedLines: OcrLine[] = [];
    const width = document.width || 1000;
    const height = document.height || 1000;

    for (const line of document.lines) {
      const text = (line.text || '').trim();
      if (!text) continue;

      if (text.includes('\n')) {
        const parts = text.split('\n').map(p => p.trim()).filter(Boolean);
        const partHeight = line.boundingBox.height / Math.max(parts.length, 1);
        parts.forEach((p, idx) => {
          flattenedLines.push({
            text: p,
            confidence: line.confidence,
            boundingBox: {
              x: line.boundingBox.x / width,
              y: (line.boundingBox.y + idx * partHeight) / height,
              width: line.boundingBox.width / width,
              height: partHeight / height,
            },
            words: line.words || [],
          });
        });
      } else {
        flattenedLines.push({
          text,
          confidence: line.confidence,
          boundingBox: {
            x: line.boundingBox.x / width,
            y: line.boundingBox.y / height,
            width: line.boundingBox.width / width,
            height: line.boundingBox.height / height,
          },
          words: line.words || [],
        });
      }
    }

    return flattenedLines;
  }

  /**
   * Extract label-value pairs from lines
   */
  private extractLabelValueFields(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();
      const pairs = this.extractLabelValuePairs(text);

      if (pairs.length > 0) {
        let matchedAny = false;
        for (const pair of pairs) {
          if (pair.label === 'email' && !data.email) {
            const clean = this.cleanEmail(pair.value);
            if (clean) {
              data.email = { value: clean, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
              matchedAny = true;
            }
          } else if (pair.label === 'website' && !data.website) {
            const clean = this.cleanWebsite(pair.value);
            if (clean) {
              data.website = { value: clean, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
              matchedAny = true;
            }
          } else if (pair.label === 'whatsapp' && !data.whatsappNumber) {
            const phoneMatch = this.extractPhoneFromString(pair.value);
            if (phoneMatch) {
              data.whatsappNumber = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
              matchedAny = true;
            }
          } else if (pair.label === 'mobile') {
            const phoneMatch = this.extractPhoneFromString(pair.value);
            if (phoneMatch) {
              if (!data.alternatePhone && data.phone?.value !== phoneMatch) {
                data.alternatePhone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
                matchedAny = true;
              } else if (!data.phone) {
                data.phone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
                matchedAny = true;
              }
            }
          } else if (pair.label === 'phone') {
            const phoneMatch = this.extractPhoneFromString(pair.value);
            if (phoneMatch) {
              if (!data.phone) {
                data.phone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
                matchedAny = true;
              } else if (!data.alternatePhone && data.phone.value !== phoneMatch) {
                data.alternatePhone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i}`] };
                matchedAny = true;
              }
            }
          }
        }
        if (matchedAny) {
          // If entire line consists only of label-value pairs, mark line as used
          const remaining = this.stripLabels(text);
          if (remaining.length < 5) {
            used.add(i);
          }
        }
      }

      // Check if this line is just a standalone label, and value is on the next line
      if (i + 1 < lines.length && !used.has(i + 1)) {
        const nextLineText = lines[i + 1].text.trim();
        const standaloneLabel = this.matchStandaloneLabel(text);
        if (standaloneLabel) {
          if (standaloneLabel === 'email' && !data.email) {
            const clean = this.cleanEmail(nextLineText);
            if (clean) {
              data.email = { value: clean, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              used.add(i);
              used.add(i + 1);
            }
          } else if (standaloneLabel === 'website' && !data.website) {
            const clean = this.cleanWebsite(nextLineText);
            if (clean) {
              data.website = { value: clean, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              used.add(i);
              used.add(i + 1);
            }
          } else if (standaloneLabel === 'whatsapp' && !data.whatsappNumber) {
            const phoneMatch = this.extractPhoneFromString(nextLineText);
            if (phoneMatch) {
              data.whatsappNumber = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              used.add(i);
              used.add(i + 1);
            }
          } else if (standaloneLabel === 'mobile') {
            const phoneMatch = this.extractPhoneFromString(nextLineText);
            if (phoneMatch) {
              if (!data.alternatePhone && data.phone?.value !== phoneMatch) {
                data.alternatePhone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              } else if (!data.phone) {
                data.phone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              }
              used.add(i);
              used.add(i + 1);
            }
          } else if (standaloneLabel === 'phone') {
            const phoneMatch = this.extractPhoneFromString(nextLineText);
            if (phoneMatch) {
              if (!data.phone) {
                data.phone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              } else if (!data.alternatePhone && data.phone.value !== phoneMatch) {
                data.alternatePhone = { value: phoneMatch, confidence: 0.99, source: 'ocr', evidence: [`line ${i+1}`] };
              }
              used.add(i);
              used.add(i + 1);
            }
          }
        }
      }
    }
  }

  /**
   * Extract Name
   */
  private extractName(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    let bestIndex = -1;
    let highestScore = -1;
    let bestConfidence = 0.8;

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      let text = line.text.trim();

      // Check for explicit "Name:" label
      const nameLabelMatch = text.match(/^(?:name|contact(?:\s+person)?)\s*[:.-]\s*(.+)$/i);
      if (nameLabelMatch) {
        text = nameLabelMatch[1].trim();
      }

      // Negative filters
      if (this.isEmail(text)) continue;
      if (this.isPhone(text)) continue;
      if (this.isWebsite(text)) continue;
      if (this.isDesignation(text)) continue;
      if (this.hasOrganizationSuffix(text)) continue;
      if (this.isAddressLine(text)) continue;
      if (/\b\d{4,}\b/.test(text)) continue; // Long numbers

      // Clean non-name characters
      const cleaned = text.replace(/[^A-Za-z.\s'-]/g, '').trim();
      if (!cleaned || cleaned.length < 3) continue;

      const words = cleaned.split(/\s+/);
      if (words.length < 1 || words.length > 5) continue;

      let score = 0;

      // Positive signals
      const hasPrefix = this.namePrefixes.some(prefix => prefix.test(cleaned));
      if (hasPrefix) score += 40;

      // Proximity to confirmed designation
      const nextLine = lines[i + 1];
      const prevLine = lines[i - 1];
      const nextIsDesig = nextLine && this.isDesignation(nextLine.text);
      const prevIsDesig = prevLine && this.isDesignation(prevLine.text);
      if (nextIsDesig || prevIsDesig) score += 35;

      // Upper half of card (names are almost always in upper half)
      if (line.boundingBox.y < 0.5) score += 20;

      // Word count preference (2 to 4 words is ideal)
      if (words.length >= 2 && words.length <= 4) score += 15;

      // Casing: Capitalized or ALL CAPS
      const isCapitalized = words.every(w => /^[A-Z]/.test(w));
      const isAllCaps = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
      if (isCapitalized || isAllCaps) score += 15;

      // Confidence
      score += (line.confidence || 0.5) * 10;

      if (score > highestScore && score >= 35) {
        highestScore = score;
        bestIndex = i;
        bestConfidence = (hasPrefix || nextIsDesig || prevIsDesig) ? 0.95 : 0.82;
      }
    }

    if (bestIndex !== -1) {
      let val = lines[bestIndex].text.trim();
      const labelMatch = val.match(/^(?:name|contact(?:\s+person)?)\s*[:.-]\s*(.+)$/i);
      if (labelMatch) val = labelMatch[1].trim();

      data.fullName = {
        value: val,
        confidence: bestConfidence,
        source: 'ocr',
        evidence: [`line ${bestIndex}`],
      };
      used.add(bestIndex);
    }
  }

  /**
   * Extract Designation
   */
  private extractDesignation(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      let text = line.text.trim();

      const labelMatch = text.match(/^(?:designation|title|role|position)\s*[:.-]\s*(.+)$/i);
      if (labelMatch) {
        text = labelMatch[1].trim();
      }

      if (this.isDesignation(text)) {
        // Strip label if present
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
   * Extract Company
   */
  private extractCompany(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    let bestIndex = -1;
    let highestScore = -1;
    let hasExplicitSuffix = false;

    // Check if email or website domain gives a clue
    let domainHint = '';
    if (data.website?.value) {
      const match = data.website.value.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+)/);
      if (match) domainHint = match[1].toLowerCase();
    } else if (data.email?.value) {
      const match = data.email.value.match(/@([a-zA-Z0-9-]+)/);
      if (match) domainHint = match[1].toLowerCase();
    }

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      let text = line.text.trim();

      // Check explicit label
      const compLabelMatch = text.match(/^(?:company|organization|org)\s*[:.-]\s*(.+)$/i);
      if (compLabelMatch) {
        text = compLabelMatch[1].trim();
      }

      // Negative filters
      if (this.isEmail(text)) continue;
      if (this.isPhone(text)) continue;
      if (this.isWebsite(text)) continue;
      if (this.isDesignation(text)) continue;
      if (this.isAddressLine(text)) continue;

      let score = 0;
      const hasSuffix = this.hasOrganizationSuffix(text);
      const hasTerm = this.isOrganizationTerm(text);

      if (hasSuffix) {
        score += 50;
        hasExplicitSuffix = true;
      }
      if (hasTerm) score += 30;

      // Domain hint matching
      if (domainHint && domainHint.length > 2) {
        const textWords = text.toLowerCase().split(/\s+/);
        if (textWords.some(w => domainHint.includes(w) || w.includes(domainHint))) {
          score += 40;
        }
      }

      // All caps in upper half
      if (text === text.toUpperCase() && text.length > 3 && line.boundingBox.y < 0.5) {
        score += 15;
      }

      // Prominence
      if (line.confidence > 0.8) score += 10;

      if (score > highestScore && score >= 25) {
        highestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      let val = lines[bestIndex].text.trim();
      const labelMatch = val.match(/^(?:company|organization|org)\s*[:.-]\s*(.+)$/i);
      if (labelMatch) val = labelMatch[1].trim();

      data.company = {
        value: val,
        confidence: hasExplicitSuffix ? 0.95 : 0.82,
        source: 'ocr',
        evidence: [`line ${bestIndex}`],
      };
      used.add(bestIndex);
    }
  }

  /**
   * Extract WhatsApp
   */
  private extractWhatsApp(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    if (data.whatsappNumber) return;

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text;

      // Check for WhatsApp label with word boundary
      const waMatch = text.match(/\b(?:whatsapp|wa|w\/a)\b\s*[:.-]?\s*([+\d\s-]{8,})/i);
      if (waMatch) {
        const cleaned = this.extractPhoneFromString(waMatch[1]);
        if (cleaned) {
          data.whatsappNumber = {
            value: cleaned,
            confidence: 0.98,
            source: 'ocr',
            evidence: [`line ${i}`],
          };
          // If the line only contained the WhatsApp number, mark used
          if (text.replace(/\b(?:whatsapp|wa|w\/a)\b\s*[:.-]?/i, '').trim().length <= cleaned.length + 3) {
            used.add(i);
          }
          return;
        }
      }
    }
  }

  /**
   * Extract Phone numbers
   */
  private extractPhone(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Skip lines that are URLs or emails
      if (this.isEmail(text) || this.isWebsite(text)) continue;

      // Extract all phone numbers from this line
      const phones = this.findAllPhonesInString(text);
      if (phones.length > 0) {
        let isOnlyPhones = true;
        for (const phone of phones) {
          if (!data.phone) {
            data.phone = { value: phone, confidence: 0.95, source: 'ocr', evidence: [`line ${i}`] };
          } else if (!data.alternatePhone && data.phone.value !== phone) {
            data.alternatePhone = { value: phone, confidence: 0.95, source: 'ocr', evidence: [`line ${i}`] };
          }
        }

        // Check if there's significant other text
        let remaining = text;
        phones.forEach(p => { remaining = remaining.replace(p, ''); });
        remaining = remaining.replace(/[\s,:;|\/-]/g, '').trim();
        if (remaining.length < 5) {
          used.add(i);
        }
      }
    }
  }

  /**
   * Extract Email
   */
  private extractEmail(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    if (data.email) return;

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const clean = this.cleanEmail(line.text);
      if (clean) {
        data.email = {
          value: clean,
          confidence: 0.99,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        // If line is basically just the email, mark used
        if (line.text.replace(/^(?:email|e-mail|mail)\s*[:.-]?\s*/i, '').trim().length <= clean.length + 3) {
          used.add(i);
        }
        return;
      }
    }
  }

  /**
   * Extract Website
   */
  private extractWebsite(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    if (data.website) return;

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      if (this.isEmail(line.text)) continue;

      const clean = this.cleanWebsite(line.text);
      if (clean) {
        data.website = {
          value: clean,
          confidence: 0.99,
          source: 'ocr',
          evidence: [`line ${i}`],
        };
        // If line is basically just the website, mark used
        if (line.text.replace(/^(?:website|web|url|site)\s*[:.-]?\s*/i, '').trim().length <= clean.length + 8) {
          used.add(i);
        }
        return;
      }
    }
  }

  /**
   * Extract Address (multi-line, geometry-aware)
   */
  private extractAddress(lines: OcrLine[], data: BusinessCardData, used: Set<number>): void {
    const addressLineIndices: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const line = lines[i];
      const text = line.text.trim();

      // Negative checks
      if (this.isEmail(text)) continue;
      if (this.isPhone(text)) continue;
      if (this.isWebsite(text)) continue;
      if (this.isDesignation(text)) continue;

      if (this.isAddressLine(text)) {
        addressLineIndices.push(i);
      }
    }

    if (addressLineIndices.length > 0) {
      // Group contiguous or closely spaced address lines
      const addressLines: string[] = [];
      for (const idx of addressLineIndices) {
        addressLines.push(lines[idx].text.trim());
        used.add(idx);
      }

      data.address = {
        value: addressLines.join(', '),
        confidence: 0.90,
        source: 'ocr',
        evidence: addressLineIndices.map(idx => `line ${idx}`),
      };
    }
  }

  /**
   * Extract City and Country (from address or any line)
   */
  private extractCityCountry(lines: OcrLine[], data: BusinessCardData): void {
    // 1. Search in address first
    const searchTexts = [
      data.address?.value || '',
      ...lines.map(l => l.text),
    ];

    for (const text of searchTexts) {
      if (!text) continue;

      // Extract City
      if (!data.city) {
        for (const city of this.cityNames) {
          const regex = new RegExp(`\\b${city}\\b`, 'i');
          if (regex.test(text)) {
            data.city = {
              value: city,
              confidence: 0.92,
              source: 'ocr',
            };
            break;
          }
        }
      }

      // Extract Country
      if (!data.country) {
        for (const country of this.countryNames) {
          const regex = new RegExp(`\\b${country}\\b`, 'i');
          if (regex.test(text)) {
            data.country = {
              value: country,
              confidence: 0.95,
              source: 'ocr',
            };
            break;
          }
        }
      }

      if (data.city && data.country) break;
    }
  }

  /**
   * Classify Industry
   */
  private extractIndustry(lines: OcrLine[], data: BusinessCardData): void {
    const fullText = [
      data.company?.value || '',
      data.designation?.value || '',
      data.website?.value || '',
      ...lines.map(l => l.text),
    ].join(' ').toLowerCase();

    const industryMap: Record<Industry, string[]> = {
      Technology: [
        'tech', 'technology', 'technologies', 'software', 'it', 'digital', 'computer',
        'app', 'web', 'cloud', 'data', 'ai', 'systems', 'solutions', 'cyber',
        'telecom', 'telecommunication', 'network', 'electronics', 'informatics', 'datasoft',
      ],
      Finance: [
        'bank', 'banking', 'finance', 'financial', 'investment', 'insurance', 'capital',
        'fund', 'credit', 'loan', 'securities', 'asset', 'wealth', 'audit', 'accounting',
        'tax', 'fintech', 'bfiu', 'monetary',
      ],
      Automotive: [
        'auto', 'automotive', 'motor', 'motors', 'car', 'vehicle', 'transport', 'transportation',
        'logistics', 'courier', 'freight', 'shipping', 'drive', 'transit',
      ],
      Healthcare: [
        'health', 'healthcare', 'medical', 'hospital', 'clinic', 'pharma', 'pharmaceuticals',
        'medicine', 'doctor', 'care', 'dental', 'diagnostic', 'therapy', 'biomedical',
      ],
      'Real Estate': [
        'real estate', 'property', 'properties', 'estate', 'housing', 'building', 'builder', 'builders',
        'construction', 'developer', 'developers', 'development', 'land', 'lands', 'realty', 'interior',
        'architectural', 'tower', 'towers', 'apartments', 'holding', 'holdings',
      ],
      Other: [],
    };

    let bestIndustry: Industry = 'Other';
    let maxMatches = 0;

    for (const [ind, keywords] of Object.entries(industryMap) as [Industry, string[]][]) {
      if (ind === 'Other') continue;
      let matches = 0;
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(fullText)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIndustry = ind;
      }
    }

    data.industry = {
      value: bestIndustry,
      confidence: maxMatches > 0 ? 0.90 : 0.60,
      source: 'ocr',
    };
  }

  // --- Helpers ---

  extractLabelValuePairs(line: string): Array<{ label: string; value: string }> {
    const pairs: Array<{ label: string; value: string }> = [];

    const labelDefs = [
      { pattern: /\b(?:phone|tel|telephone|office|t|p)\b\s*[:.-]\s*/i, label: 'phone' },
      { pattern: /\b(?:mobile|mob|cell|personal|m)\b\s*[:.-]\s*/i, label: 'mobile' },
      { pattern: /\b(?:whatsapp|wa|w\/a)\b\s*[:.-]\s*/i, label: 'whatsapp' },
      { pattern: /\b(?:email|e-mail|mail)\b\s*[:.-]\s*/i, label: 'email' },
      { pattern: /\b(?:website|web|url|site)\b\s*[:.-]\s*/i, label: 'website' },
      { pattern: /\b(?:address|addr)\b\s*[:.-]\s*/i, label: 'address' },
    ];

    // Find all matches with their positions
    interface LabelMatch {
      label: string;
      startIndex: number;
      valueStartIndex: number;
    }

    const matches: LabelMatch[] = [];

    for (const def of labelDefs) {
      let match: RegExpExecArray | null;
      const globalRegex = new RegExp(def.pattern.source, 'gi');
      while ((match = globalRegex.exec(line)) !== null) {
        matches.push({
          label: def.label,
          startIndex: match.index,
          valueStartIndex: match.index + match[0].length,
        });
      }
    }

    if (matches.length === 0) return pairs;

    // Sort by appearance order
    matches.sort((a, b) => a.startIndex - b.startIndex);

    for (let k = 0; k < matches.length; k++) {
      const cur = matches[k];
      const nextStart = (k + 1 < matches.length) ? matches[k + 1].startIndex : line.length;
      const value = line.slice(cur.valueStartIndex, nextStart).trim();
      if (value) {
        pairs.push({ label: cur.label, value });
      }
    }

    return pairs;
  }

  private matchStandaloneLabel(text: string): string | null {
    if (/^\b(?:email|e-mail|mail)\b\s*[:.-]?$/i.test(text)) return 'email';
    if (/^\b(?:website|web|url|site)\b\s*[:.-]?$/i.test(text)) return 'website';
    if (/^\b(?:whatsapp|wa|w\/a)\b\s*[:.-]?$/i.test(text)) return 'whatsapp';
    if (/^\b(?:mobile|mob|cell|m)\b\s*[:.-]?$/i.test(text)) return 'mobile';
    if (/^\b(?:phone|tel|telephone|office|t|p)\b\s*[:.-]?$/i.test(text)) return 'phone';
    return null;
  }

  private stripLabels(text: string): string {
    return text.replace(/\b(?:phone|tel|telephone|mobile|mob|cell|whatsapp|wa|email|e-mail|website|web)\b\s*[:.-]?/gi, '').trim();
  }

  cleanEmail(text: string): string | null {
    // Regex tolerant of spaces around @ and .
    const match = text.match(/[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/);
    if (!match) return null;
    let email = match[0].replace(/\s*@\s*/g, '@').replace(/\s*\.\s*/g, '.');
    // Strip trailing period or comma
    email = email.replace(/[.,;:)]+$/, '');
    return email;
  }

  cleanWebsite(text: string): string | null {
    // URL or domain pattern
    const match = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+(?:\/[^\s]*)?/);
    if (!match) return null;
    let url = match[0].replace(/[.,;:)]+$/, '');
    if (!url.includes('.')) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  extractPhoneFromString(text: string): string | null {
    const phones = this.findAllPhonesInString(text);
    return phones.length > 0 ? phones[0] : null;
  }

  findAllPhonesInString(text: string): string[] {
    const patterns = [
      /\+880?[-\s]?0?[1-9][\d-\s]{6,12}\d/g, // Bangladesh mobile & landline (+880, +88, +880-01, +880-02, etc.)
      /\b01[3-9][\d-\s]{7,10}\d\b/g, // Bangladesh local mobile
      /\b02[-\s]?\d{7,8}\b/g, // Bangladesh local landline
      /\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/g, // International
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g, // US format
    ];

    const results: string[] = [];
    for (const pat of patterns) {
      let m: RegExpExecArray | null;
      while ((m = pat.exec(text)) !== null) {
        const clean = m[0].trim();
        // Check digit count
        const digits = clean.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          if (!results.includes(clean)) {
            results.push(clean);
          }
        }
      }
    }
    return results;
  }

  isDesignation(text: string): boolean {
    const clean = text.replace(/^(?:designation|title|role|position)\s*[:.-]\s*/i, '').trim();
    // Negative check: addresses often have "head office"
    if (/\b(?:head\s+office|branch\s+office|registered\s+office)\b/i.test(clean)) return false;

    for (const title of this.jobTitleKeywords) {
      const regex = new RegExp(`\\b${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(clean)) {
        return true;
      }
    }
    return false;
  }

  hasOrganizationSuffix(text: string): boolean {
    return this.organizationSuffixes.some(regex => regex.test(text));
  }

  isOrganizationTerm(text: string): boolean {
    return this.organizationTerms.some(regex => regex.test(text));
  }

  isAddressLine(text: string): boolean {
    // If it starts with a person title (Dr., Prof., Engr., etc.), it is NOT an address line
    if (/^(?:Dr\.?|Doctor|Prof\.?|Professor|Engr\.?|Engineer|Adv\.?|Advocate|Mr\.?|Ms\.?|Mrs\.?)\s+[A-Za-z]/i.test(text)) {
      return false;
    }

    const addressIndicators = [
      /\b(?:road|street|avenue|lane|boulevard|highway|drive)\b/i,
      /\b\w+\s+(?:rd\.?|st\.?|ave\.?|ln\.?|blvd\.?|dr\.?)\b/i, // "Main St.", "Tech Blvd", "Oak Dr."
      /\b(?:building|bldg\.?|floor|fl\.?|tower|block|house|suite|ste\.?|level|plaza|annex|room)\b/i,
      /\b(?:sector|area|nagar|bazar|bazaar|colony|post|zip|thana|district|zone|park)\b/i,
      /\b(?:motijheel|gulshan|banani|dhanmondi|uttara|mirpur|kawran\s+bazar|agrabad)\b/i,
      /\b\d{1,4}(?:st|nd|rd|th)?\s+(?:floor|level|block|building|road|street|avenue|sec(?:tor)?|house|suite)\b/i,
      /\b(?:house|holding|plot|flat|suite)\s*#?\s*\d+/i,
      /\b(?:dhaka|chittagong|chattogram|sylhet|rajshahi|khulna)[-\s]?\d{4}\b/i, // Postal format
    ];

    return addressIndicators.some(regex => regex.test(text));
  }

  isEmail(text: string): boolean {
    return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  }

  isPhone(text: string): boolean {
    return this.findAllPhonesInString(text).length > 0;
  }

  isWebsite(text: string): boolean {
    return /(?:https?:\/\/|www\.)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(text);
  }
}

export const businessCardExtractor = new BusinessCardExtractor();

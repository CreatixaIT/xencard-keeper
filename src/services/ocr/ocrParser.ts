import type { Industry } from '../../types';
import type { OcrDocument } from './ocrEngine';
import { businessCardExtractor } from './businessCardExtractor';

export interface ParsedContact {
  personName?: string;
  companyName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  website?: string;
  industry?: Industry;
}

export function parseOCRText(rawText: string): ParsedContact {
  const lines = rawText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

  const doc: OcrDocument = {
    width: 1000,
    height: Math.max(lines.length * 30 + 100, 600),
    engine: 'fallback',
    blocks: [],
    lines: lines.map((text, idx) => ({
      text,
      confidence: 0.9,
      boundingBox: { x: 50, y: 30 * (idx + 1), width: 400, height: 25 },
      words: [],
    })),
    words: [],
    rawText,
    overallConfidence: 0.9,
  };

  const extracted = businessCardExtractor.extract(doc);

  return {
    personName: extracted.fullName?.value,
    companyName: extracted.company?.value,
    jobTitle: extracted.designation?.value,
    email: extracted.email?.value,
    phone: extracted.phone?.value,
    whatsappNumber: extracted.whatsappNumber?.value || extracted.phone?.value,
    address: extracted.address?.value,
    website: extracted.website?.value,
    industry: (extracted.industry?.value as Industry) || 'Other',
  };
}

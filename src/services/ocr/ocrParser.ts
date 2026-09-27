import type { Industry } from '../../types';

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
  
  const result: ParsedContact = {
    personName: extractName(lines),
    companyName: extractCompany(lines),
    jobTitle: extractJobTitle(lines),
    email: extractEmail(lines),
    phone: extractPhone(lines),
    whatsappNumber: extractPhone(lines), // Use same phone for WhatsApp initially
    address: extractAddress(lines),
    website: extractWebsite(lines),
    industry: classifyIndustry(lines),
  };

  return result;
}

function extractName(lines: string[]): string | undefined {
  // Name is typically first line or first two lines
  if (lines.length === 0) return undefined;
  
  const firstLine = lines[0];
  
  // Check if it looks like a name (contains letters, no numbers typically)
  if (/^[A-Za-z\s]+$/.test(firstLine) && firstLine.split(' ').length <= 3) {
    return firstLine;
  }
  
  // Check second line if first doesn't look like a name
  if (lines.length > 1 && /^[A-Za-z\s]+$/.test(lines[1]) && lines[1].split(' ').length <= 3) {
    return lines[1];
  }
  
  return undefined;
}

function extractCompany(lines: string[]): string | undefined {
  // Company often appears after name or contains business indicators
  const companyKeywords = ['Corp', 'Inc', 'Ltd', 'LLC', 'Company', 'Technologies', 'Solutions', 'Group', 'Motors', 'Motors Ltd'];
  
  for (const line of lines) {
    if (companyKeywords.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))) {
      return line;
    }
  }
  
  // If no clear company keyword, look for lines that might be company names
  for (let i = 1; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];
    if (line.length > 5 && /^[A-Za-z\s&]+$/.test(line)) {
      return line;
    }
  }
  
  return undefined;
}

function extractJobTitle(lines: string[]): string | undefined {
  const jobTitles = [
    'CEO', 'CTO', 'CFO', 'COO', 'Director', 'Managing Director', 'Manager', 'Founder',
    'Engineer', 'Consultant', 'Executive', 'Sales Manager', 'Marketing Manager',
    'Product Manager', 'Operations Manager', 'Software Engineer', 'Financial Analyst',
    'Chief Executive', 'Technical Director', 'Finance Director', 'Service Manager',
    'President', 'Vice President', 'VP', 'Developer', 'Designer', 'Analyst',
  ];
  
  for (const line of lines) {
    for (const title of jobTitles) {
      if (line.toLowerCase().includes(title.toLowerCase())) {
        return line;
      }
    }
  }
  
  return undefined;
}

function extractEmail(lines: string[]): string | undefined {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  for (const line of lines) {
    const match = line.match(emailRegex);
    if (match) {
      return match[0];
    }
  }
  
  return undefined;
}

function extractPhone(lines: string[]): string | undefined {
  // Support multiple phone formats
  const phonePatterns = [
    /\+?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4}/, // International
    /[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/, // US format
    /\+880[0-9]{9}/, // Bangladesh
    /\+1[0-9]{10}/, // US/Canada
    /\+44[0-9]{10}/, // UK
    /\+91[0-9]{10}/, // India
  ];
  
  for (const line of lines) {
    for (const pattern of phonePatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
  }
  
  return undefined;
}

function extractAddress(lines: string[]): string | undefined {
  // Address typically contains numbers, street names, cities
  const addressKeywords = ['Street', 'St', 'Avenue', 'Ave', 'Road', 'Rd', 'Lane', 'Ln', 'Boulevard', 'Blvd', 'Drive', 'Dr'];
  
  for (const line of lines) {
    if (addressKeywords.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))) {
      return line;
    }
  }
  
  // Look for lines with numbers and letters that might be addresses
  for (const line of lines) {
    if (/\d+\s+[A-Za-z]/.test(line) && line.length > 10) {
      return line;
    }
  }
  
  return undefined;
}

function extractWebsite(lines: string[]): string | undefined {
  const websitePatterns = [
    /https?:\/\/[^\s]+/,
    /www\.[^\s]+/,
    /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/,
  ];
  
  for (const line of lines) {
    for (const pattern of websitePatterns) {
      const match = line.match(pattern);
      if (match) {
        const url = match[0];
        // Ensure it has protocol
        return url.startsWith('http') ? url : `https://${url}`;
      }
    }
  }
  
  return undefined;
}

function classifyIndustry(lines: string[]): Industry {
  const text = lines.join(' ').toLowerCase();
  
  const industryKeywords: Record<Industry, string[]> = {
    Technology: ['tech', 'software', 'digital', 'it', 'computer', 'app', 'web', 'cloud', 'data', 'ai', 'ml'],
    Finance: ['bank', 'finance', 'investment', 'insurance', 'financial', 'capital', 'fund', 'credit', 'loan'],
    Automotive: ['auto', 'car', 'motor', 'vehicle', 'automotive', 'automobile', 'transport', 'drive'],
    Healthcare: ['health', 'medical', 'hospital', 'clinic', 'pharma', 'doctor', 'medicine', 'care'],
    'Real Estate': ['real estate', 'property', 'estate', 'housing', 'building', 'construction', 'land'],
    Other: [],
  };
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.length === 0) continue;
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return industry as Industry;
      }
    }
  }
  
  return 'Other';
}

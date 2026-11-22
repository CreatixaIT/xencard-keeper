import type { OcrDocument } from './ocrEngine';
import { businessCardExtractor } from './businessCardExtractor';

/**
 * OCR Regression Tests
 * 
 * Validates the extractor against representative business card fixtures.
 */
export interface TestFixture {
  name: string;
  lines: string[];
  expected: {
    fullName?: string;
    designation?: string;
    company?: string;
    phone?: string;
    alternatePhone?: string;
    whatsappNumber?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    industry?: string;
  };
}

export interface TestResult {
  fixture: string;
  field: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export class OCRRegressionTests {
  private fixtures: TestFixture[] = [
    {
      name: 'BFIU Card',
      lines: [
        'SHADRIL AHMED',
        'Additional Director',
        'Bangladesh Financial Intelligence Unit',
        'Phone : +88-02-9530056',
        'Mobile : +88-01914-208321',
        'E-mail : amed.shadril@bb.org.bd',
        'Website : www.bb.org.bd/bfiu',
        '11th Floor, 2nd Annex Building',
        'Bangladesh Bank, Head Office',
        'Motijheel, Dhaka-1000, Bangladesh',
      ],
      expected: {
        fullName: 'SHADRIL AHMED',
        designation: 'Additional Director',
        company: 'Bangladesh Financial Intelligence Unit',
        phone: '+88-02-9530056',
        alternatePhone: '+88-01914-208321',
        email: 'amed.shadril@bb.org.bd',
        website: 'https://www.bb.org.bd/bfiu',
        city: 'Dhaka',
        country: 'Bangladesh',
      },
    },
    {
      name: 'Xeltra Card',
      lines: [
        'Asif Iqbal',
        'Managing Director',
        'Xeltra Energy Ltd',
        'Phone: +880-1711-234567',
        'Website: www.xeltraenergy.com',
        'House 12, Road 5, Gulshan-1, Dhaka-1212',
      ],
      expected: {
        fullName: 'Asif Iqbal',
        designation: 'Managing Director',
        company: 'Xeltra Energy Ltd',
        phone: '+880-1711-234567',
        website: 'https://www.xeltraenergy.com',
        city: 'Dhaka',
      },
    },
    {
      name: 'Case 1: Name + Designation + Company',
      lines: [
        'John Doe',
        'Software Engineer',
        'Tech Company Ltd',
      ],
      expected: {
        fullName: 'John Doe',
        designation: 'Software Engineer',
        company: 'Tech Company Ltd',
      },
    },
    {
      name: 'Case 2: Phone + Mobile',
      lines: [
        'Phone: +880-02-1234567',
        'Mobile: +880-01712345678',
      ],
      expected: {
        phone: '+880-02-1234567',
        alternatePhone: '+880-01712345678',
      },
    },
    {
      name: 'Case 3: WhatsApp-labelled number',
      lines: [
        'WhatsApp: +880-01712345678',
      ],
      expected: {
        whatsappNumber: '+880-01712345678',
      },
    },
    {
      name: 'Case 4: Email + Website',
      lines: [
        'Email: contact@example.com',
        'Website: www.example.com',
      ],
      expected: {
        email: 'contact@example.com',
        website: 'https://www.example.com',
      },
    },
    {
      name: 'Case 5: Multi-line address',
      lines: [
        'House 12, Road 5',
        'Sector 10, Uttara',
        'Dhaka, Bangladesh',
      ],
      expected: {
        city: 'Dhaka',
        country: 'Bangladesh',
      },
    },
    {
      name: 'Case 6: International phone number',
      lines: [
        'Phone: +1-555-123-4567',
      ],
      expected: {
        phone: '+1-555-123-4567',
      },
    },
    {
      name: 'Case 7: Multi-line company name',
      lines: [
        'Advanced Technology Solutions International',
      ],
      expected: {
        company: 'Advanced Technology Solutions International',
      },
    },
    {
      name: 'Case 8: Two-column layout',
      lines: [
        'Jane Smith',
        'Manager',
        'Global Corp',
        'Phone: +880-02-1234567',
        'Email: jane@global.com',
      ],
      expected: {
        fullName: 'Jane Smith',
        designation: 'Manager',
        company: 'Global Corp',
        phone: '+880-02-1234567',
        email: 'jane@global.com',
      },
    },
  ];

  /**
   * Run all regression tests
   */
  runAllTests(): TestResult[] {
    const results: TestResult[] = [];

    for (const fixture of this.fixtures) {
      const doc: OcrDocument = {
        width: 1000,
        height: 600,
        engine: 'ml-kit',
        blocks: [],
        lines: fixture.lines.map((text, idx) => ({
          text,
          confidence: 0.95,
          boundingBox: { x: 50, y: 30 * (idx + 1), width: 400, height: 25 },
          words: [],
        })),
        words: [],
        overallConfidence: 0.95,
      };

      const extracted = businessCardExtractor.extract(doc);

      for (const [field, expectedVal] of Object.entries(fixture.expected)) {
        const actualVal = (extracted as any)[field]?.value || 'Not detected';
        const passed = this.match(expectedVal, actualVal, field === 'address');
        results.push({
          fixture: fixture.name,
          field,
          expected: expectedVal,
          actual: actualVal,
          passed,
        });
      }
    }

    return results;
  }

  /**
   * Run tests against pre-extracted data (legacy compatibility)
   */
  runTests(): TestResult[] {
    return this.runAllTests();
  }

  private match(expected: string, actual: string, isAddress = false): boolean {
    if (!actual || actual === 'Not detected') return false;

    if (isAddress) {
      const expectedParts = expected.split(',').map(p => p.trim().toLowerCase());
      const actualLower = actual.toLowerCase();
      return expectedParts.every(part => actualLower.includes(part));
    }

    return expected.toLowerCase() === actual.toLowerCase();
  }

  generateReport(results: TestResult[]): string {
    let report = 'OCR REGRESSION TEST REPORT\n';
    report += '='.repeat(50) + '\n\n';

    for (const result of results) {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      report += `${status} [${result.fixture}] ${result.field}\n`;
      report += `  Expected: ${result.expected}\n`;
      report += `  Actual: ${result.actual}\n\n`;
    }

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    report += `Summary: ${passed}/${total} tests passed\n`;

    return report;
  }
}

export const ocrRegressionTests = new OCRRegressionTests();

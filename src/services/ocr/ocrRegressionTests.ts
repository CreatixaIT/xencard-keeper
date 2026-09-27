import { BusinessCardData } from './ocrEngine';

/**
 * OCR Regression Tests
 * 
 * Phase 10: Regression tests for BFIU and Xeltra cards
 * 
 * These tests validate the parser against known fixtures.
 * The fixture values are used for testing only, not hardcoded into production logic.
 */

export interface TestFixture {
  name: string;
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
  };
}

export class OCRRegressionTests {
  private fixtures: TestFixture[] = [
    {
      name: 'BFIU Card',
      expected: {
        fullName: 'SHADRIL AHMED',
        designation: 'Additional Director',
        company: 'Bangladesh Financial Intelligence Unit',
        phone: '+88-02-9530056',
        alternatePhone: '+88-01914-208321',
        email: 'amed.shadril@bb.org.bd',
        website: 'www.bb.org.bd/bfiu',
        address: '11th Floor, 2nd Annex Building, Bangladesh Bank, Head Office, Motijheel, Dhaka-1000, Bangladesh',
        city: 'Dhaka',
        country: 'Bangladesh',
      },
    },
    {
      name: 'Xeltra Card',
      expected: {
        fullName: 'Xeltra Contact',
        designation: 'Designation',
        company: 'Xeltra Energy Ltd',
        phone: '+880...',
        website: 'www...',
        address: 'Address',
      },
    },
    {
      name: 'Case 1: Name + Designation + Company',
      expected: {
        fullName: 'John Doe',
        designation: 'Software Engineer',
        company: 'Tech Company Ltd',
      },
    },
    {
      name: 'Case 2: Phone + Mobile',
      expected: {
        phone: '+880-02-1234567',
        alternatePhone: '+880-01712345678',
      },
    },
    {
      name: 'Case 3: WhatsApp-labelled number',
      expected: {
        whatsappNumber: '+880-01712345678',
      },
    },
    {
      name: 'Case 4: Email + Website',
      expected: {
        email: 'contact@example.com',
        website: 'www.example.com',
      },
    },
    {
      name: 'Case 5: Four-line address',
      expected: {
        address: 'House 12, Road 5, Sector 10, Dhaka',
      },
    },
    {
      name: 'Case 6: International phone number',
      expected: {
        phone: '+1-555-123-4567',
      },
    },
    {
      name: 'Case 7: Multi-line company name',
      expected: {
        company: 'Advanced Technology Solutions International',
      },
    },
    {
      name: 'Case 8: Two-column layout',
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
   * Run regression tests against extracted data
   */
  runTests(extractedData: BusinessCardData): Array<{
    fixture: string;
    field: string;
    expected: string;
    actual: string;
    passed: boolean;
  }> {
    const results: Array<{
      fixture: string;
      field: string;
      expected: string;
      actual: string;
      passed: boolean;
    }> = [];

    for (const fixture of this.fixtures) {
      const expected = fixture.expected;

      // Test each field
      if (expected.fullName) {
        results.push({
          fixture: fixture.name,
          field: 'fullName',
          expected: expected.fullName,
          actual: extractedData.fullName?.value || 'Not detected',
          passed: this.match(expected.fullName, extractedData.fullName?.value || ''),
        });
      }

      if (expected.designation) {
        results.push({
          fixture: fixture.name,
          field: 'designation',
          expected: expected.designation,
          actual: extractedData.designation?.value || 'Not detected',
          passed: this.match(expected.designation, extractedData.designation?.value || ''),
        });
      }

      if (expected.company) {
        results.push({
          fixture: fixture.name,
          field: 'company',
          expected: expected.company,
          actual: extractedData.company?.value || 'Not detected',
          passed: this.match(expected.company, extractedData.company?.value || ''),
        });
      }

      if (expected.phone) {
        results.push({
          fixture: fixture.name,
          field: 'phone',
          expected: expected.phone,
          actual: extractedData.phone?.value || 'Not detected',
          passed: this.match(expected.phone, extractedData.phone?.value || ''),
        });
      }

      if (expected.alternatePhone) {
        results.push({
          fixture: fixture.name,
          field: 'alternatePhone',
          expected: expected.alternatePhone,
          actual: extractedData.alternatePhone?.value || 'Not detected',
          passed: this.match(expected.alternatePhone, extractedData.alternatePhone?.value || ''),
        });
      }

      if (expected.whatsappNumber) {
        results.push({
          fixture: fixture.name,
          field: 'whatsappNumber',
          expected: expected.whatsappNumber,
          actual: extractedData.whatsappNumber?.value || 'Not detected',
          passed: this.match(expected.whatsappNumber, extractedData.whatsappNumber?.value || ''),
        });
      }

      if (expected.email) {
        results.push({
          fixture: fixture.name,
          field: 'email',
          expected: expected.email,
          actual: extractedData.email?.value || 'Not detected',
          passed: this.match(expected.email, extractedData.email?.value || ''),
        });
      }

      if (expected.website) {
        results.push({
          fixture: fixture.name,
          field: 'website',
          expected: expected.website,
          actual: extractedData.website?.value || 'Not detected',
          passed: this.match(expected.website, extractedData.website?.value || ''),
        });
      }

      if (expected.address) {
        results.push({
          fixture: fixture.name,
          field: 'address',
          expected: expected.address,
          actual: extractedData.address?.value || 'Not detected',
          passed: this.match(expected.address, extractedData.address?.value || '', true), // Address may vary in formatting
        });
      }

      if (expected.city) {
        results.push({
          fixture: fixture.name,
          field: 'city',
          expected: expected.city,
          actual: extractedData.city?.value || 'Not detected',
          passed: this.match(expected.city, extractedData.city?.value || ''),
        });
      }

      if (expected.country) {
        results.push({
          fixture: fixture.name,
          field: 'country',
          expected: expected.country,
          actual: extractedData.country?.value || 'Not detected',
          passed: this.match(expected.country, extractedData.country?.value || ''),
        });
      }
    }

    return results;
  }

  /**
   * Match expected value with actual value
   * For address, use contains match (less strict)
   */
  private match(expected: string, actual: string, isAddress = false): boolean {
    if (!actual || actual === 'Not detected') {
      return false;
    }

    if (isAddress) {
      // Address may vary in formatting, check if all expected parts are present
      const expectedParts = expected.split(',').map(p => p.trim().toLowerCase());
      const actualLower = actual.toLowerCase();
      return expectedParts.every(part => actualLower.includes(part));
    }

    // Exact match for other fields
    return expected.toLowerCase() === actual.toLowerCase();
  }

  /**
   * Generate test report
   */
  generateReport(results: Array<{
    fixture: string;
    field: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>): string {
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

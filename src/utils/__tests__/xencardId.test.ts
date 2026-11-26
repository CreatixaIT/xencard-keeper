// Lightweight assertion helper for React Native / Expo environment without node types
function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Assertion failed: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || `Assertion failed: expected condition to be true`);
  }
}

function assertMatch(actual: string, pattern: RegExp, message?: string) {
  if (!pattern.test(actual)) {
    throw new Error(message || `Assertion failed: expected "${actual}" to match ${pattern}`);
  }
}

import {
  extractNamePart,
  extractDobPart,
  buildXencardId,
  resolveUniqueXencardId,
} from '../xencardIdFormat';

async function runTests() {
  // 1. Name extraction
  assertEqual(extractNamePart('Moktadir Sajid'), 'MO');
  assertEqual(extractNamePart('Md. Moktadir Sajid'), 'MO');
  assertEqual(extractNamePart('A'), 'AX');
  assertEqual(extractNamePart('12345'), 'XC');

  // 2. DOB extraction
  assertEqual(extractDobPart('1998-05-14'), '98');
  assertEqual(extractDobPart('14/05/2006'), '06');
  assertEqual(extractDobPart('14-05-1990'), '90');

  // 3. Built ID structure: 6 chars, uppercase alphanumeric, mix of letters & digits
  for (let i = 0; i < 50; i++) {
    const id = buildXencardId('Moktadir Sajid', '1998-05-14');
    assertEqual(id.length, 6, `Expected 6 chars, got ${id}`);
    assertMatch(id, /^[A-Z0-9]{6}$/);
    assertTrue(/[A-Z]/.test(id), `Expected letter in ${id}`);
    assertTrue(/\d/.test(id), `Expected digit in ${id}`);
    assertTrue(id.startsWith('MO98'), `Expected MO98 prefix in ${id}`);
  }

  // 4. Collision avoidance retry test
  const taken = new Set<string>();
  let attempts = 0;
  const unique1 = await resolveUniqueXencardId('Moktadir Sajid', '2000-01-01', async (candidate) => {
    attempts++;
    if (attempts <= 3) {
      taken.add(candidate);
      return true; // simulate first 3 candidates colliding in DB
    }
    return taken.has(candidate);
  });
  assertEqual(unique1.length, 6);
  assertTrue(!taken.has(unique1));
  assertTrue(attempts >= 4);

  console.log('ALL xencardId TESTS PASSED');
}

runTests().catch((err) => {
  console.error(err);
  throw err;
});


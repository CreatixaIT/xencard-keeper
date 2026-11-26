const XENID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const XENID_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const XENID_DIGITS = '23456789';

function pickChar(alphabet: string): string {
  return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
}

/**
 * Extract 2 uppercase ASCII letters from a user's full name.
 * For multi-word names, skips common short honorifics (e.g. Md, Dr) when another word exists
 * so IDs are more distinct across users.
 */
export function extractNamePart(fullName: string): string {
  const words = (fullName || '')
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, '').toUpperCase())
    .filter((w) => w.length > 0);

  const meaningful =
    words.length > 1 && ['MD', 'DR', 'MR', 'MS', 'MRS', 'ENGR', 'PROF'].includes(words[0])
      ? words.slice(1)
      : words;

  const combined = meaningful.join('');
  if (combined.length >= 2) {
    return combined.substring(0, 2);
  }
  return (combined + 'XC').substring(0, 2);
}

/**
 * Extract 2 numeric digits from dateOfBirth (birth year last 2 digits preferred).
 * Supports YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, or fallback digits.
 */
export function extractDobPart(dateOfBirth: string): string {
  const trimmed = (dateOfBirth || '').trim();
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return yearMatch[0].slice(-2);
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(-2);
  }
  if (digits.length === 1) {
    return `0${digits}`;
  }
  return Date.now().toString().slice(-2);
}

/**
 * Generates a 6-character alphanumeric Xencard ID derived from name + date of birth.
 * Format: [2 chars from name][2 digits from DOB][2 random alphanumeric chars]
 * Guarantees 6 uppercase alphanumeric chars containing both letters and digits.
 */
export function buildXencardId(fullName: string, dateOfBirth: string): string {
  const namePart = extractNamePart(fullName);
  const dobPart = extractDobPart(dateOfBirth);
  const rand = pickChar(XENID_CHARS) + pickChar(XENID_CHARS);
  const candidate = `${namePart}${dobPart}${rand}`;

  if (!/[A-Z]/.test(candidate) || !/\d/.test(candidate)) {
    return `${pickChar(XENID_LETTERS)}${pickChar(XENID_DIGITS)}${pickChar(XENID_CHARS)}${pickChar(XENID_CHARS)}${pickChar(XENID_CHARS)}${pickChar(XENID_CHARS)}`;
  }
  return candidate.substring(0, 6);
}

/**
 * Resolves a globally/locally unique 6-char ID using an async existence predicate.
 */
export async function resolveUniqueXencardId(
  fullName: string,
  dateOfBirth: string,
  existsInDb: (candidate: string) => Promise<boolean>
): Promise<string> {
  const MAX_RETRIES = 25;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const candidate = buildXencardId(fullName, dateOfBirth);
    if (!(await existsInDb(candidate))) {
      return candidate;
    }
  }

  for (let i = 0; i < MAX_RETRIES; i++) {
    const fallback =
      pickChar(XENID_LETTERS) +
      pickChar(XENID_DIGITS) +
      pickChar(XENID_CHARS) +
      pickChar(XENID_CHARS) +
      pickChar(XENID_CHARS) +
      pickChar(XENID_CHARS);
    if (!(await existsInDb(fallback))) {
      return fallback;
    }
  }

  const timePart = Date.now().toString(36).toUpperCase().slice(-4);
  return `${pickChar(XENID_LETTERS)}${pickChar(XENID_DIGITS)}${timePart}`.substring(0, 6);
}

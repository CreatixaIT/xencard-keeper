import type { XeniIntent, Industry } from '../../types';

export function parseXeniIntent(query: string): XeniIntent {
  const lowerQuery = query.toLowerCase().trim();

  // Action-based intents
  if (lowerQuery.startsWith('call ')) {
    return { type: 'CALL', contactId: '' }; // contactId will be resolved later
  }

  if (lowerQuery.startsWith('whatsapp ') || lowerQuery.startsWith('message ')) {
    return { type: 'WHATSAPP', contactId: '' };
  }

  if (lowerQuery.startsWith('email ') || lowerQuery.startsWith('mail ')) {
    return { type: 'EMAIL', contactId: '' };
  }

  if (lowerQuery.startsWith('map ') || lowerQuery.startsWith('location ') || lowerQuery.startsWith('where is ')) {
    return { type: 'MAPS', contactId: '' };
  }

  // Search-based intents
  const patterns = [
    {
      regex: /find\s+(.+?)\s+from\s+(.+)/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => ({
        personName: match[1].trim(),
        companyName: match[2].trim(),
      }),
    },
    {
      regex: /find\s+(.+?)\s+at\s+(.+)/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => ({
        personName: match[1].trim(),
        companyName: match[2].trim(),
      }),
    },
    {
      regex: /show\s+(.+?)\s+from\s+(.+)/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => ({
        personName: match[1].trim(),
        companyName: match[2].trim(),
      }),
    },
    {
      regex: /show\s+(.+?)\s+at\s+(.+)/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => ({
        personName: match[1].trim(),
        companyName: match[2].trim(),
      }),
    },
    {
      regex: /find\s+(.+)/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => ({
        query: match[1].trim(),
      }),
    },
    {
      regex: /show\s+(.+)/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => ({
        query: match[1].trim(),
      }),
    },
    {
      regex: /(.+)\s+contacts/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => {
        const industry = match[1].trim();
        const validIndustries: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];
        if (validIndustries.includes(industry as Industry)) {
          return { industry: industry as Industry };
        }
        return { query: match[0].trim() };
      },
    },
    {
      regex: /(.+)\s+industry/i,
      type: 'SEARCH' as const,
      extract: (match: RegExpMatchArray) => {
        const industry = match[1].trim();
        const validIndustries: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];
        if (validIndustries.includes(industry as Industry)) {
          return { industry: industry as Industry };
        }
        return { query: match[0].trim() };
      },
    },
  ];

  for (const pattern of patterns) {
    const match = lowerQuery.match(pattern.regex);
    if (match) {
      const extracted = pattern.extract(match);
      return { type: pattern.type, ...extracted };
    }
  }

  // Default to simple search
  return { type: 'SEARCH', query };
}

export function resolveContactForAction(
  intent: XeniIntent,
  contacts: any[],
  nameQuery: string
): string | null {
  if (intent.type === 'UNKNOWN') return null;

  // Try to find contact by name
  const query = nameQuery.toLowerCase();
  
  // Exact match first
  let contact = contacts.find((c) => c.personName.toLowerCase() === query);
  if (contact) return contact.id;

  // Partial match
  contact = contacts.find((c) => c.personName.toLowerCase().includes(query));
  if (contact) return contact.id;

  // Try company name
  contact = contacts.find((c) => c.companyName.toLowerCase().includes(query));
  if (contact) return contact.id;

  return null;
}

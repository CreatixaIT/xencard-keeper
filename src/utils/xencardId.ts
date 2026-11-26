import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { userProfile } from '../db/schema';
import { resolveUniqueXencardId } from './xencardIdFormat';

export { extractNamePart, extractDobPart, buildXencardId, resolveUniqueXencardId } from './xencardIdFormat';

/**
 * Generates a 6-character Xencard ID and verifies uniqueness against the local database.
 */
export async function generateUniqueXencardId(fullName: string, dateOfBirth: string): Promise<string> {
  return resolveUniqueXencardId(fullName, dateOfBirth, async (candidate) => {
    const existing = await db
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(eq(userProfile.xencard_id, candidate))
      .limit(1);
    return existing.length > 0;
  });
}

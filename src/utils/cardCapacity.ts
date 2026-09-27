import { getContactCount } from '../db/repositories/contactRepository';
import { getUserProfile } from '../db/repositories/userProfileRepository';

export async function checkCardCapacity(): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return { allowed: false, current: 0, limit: 100, message: 'Profile not found' };
    }

    const currentCount = await getContactCount();
    const allowed = currentCount < profile.cardLimit;

    if (!allowed) {
      return {
        allowed: false,
        current: currentCount,
        limit: profile.cardLimit,
        message: `Card limit reached. You have ${currentCount}/${profile.cardLimit} cards. Invite friends to increase your limit.`
      };
    }

    return { allowed: true, current: currentCount, limit: profile.cardLimit };
  } catch (error) {
    console.error('Failed to check card capacity:', error);
    return { allowed: false, current: 0, limit: 100, message: 'Failed to check card capacity' };
  }
}

export function getStorageWarningThreshold(current: number, limit: number): boolean {
  const remaining = limit - current;
  const percentage = (remaining / limit) * 100;
  return percentage <= 10;
}

export function getCapacityDisplay(current: number, limit: number): string {
  return `${current}/${limit}`;
}
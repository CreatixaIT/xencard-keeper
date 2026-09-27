import { eq } from 'drizzle-orm';
import { db } from '../client';
import { userProfile, referrals } from '../schema';
import type { UserProfile, Referral } from '../../types';

function generateXencardId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `XEN${timestamp}${random}`.toUpperCase();
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createUserProfile(
  profile: Omit<UserProfile, 'id' | 'xencardId' | 'referralCode' | 'cardLimit' | 'createdTimestamp' | 'updatedTimestamp'> & { xencardId?: string }
): Promise<UserProfile> {
  const id = Date.now().toString();
  const xencardId = profile.xencardId || generateXencardId(); // Use provided ID or generate new one
  const referralCode = generateReferralCode();
  const cardLimit = 100;
  const createdTimestamp = Date.now();
  const updatedTimestamp = Date.now();
  
  const newProfile: UserProfile = {
    id,
    xencardId,
    fullName: profile.fullName,
    designation: profile.designation,
    dateOfBirth: profile.dateOfBirth,
    cardLimit,
    referralCode,
    referredBy: profile.referredBy,
    createdTimestamp,
    updatedTimestamp,
  };

  await db.insert(userProfile).values({
    id: newProfile.id,
    xencard_id: newProfile.xencardId,
    full_name: newProfile.fullName,
    designation: newProfile.designation,
    date_of_birth: newProfile.dateOfBirth,
    card_limit: newProfile.cardLimit,
    referral_code: newProfile.referralCode,
    referred_by: newProfile.referredBy || null,
    created_timestamp: newProfile.createdTimestamp,
    updated_timestamp: newProfile.updatedTimestamp,
  });

  return newProfile;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const result = await db.select().from(userProfile).limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    xencardId: row.xencard_id,
    fullName: row.full_name,
    designation: row.designation,
    dateOfBirth: row.date_of_birth,
    cardLimit: row.card_limit,
    referralCode: row.referral_code,
    referredBy: row.referred_by || undefined,
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  };
}

export async function updateUserProfile(
  id: string,
  updates: Partial<Omit<UserProfile, 'id' | 'xencardId' | 'referralCode' | 'createdTimestamp' | 'updatedTimestamp'>>
): Promise<UserProfile | null> {
  const updatedTimestamp = Date.now();
  
  const dbUpdates: any = {
    updated_timestamp: updatedTimestamp,
  };
  
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
  if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
  if (updates.cardLimit !== undefined) dbUpdates.card_limit = updates.cardLimit;
  if (updates.referredBy !== undefined) dbUpdates.referred_by = updates.referredBy;
  
  await db
    .update(userProfile)
    .set(dbUpdates)
    .where(eq(userProfile.id, id));

  return getUserProfile();
}

export async function increaseCardLimit(userId: string, increase: number): Promise<UserProfile | null> {
  const profile = await getUserProfile();
  if (!profile) return null;
  
  return updateUserProfile(profile.id, {
    cardLimit: profile.cardLimit + increase,
  });
}

export async function createReferral(
  referrerId: string,
  referredUserId: string,
  referralCode: string
): Promise<Referral> {
  const id = Date.now().toString();
  const createdTimestamp = Date.now();
  
  const newReferral: Referral = {
    id,
    referrerId,
    referredUserId,
    referralCode,
    confirmed: false,
    cardLimitIncrease: 20,
    createdTimestamp,
  };

  await db.insert(referrals).values({
    id: newReferral.id,
    referrer_id: newReferral.referrerId,
    referred_user_id: newReferral.referredUserId,
    referral_code: newReferral.referralCode,
    confirmed: newReferral.confirmed ? 1 : 0,
    card_limit_increase: newReferral.cardLimitIncrease,
    created_timestamp: newReferral.createdTimestamp,
    confirmed_timestamp: null,
  } as any);

  return newReferral;
}

export async function confirmReferral(referralId: string): Promise<Referral | null> {
  const confirmedTimestamp = Date.now();
  
  await db
    .update(referrals)
    .set({
      confirmed: 1,
      confirmed_timestamp: confirmedTimestamp,
    } as any)
    .where(eq(referrals.id, referralId));

  const result = await db.select().from(referrals).where(eq(referrals.id, referralId)).limit(1);
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    referrerId: row.referrer_id,
    referredUserId: row.referred_user_id,
    referralCode: row.referral_code,
    confirmed: Boolean(row.confirmed),
    cardLimitIncrease: row.card_limit_increase,
    createdTimestamp: row.created_timestamp,
    confirmedTimestamp: row.confirmed_timestamp || undefined,
  };
}

export async function getReferralByCode(referralCode: string): Promise<Referral | null> {
  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referral_code, referralCode))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    referrerId: row.referrer_id,
    referredUserId: row.referred_user_id,
    referralCode: row.referral_code,
    confirmed: Boolean(row.confirmed),
    cardLimitIncrease: row.card_limit_increase,
    createdTimestamp: row.created_timestamp,
    confirmedTimestamp: row.confirmed_timestamp || undefined,
  };
}

export async function getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrer_id, referrerId));
    
  return result.map(row => ({
    id: row.id,
    referrerId: row.referrer_id,
    referredUserId: row.referred_user_id,
    referralCode: row.referral_code,
    confirmed: Boolean(row.confirmed),
    cardLimitIncrease: row.card_limit_increase,
    createdTimestamp: row.created_timestamp,
    confirmedTimestamp: row.confirmed_timestamp || undefined,
  }));
}

export async function getProfileByXencardId(xencardId: string): Promise<UserProfile | null> {
  const result = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.xencard_id, xencardId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    xencardId: row.xencard_id,
    fullName: row.full_name,
    designation: row.designation,
    dateOfBirth: row.date_of_birth,
    cardLimit: row.card_limit,
    referralCode: row.referral_code,
    referredBy: row.referred_by || undefined,
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  };
}

export async function getProfileByReferralCode(referralCode: string): Promise<UserProfile | null> {
  const result = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.referral_code, referralCode))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    xencardId: row.xencard_id,
    fullName: row.full_name,
    designation: row.designation,
    dateOfBirth: row.date_of_birth,
    cardLimit: row.card_limit,
    referralCode: row.referral_code,
    referredBy: row.referred_by || undefined,
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  };
}
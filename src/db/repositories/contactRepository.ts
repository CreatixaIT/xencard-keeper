import { eq, like, or, desc } from 'drizzle-orm';
import { db } from '../client';
import { contacts } from '../schema';
import type { VisitingCard, Industry } from '../../types';
import { getUserProfile } from './userProfileRepository';

function mapDbRowToContact(row: any): VisitingCard {
  return {
    id: row.id,
    personName: row.person_name,
    companyName: row.company_name,
    jobTitle: row.job_title,
    email: row.email,
    phone: row.phone,
    alternatePhone: row.alternate_phone,
    whatsappNumber: row.whatsapp_number,
    address: row.address,
    city: row.city,
    country: row.country,
    website: row.website,
    industry: row.industry,
    notes: row.notes,
    rawOcrText: row.raw_ocr_text,
    cardImageUri: row.card_image_uri,
    backImageUri: row.back_image_uri,
    thumbnailUri: row.thumbnail_uri,
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  };
}

export async function createContact(
  contact: Omit<VisitingCard, 'id' | 'createdTimestamp'>
): Promise<VisitingCard> {
  // Check card limit
  const profile = await getUserProfile();
  if (profile) {
    const currentCount = await getContactCount();
    if (currentCount >= profile.cardLimit) {
      throw new Error(`Card limit reached. You have ${currentCount}/${profile.cardLimit} cards. Invite friends to increase your limit.`);
    }
  }

  const id = Date.now().toString();
  const createdTimestamp = Date.now();
  const newContact = {
    ...contact,
    id,
    createdTimestamp,
  };

  await db.insert(contacts).values({
    id: newContact.id,
    person_name: newContact.personName,
    company_name: newContact.companyName,
    job_title: newContact.jobTitle || null,
    email: newContact.email || null,
    phone: newContact.phone || null,
    alternate_phone: newContact.alternatePhone || null,
    whatsapp_number: newContact.whatsappNumber || null,
    address: newContact.address || null,
    city: newContact.city || null,
    country: newContact.country || null,
    website: newContact.website || null,
    industry: newContact.industry,
    notes: newContact.notes || null,
    raw_ocr_text: newContact.rawOcrText || null,
    card_image_uri: newContact.cardImageUri,
    back_image_uri: newContact.backImageUri || null,
    thumbnail_uri: newContact.thumbnailUri || null,
    sync_status: 'pending',
    created_timestamp: newContact.createdTimestamp,
    updated_timestamp: newContact.updatedTimestamp || null,
  });

  return newContact;
}

export async function getContact(id: string): Promise<VisitingCard | null> {
  const result = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  
  if (result.length === 0) return null;
  
  return mapDbRowToContact(result[0]);
}

export async function getContacts(): Promise<VisitingCard[]> {
  const result = await db.select().from(contacts).orderBy(desc(contacts.created_timestamp));
  return result.map(mapDbRowToContact);
}

export async function updateContact(
  id: string,
  updates: Partial<Omit<VisitingCard, 'id' | 'createdTimestamp'>>
): Promise<VisitingCard | null> {
  const updatedTimestamp = Date.now();
  
  const dbUpdates: any = {
    updated_timestamp: updatedTimestamp,
  };
  
  if (updates.personName !== undefined) dbUpdates.person_name = updates.personName;
  if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
  if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.whatsappNumber !== undefined) dbUpdates.whatsapp_number = updates.whatsappNumber;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.website !== undefined) dbUpdates.website = updates.website;
  if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
  if (updates.rawOcrText !== undefined) dbUpdates.raw_ocr_text = updates.rawOcrText;
  if (updates.cardImageUri !== undefined) dbUpdates.card_image_uri = updates.cardImageUri;
  
  await db
    .update(contacts)
    .set(dbUpdates)
    .where(eq(contacts.id, id));

  return getContact(id);
}

export async function deleteContact(id: string): Promise<boolean> {
  await db.delete(contacts).where(eq(contacts.id, id));
  return true;
}

export async function searchContacts(query: string): Promise<VisitingCard[]> {
  if (!query || query.trim().length === 0) {
    return getContacts();
  }

  const searchTerm = `%${query.toLowerCase()}%`;
  const result = await db
    .select()
    .from(contacts)
    .where(
      or(
        like(contacts.person_name, searchTerm),
        like(contacts.company_name, searchTerm),
        like(contacts.job_title, searchTerm),
        like(contacts.email, searchTerm),
        like(contacts.phone, searchTerm),
        like(contacts.industry, searchTerm)
      )
    )
    .orderBy(desc(contacts.created_timestamp));
    
  return result.map(mapDbRowToContact);
}

export async function filterContactsByIndustry(
  industry: Industry
): Promise<VisitingCard[]> {
  const result = await db
    .select()
    .from(contacts)
    .where(eq(contacts.industry, industry))
    .orderBy(desc(contacts.created_timestamp));
    
  return result.map(mapDbRowToContact);
}

export async function getContactCount(): Promise<number> {
  const result = await db.select({ count: contacts.id }).from(contacts);
  return result.length;
}

export async function getIndustryStats(): Promise<Record<Industry, number>> {
  const allContacts = await getContacts();
  const stats: Record<Industry, number> = {
    Technology: 0,
    Finance: 0,
    Automotive: 0,
    Healthcare: 0,
    'Real Estate': 0,
    Other: 0,
  };

  allContacts.forEach((contact) => {
    stats[contact.industry]++;
  });

  return stats;
}

export async function getRecentContacts(limit: number = 10): Promise<VisitingCard[]> {
  const result = await db
    .select()
    .from(contacts)
    .orderBy(desc(contacts.created_timestamp))
    .limit(limit);
    
  return result.map(mapDbRowToContact);
}

export async function getCompanyCount(): Promise<number> {
  const allContacts = await getContacts();
  const companies = new Set(allContacts.map((c) => c.companyName));
  return companies.size;
}

export async function getIndustryCount(): Promise<number> {
  const stats = await getIndustryStats();
  return Object.values(stats).filter((count) => count > 0).length;
}

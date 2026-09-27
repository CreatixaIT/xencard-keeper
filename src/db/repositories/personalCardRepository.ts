import { eq } from 'drizzle-orm';
import { db } from '../client';
import { personalCard } from '../schema';
import type { UserPersonalCard } from '../../types';

export async function createPersonalCard(
  card: Omit<UserPersonalCard, 'id' | 'createdTimestamp' | 'updatedTimestamp'>
): Promise<UserPersonalCard> {
  const id = Date.now().toString();
  const createdTimestamp = Date.now();
  const updatedTimestamp = Date.now();
  const newCard = {
    ...card,
    id,
    createdTimestamp,
    updatedTimestamp,
  };

  await db.insert(personalCard).values({
    id: newCard.id,
    company_name: newCard.companyName,
    full_name: newCard.fullName,
    designation: newCard.designation,
    email: newCard.email,
    phone: newCard.phone,
    alternate_phone: (card as any).alternatePhone || null,
    whatsapp_number: (card as any).whatsappNumber || null,
    address: newCard.address || null,
    city: (card as any).city || null,
    country: (card as any).country || null,
    website: newCard.website || null,
    industry: (card as any).industry || null,
    profile_photo_uri: (card as any).profilePhotoUri || null,
    front_image_uri: (card as any).frontImageUri || null,
    back_image_uri: (card as any).backImageUri || null,
    file_uri: newCard.fileUri || null,
    file_type: newCard.fileType || null,
    additional_details: JSON.stringify(newCard.additionalDetails),
    is_active: true,
    created_timestamp: newCard.createdTimestamp,
    updated_timestamp: newCard.updatedTimestamp,
  });

  return newCard;
}

export async function getAllPersonalCards(): Promise<UserPersonalCard[]> {
  const result = await db.select().from(personalCard).orderBy(personalCard.created_timestamp);
  
  return result.map(row => ({
    id: row.id,
    companyName: row.company_name,
    fullName: row.full_name,
    designation: row.designation,
    email: row.email,
    phone: row.phone,
    alternatePhone: row.alternate_phone || undefined,
    whatsappNumber: row.whatsapp_number || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    country: row.country || undefined,
    website: row.website || undefined,
    industry: row.industry || undefined,
    profilePhotoUri: row.profile_photo_uri || undefined,
    frontImageUri: row.front_image_uri || undefined,
    backImageUri: row.back_image_uri || undefined,
    fileUri: row.file_uri || undefined,
    fileType: row.file_type as 'png' | 'pdf' | undefined,
    additionalDetails: row.additional_details ? JSON.parse(row.additional_details) : {},
    isActive: Boolean(row.is_active),
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  }));
}

export async function getActivePersonalCard(): Promise<UserPersonalCard | null> {
  const result = await db
    .select()
    .from(personalCard)
    .where(eq(personalCard.is_active, true))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    companyName: row.company_name,
    fullName: row.full_name,
    designation: row.designation,
    email: row.email,
    phone: row.phone,
    alternatePhone: row.alternate_phone || undefined,
    whatsappNumber: row.whatsapp_number || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    country: row.country || undefined,
    website: row.website || undefined,
    industry: row.industry || undefined,
    profilePhotoUri: row.profile_photo_uri || undefined,
    frontImageUri: row.front_image_uri || undefined,
    backImageUri: row.back_image_uri || undefined,
    fileUri: row.file_uri || undefined,
    fileType: row.file_type as 'png' | 'pdf' | undefined,
    additionalDetails: row.additional_details ? JSON.parse(row.additional_details) : {},
    isActive: Boolean(row.is_active),
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  };
}

export async function getPersonalCard(id: string): Promise<UserPersonalCard | null> {
  const result = await db.select().from(personalCard).where(eq(personalCard.id, id)).limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id,
    companyName: row.company_name,
    fullName: row.full_name,
    designation: row.designation,
    email: row.email,
    phone: row.phone,
    alternatePhone: row.alternate_phone || undefined,
    whatsappNumber: row.whatsapp_number || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    country: row.country || undefined,
    website: row.website || undefined,
    industry: row.industry || undefined,
    profilePhotoUri: row.profile_photo_uri || undefined,
    frontImageUri: row.front_image_uri || undefined,
    backImageUri: row.back_image_uri || undefined,
    fileUri: row.file_uri || undefined,
    fileType: row.file_type as 'png' | 'pdf' | undefined,
    additionalDetails: row.additional_details ? JSON.parse(row.additional_details) : {},
    isActive: Boolean(row.is_active),
    createdTimestamp: row.created_timestamp,
    updatedTimestamp: row.updated_timestamp,
  };
}

export async function setActivePersonalCard(id: string): Promise<boolean> {
  // Deactivate all cards
  await db.update(personalCard).set({ is_active: false });
  
  // Activate the specified card
  await db
    .update(personalCard)
    .set({ is_active: true, updated_timestamp: Date.now() })
    .where(eq(personalCard.id, id));
  
  return true;
}

export async function updatePersonalCard(
  id: string,
  updates: Partial<Omit<UserPersonalCard, 'id' | 'createdTimestamp' | 'updatedTimestamp'>>
): Promise<UserPersonalCard | null> {
  const updatedTimestamp = Date.now();
  
  const dbUpdates: any = {
    updated_timestamp: updatedTimestamp,
  };
  
  if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if ((updates as any).alternatePhone !== undefined) dbUpdates.alternate_phone = (updates as any).alternatePhone;
  if ((updates as any).whatsappNumber !== undefined) dbUpdates.whatsapp_number = (updates as any).whatsappNumber;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if ((updates as any).city !== undefined) dbUpdates.city = (updates as any).city;
  if ((updates as any).country !== undefined) dbUpdates.country = (updates as any).country;
  if (updates.website !== undefined) dbUpdates.website = updates.website;
  if ((updates as any).industry !== undefined) dbUpdates.industry = (updates as any).industry;
  if ((updates as any).profilePhotoUri !== undefined) dbUpdates.profile_photo_uri = (updates as any).profilePhotoUri;
  if ((updates as any).frontImageUri !== undefined) dbUpdates.front_image_uri = (updates as any).frontImageUri;
  if ((updates as any).backImageUri !== undefined) dbUpdates.back_image_uri = (updates as any).backImageUri;
  if (updates.fileUri !== undefined) dbUpdates.file_uri = updates.fileUri;
  if (updates.fileType !== undefined) dbUpdates.file_type = updates.fileType;
  if (updates.additionalDetails !== undefined) dbUpdates.additional_details = JSON.stringify(updates.additionalDetails);
  
  await db
    .update(personalCard)
    .set(dbUpdates)
    .where(eq(personalCard.id, id));

  return getPersonalCard(id);
}

export async function deletePersonalCard(id: string): Promise<boolean> {
  await db.delete(personalCard).where(eq(personalCard.id, id));
  
  // If we deleted the active card, activate another one if available
  const remaining = await getAllPersonalCards();
  if (remaining.length > 0) {
    await setActivePersonalCard(remaining[0].id);
  }
  
  return true;
}

// Backward compatibility - return first card if exists
export async function getFirstPersonalCard(): Promise<UserPersonalCard | null> {
  return getActivePersonalCard();
}

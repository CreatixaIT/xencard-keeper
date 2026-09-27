import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  person_name: text('person_name').notNull(),
  company_name: text('company_name').notNull(),
  job_title: text('job_title'),
  email: text('email'),
  phone: text('phone'),
  alternate_phone: text('alternate_phone'),
  whatsapp_number: text('whatsapp_number'),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  website: text('website'),
  industry: text('industry').notNull(),
  notes: text('notes'),
  raw_ocr_text: text('raw_ocr_text'),
  card_image_uri: text('card_image_uri').notNull(),
  back_image_uri: text('back_image_uri'),
  thumbnail_uri: text('thumbnail_uri'),
  sync_status: text('sync_status').notNull().default('pending'),
  created_timestamp: integer('created_timestamp').notNull(),
  updated_timestamp: integer('updated_timestamp'),
});

export const personalCard = sqliteTable('personal_card', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  company_name: text('company_name').notNull(),
  full_name: text('full_name').notNull(),
  designation: text('designation').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  alternate_phone: text('alternate_phone'),
  whatsapp_number: text('whatsapp_number'),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  website: text('website'),
  industry: text('industry'),
  profile_photo_uri: text('profile_photo_uri'),
  front_image_uri: text('front_image_uri'),
  back_image_uri: text('back_image_uri'),
  file_uri: text('file_uri'),
  file_type: text('file_type'),
  additional_details: text('additional_details'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sync_status: text('sync_status').notNull().default('pending'),
  created_timestamp: integer('created_timestamp').notNull(),
  updated_timestamp: integer('updated_timestamp').notNull(),
});

export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  xencard_id: text('xencard_id').notNull().unique(),
  full_name: text('full_name').notNull(),
  designation: text('designation').notNull(),
  date_of_birth: text('date_of_birth').notNull(),
  company: text('company'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  address: text('address'),
  card_limit: integer('card_limit').notNull().default(100),
  referral_code: text('referral_code').notNull().unique(),
  referred_by: text('referred_by'),
  sync_status: text('sync_status').notNull().default('pending'),
  created_timestamp: integer('created_timestamp').notNull(),
  updated_timestamp: integer('updated_timestamp').notNull(),
});

export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  referrer_id: text('referrer_id').notNull(),
  referred_user_id: text('referred_user_id').notNull().unique(),
  referral_code: text('referral_code').notNull(),
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(false),
  card_limit_increase: integer('card_limit_increase').notNull().default(20),
  sync_status: text('sync_status').notNull().default('pending'),
  created_timestamp: integer('created_timestamp').notNull(),
  confirmed_timestamp: integer('confirmed_timestamp'),
});

export const scanHistory = sqliteTable('scan_history', {
  id: text('id').primaryKey(),
  contact_id: text('contact_id').notNull(),
  scan_timestamp: integer('scan_timestamp').notNull(),
  ocr_success: integer('ocr_success', { mode: 'boolean' }).notNull(),
  processing_time: integer('processing_time'),
});

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updated_timestamp: integer('updated_timestamp').notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id').notNull(),
  action: text('action').notNull(),
  data: text('data'),
  queued_timestamp: integer('queued_timestamp').notNull(),
  retry_count: integer('retry_count').notNull(),
  status: text('status').notNull(),
});

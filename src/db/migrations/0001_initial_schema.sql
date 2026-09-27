-- Initial schema for Xencard Keeper
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  person_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  address TEXT,
  website TEXT,
  industry TEXT NOT NULL,
  raw_ocr_text TEXT,
  card_image_uri TEXT NOT NULL,
  created_timestamp INTEGER NOT NULL,
  updated_timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS personal_card (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  website TEXT,
  file_uri TEXT NOT NULL,
  file_type TEXT NOT NULL,
  additional_details TEXT,
  created_timestamp INTEGER NOT NULL,
  updated_timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  xencard_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  card_limit INTEGER NOT NULL DEFAULT 100,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  created_timestamp INTEGER NOT NULL,
  updated_timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0,
  card_limit_increase INTEGER NOT NULL DEFAULT 20,
  created_timestamp INTEGER NOT NULL,
  confirmed_timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  scan_timestamp INTEGER NOT NULL,
  ocr_success INTEGER NOT NULL,
  processing_time INTEGER
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  data TEXT,
  queued_timestamp INTEGER NOT NULL,
  retry_count INTEGER NOT NULL,
  status TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_person_name ON contacts(person_name);
CREATE INDEX IF NOT EXISTS idx_contacts_company_name ON contacts(company_name);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);
CREATE INDEX IF NOT EXISTS idx_contacts_created_timestamp ON contacts(created_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_profile_xencard_id ON user_profile(xencard_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_referral_code ON user_profile(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);

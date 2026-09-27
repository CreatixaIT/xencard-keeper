import { expoSQLite } from './client';

export async function runMigrations() {
  try {
    // Run initial schema
    await expoSQLite.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        person_name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        job_title TEXT,
        email TEXT,
        phone TEXT,
        alternate_phone TEXT,
        whatsapp_number TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        website TEXT,
        industry TEXT NOT NULL,
        notes TEXT,
        raw_ocr_text TEXT,
        card_image_uri TEXT NOT NULL,
        back_image_uri TEXT,
        thumbnail_uri TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_timestamp INTEGER NOT NULL,
        updated_timestamp INTEGER
      );

      CREATE TABLE IF NOT EXISTS personal_card (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        company_name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        designation TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        alternate_phone TEXT,
        whatsapp_number TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        website TEXT,
        industry TEXT,
        profile_photo_uri TEXT,
        front_image_uri TEXT,
        back_image_uri TEXT,
        file_uri TEXT,
        file_type TEXT,
        additional_details TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_timestamp INTEGER NOT NULL,
        updated_timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        xencard_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        designation TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        card_limit INTEGER NOT NULL DEFAULT 100,
        referral_code TEXT NOT NULL UNIQUE,
        referred_by TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_timestamp INTEGER NOT NULL,
        updated_timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        referrer_id TEXT NOT NULL,
        referred_user_id TEXT NOT NULL UNIQUE,
        referral_code TEXT NOT NULL,
        confirmed INTEGER NOT NULL DEFAULT 0,
        card_limit_increase INTEGER NOT NULL DEFAULT 20,
        sync_status TEXT NOT NULL DEFAULT 'pending',
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

      CREATE INDEX IF NOT EXISTS idx_contacts_person_name ON contacts(person_name);
      CREATE INDEX IF NOT EXISTS idx_contacts_company_name ON contacts(company_name);
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);
      CREATE INDEX IF NOT EXISTS idx_contacts_created_timestamp ON contacts(created_timestamp);
      CREATE INDEX IF NOT EXISTS idx_contacts_sync_status ON contacts(sync_status);
      CREATE INDEX IF NOT EXISTS idx_user_profile_xencard_id ON user_profile(xencard_id);
      CREATE INDEX IF NOT EXISTS idx_user_profile_referral_code ON user_profile(referral_code);
      CREATE INDEX IF NOT EXISTS idx_user_profile_sync_status ON user_profile(sync_status);
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_personal_card_is_active ON personal_card(is_active);
    `);

    // Add back_image_uri column if it doesn't exist (for existing databases)
    await expoSQLite.execAsync(`
      ALTER TABLE contacts ADD COLUMN back_image_uri TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    // Add new columns to personal_card for multiple card support
    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN alternate_phone TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN city TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN country TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN industry TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN front_image_uri TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN back_image_uri TEXT;
    `).catch(() => {
      // Column already exists, ignore error
    });

    await expoSQLite.execAsync(`
      ALTER TABLE personal_card ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
    `).catch(() => {
      // Column already exists, ignore error
    });

    console.warn('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

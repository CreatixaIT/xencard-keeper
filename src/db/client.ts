import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { runMigrations } from './migrations';

const dbName = 'xencard.db';

export const expoSQLite = SQLite.openDatabaseSync(dbName);

export const db = drizzle(expoSQLite, { schema });

export async function initializeDatabase() {
  await runMigrations();
  console.warn('Database initialized');
}

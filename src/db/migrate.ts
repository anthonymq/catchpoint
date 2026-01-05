import { db } from './client';
import migrations from '../../drizzle/migrations';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

export async function runMigrations(): Promise<void> {
  try {
    console.log('[DB] Running migrations...');
    await migrate(db, migrations);
    console.log('[DB] Migrations completed successfully');
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    throw error;
  }
}

import { Platform } from 'react-native';
import { db } from './client';
import migrations from '../../drizzle/migrations';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

export async function runMigrations(): Promise<void> {
  // Skip migrations on web - database is mocked
  if (Platform.OS === 'web') {
    console.warn('[DB] Skipping migrations on web platform');
    return;
  }

  try {
    console.log('[DB] Running migrations...');
    await migrate(db, migrations);
    console.log('[DB] Migrations completed successfully');
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    throw error;
  }
}

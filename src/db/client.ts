import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const dbName = 'catchpoint.db';

// Open database synchronously (preferred for Expo)
const expo = openDatabaseSync(dbName);

// Create Drizzle instance
export const db = drizzle(expo);

// For debugging - log database name
if (__DEV__) {
  console.log('[DB] Database name:', dbName);
}

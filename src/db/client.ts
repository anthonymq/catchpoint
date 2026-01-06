import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';

const dbName = 'catchpoint.db';

// Platform-specific database initialization
// Web doesn't support expo-sqlite, so we create a mock for web platforms
let db: ReturnType<typeof drizzle>;

if (Platform.OS === 'web') {
  // Mock database for web - create a stub that won't crash
  // In production, you'd want to use IndexedDB or a web-compatible solution
  console.warn('[DB] Running on web - database features are limited');
  
  // Create a minimal mock that satisfies the Drizzle type
  const mockDb = {
    run: () => {},
    all: () => [],
    get: () => null,
  } as any;
  
  db = drizzle(mockDb);
} else {
  // Native platforms use expo-sqlite normally
  const expo = openDatabaseSync(dbName);
  db = drizzle(expo);
  
  if (__DEV__) {
    console.log('[DB] Database name:', dbName);
  }
}

export { db };

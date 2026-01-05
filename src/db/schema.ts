import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Catches table - main entity for fishing log entries
export const catches = sqliteTable('catches', {
  // Primary key - UUID
  id: text('id').primaryKey(),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),

  // Location (required - captured on quick capture)
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),

  // Weather (nullable - backfilled when online)
  temperature: real('temperature'),
  temperatureUnit: text('temperature_unit').default('C'), // 'C' | 'F'
  weatherCondition: text('weather_condition'),
  pressure: real('pressure'), // Barometric pressure in hPa
  pressureUnit: text('pressure_unit').default('hPa'), // 'hPa' | 'inHg'
  humidity: real('humidity'),
  windSpeed: real('wind_speed'),
  weatherFetchedAt: integer('weather_fetched_at', { mode: 'timestamp' }),

  // Catch details (user-entered, optional - for Phase 2)
  species: text('species'),
  weight: real('weight'),
  weightUnit: text('weight_unit').default('kg'), // 'kg' | 'lb'
  length: real('length'),
  lengthUnit: text('length_unit').default('cm'), // 'cm' | 'in'
  lure: text('lure'),
  notes: text('notes'),
  photoUri: text('photo_uri'), // Local file path

  // Status flags
  isDraft: integer('is_draft', { mode: 'boolean' }).default(true),
  pendingWeatherFetch: integer('pending_weather_fetch', { mode: 'boolean' }).default(true),
  syncedAt: integer('synced_at', { mode: 'timestamp' }), // Cloud sync timestamp for Phase 4
});

// Species reference table for autocomplete
export const species = sqliteTable('species', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  commonNames: text('common_names'), // JSON array of aliases
  category: text('category'), // 'freshwater' | 'saltwater' | 'both'
});

// Relations
export const catchesRelations = relations(catches, ({ one }) => ({
  // Future: add relations if needed
}));

export const speciesRelations = relations(species, ({ many }) => ({
  catches: many(catches),
}));

// Type exports for TypeScript
export type Catch = typeof catches.$inferSelect;
export type InsertCatch = typeof catches.$inferInsert;
export type Species = typeof species.$inferSelect;
export type InsertSpecies = typeof species.$inferInsert;

/**
 * Fuzzy Location Service
 *
 * Provides privacy-preserving location functionality by applying
 * consistent random offsets to GPS coordinates before cloud sync.
 *
 * Key principles:
 * - Exact GPS is stored locally only, NEVER sent to cloud
 * - Cloud receives fuzzy coordinates with ~1 mile radius offset
 * - Offset is deterministic based on catch ID (consistent on every call)
 */

export interface FuzzyCoordinates {
  latitude: number;
  longitude: number;
}

// Earth radius in meters
const EARTH_RADIUS_M = 6_371_000;

// Fuzzy offset radius in meters (~1 mile = 1609 meters)
const FUZZY_RADIUS_M = 1609;

/**
 * Simple deterministic hash function for strings.
 * Produces a number between 0 and 1 based on input string.
 */
function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Normalize to 0-1 range
  return Math.abs(hash) / 2147483647;
}

/**
 * Generate two independent pseudo-random values from a catch ID.
 * Uses different seeds for angle and distance to ensure independence.
 */
function getRandomValuesFromId(catchId: string): {
  angleFactor: number;
  distanceFactor: number;
} {
  // Use different suffixes to get independent random values
  const angleFactor = deterministicHash(catchId + "_angle");
  const distanceFactor = deterministicHash(catchId + "_distance");
  return { angleFactor, distanceFactor };
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Apply a fuzzy offset to coordinates.
 *
 * Uses the catch ID to generate a deterministic but seemingly random
 * offset direction and distance (up to ~1 mile radius).
 *
 * @param latitude - Original latitude
 * @param longitude - Original longitude
 * @param catchId - Unique catch identifier for consistent offset
 * @returns Fuzzy coordinates with applied offset
 */
export function applyFuzzyOffset(
  latitude: number,
  longitude: number,
  catchId: string,
): FuzzyCoordinates {
  // Skip fuzzing for invalid coordinates
  if (latitude === 0 && longitude === 0) {
    return { latitude, longitude };
  }

  const { angleFactor, distanceFactor } = getRandomValuesFromId(catchId);

  // Random angle in radians (0 to 2*PI)
  const angle = angleFactor * 2 * Math.PI;

  // Random distance (0 to FUZZY_RADIUS_M)
  // Use square root to ensure uniform distribution across the circle area
  const distance = Math.sqrt(distanceFactor) * FUZZY_RADIUS_M;

  // Convert lat/lon to radians
  const latRad = toRadians(latitude);
  const lonRad = toRadians(longitude);

  // Calculate new position using spherical geometry
  // Distance in radians (angular distance)
  const angularDistance = distance / EARTH_RADIUS_M;

  // Calculate new latitude
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(angle),
  );

  // Calculate new longitude
  const newLonRad =
    lonRad +
    Math.atan2(
      Math.sin(angle) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad),
    );

  return {
    latitude: toDegrees(newLatRad),
    longitude: toDegrees(newLonRad),
  };
}

/**
 * Calculate the distance between two coordinates in meters.
 * Uses the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

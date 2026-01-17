const GRID_SIZE_LAT = 0.45;
const GRID_SIZE_LNG = 0.6;

export interface Region {
  id: string;
  centerLat: number;
  centerLng: number;
  displayName: string;
}

export function getRegionId(lat: number, lng: number): string {
  const gridLat = Math.floor(lat / GRID_SIZE_LAT) * GRID_SIZE_LAT;
  const gridLng = Math.floor(lng / GRID_SIZE_LNG) * GRID_SIZE_LNG;

  const roundedLat = Math.round(gridLat * 10) / 10;
  const roundedLng = Math.round(gridLng * 10) / 10;

  return `${roundedLat}:${roundedLng}`;
}

export function getRegionFromId(regionId: string): Region | null {
  const parts = regionId.split(":");
  if (parts.length !== 2) return null;

  const centerLat = parseFloat(parts[0]);
  const centerLng = parseFloat(parts[1]);

  if (isNaN(centerLat) || isNaN(centerLng)) return null;

  return {
    id: regionId,
    centerLat,
    centerLng,
    displayName: formatRegionName(centerLat, centerLng),
  };
}

export function formatRegionName(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const absLat = Math.abs(lat).toFixed(1);
  const absLng = Math.abs(lng).toFixed(1);

  return `${absLat}°${latDir}, ${absLng}°${lngDir}`;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function areRegionsNearby(
  region1: Region,
  region2: Region,
  maxDistanceKm: number = 100,
): boolean {
  const distance = calculateDistance(
    region1.centerLat,
    region1.centerLng,
    region2.centerLat,
    region2.centerLng,
  );
  return distance <= maxDistanceKm;
}

export function getNearbyRegionIds(
  centerRegionId: string,
  includeAdjacent: boolean = true,
): string[] {
  const region = getRegionFromId(centerRegionId);
  if (!region) return [centerRegionId];

  if (!includeAdjacent) {
    return [centerRegionId];
  }

  const regions: string[] = [];

  for (let latOffset = -1; latOffset <= 1; latOffset++) {
    for (let lngOffset = -1; lngOffset <= 1; lngOffset++) {
      const newLat = region.centerLat + latOffset * GRID_SIZE_LAT;
      const newLng = region.centerLng + lngOffset * GRID_SIZE_LNG;
      regions.push(getRegionId(newLat, newLng));
    }
  }

  return [...new Set(regions)];
}

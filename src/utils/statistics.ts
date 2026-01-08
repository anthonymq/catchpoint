import { Catch } from '../db/schema';

export interface CatchStatistics {
  totalCatches: number;
  totalWeight: number;
  averageWeight: number;
  biggestCatch: { weight: number; species: string | null; date: Date } | null;
  topSpecies: { species: string; count: number }[];
  catchesByMonth: { month: string; count: number }[];
  catchesByWeather: { condition: string; count: number }[];
  catchesByHour: { hour: number; count: number }[];
  bestDay: { date: string; count: number } | null;
  uniqueLocations: number;
}

/**
 * Calculate comprehensive statistics from an array of catches
 */
export function calculateStatistics(catches: Catch[]): CatchStatistics {
  if (catches.length === 0) {
    return {
      totalCatches: 0,
      totalWeight: 0,
      averageWeight: 0,
      biggestCatch: null,
      topSpecies: [],
      catchesByMonth: [],
      catchesByWeather: [],
      catchesByHour: [],
      bestDay: null,
      uniqueLocations: 0,
    };
  }

  // Total catches
  const totalCatches = catches.length;

  // Weight calculations (only for catches with weight)
  const catchesWithWeight = catches.filter((c) => c.weight !== null && c.weight > 0);
  const totalWeight = catchesWithWeight.reduce((sum, c) => sum + (c.weight || 0), 0);
  const averageWeight = catchesWithWeight.length > 0 ? totalWeight / catchesWithWeight.length : 0;

  // Biggest catch
  let biggestCatch: CatchStatistics['biggestCatch'] = null;
  if (catchesWithWeight.length > 0) {
    const biggest = catchesWithWeight.reduce((max, c) => 
      (c.weight || 0) > (max.weight || 0) ? c : max
    );
    biggestCatch = {
      weight: biggest.weight || 0,
      species: biggest.species,
      date: biggest.createdAt,
    };
  }

  // Top species
  const speciesCount = new Map<string, number>();
  catches.forEach((c) => {
    if (c.species) {
      speciesCount.set(c.species, (speciesCount.get(c.species) || 0) + 1);
    }
  });
  const topSpecies = Array.from(speciesCount.entries())
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Catches by month
  const monthCount = new Map<string, number>();
  catches.forEach((c) => {
    const date = new Date(c.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthCount.set(monthKey, (monthCount.get(monthKey) || 0) + 1);
  });
  const catchesByMonth = Array.from(monthCount.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Catches by weather condition
  const weatherCount = new Map<string, number>();
  catches.forEach((c) => {
    const condition = c.weatherCondition || 'Unknown';
    weatherCount.set(condition, (weatherCount.get(condition) || 0) + 1);
  });
  const catchesByWeather = Array.from(weatherCount.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);

  // Catches by hour of day
  const hourCount = new Map<number, number>();
  catches.forEach((c) => {
    const hour = new Date(c.createdAt).getHours();
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
  });
  const catchesByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourCount.get(i) || 0,
  }));

  // Best day
  const dayCount = new Map<string, number>();
  catches.forEach((c) => {
    const dateStr = new Date(c.createdAt).toISOString().split('T')[0];
    dayCount.set(dateStr, (dayCount.get(dateStr) || 0) + 1);
  });
  let bestDay: CatchStatistics['bestDay'] = null;
  let maxDayCount = 0;
  dayCount.forEach((count, date) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      bestDay = { date, count };
    }
  });

  // Unique locations (rounded to ~100m precision)
  const locationSet = new Set<string>();
  catches.forEach((c) => {
    const latRounded = Math.round(c.latitude * 1000) / 1000;
    const lngRounded = Math.round(c.longitude * 1000) / 1000;
    locationSet.add(`${latRounded},${lngRounded}`);
  });
  const uniqueLocations = locationSet.size;

  return {
    totalCatches,
    totalWeight,
    averageWeight,
    biggestCatch,
    topSpecies,
    catchesByMonth,
    catchesByWeather,
    catchesByHour,
    bestDay,
    uniqueLocations,
  };
}

/**
 * Filter catches within a date range
 */
export function getCatchesForDateRange(
  catches: Catch[],
  start: Date,
  end: Date
): Catch[] {
  return catches.filter((c) => {
    const catchDate = new Date(c.createdAt);
    return catchDate >= start && catchDate <= end;
  });
}

/**
 * Get date range based on filter type
 */
export function getDateRangeForFilter(filter: 'week' | 'month' | 'year' | 'all'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (filter) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setDate(end.getDate() - 30);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000); // Far enough back to include all catches
      break;
  }

  return { start, end };
}

/**
 * Group catches by species
 */
export function groupCatchesBySpecies(catches: Catch[]): Map<string, Catch[]> {
  const grouped = new Map<string, Catch[]>();
  catches.forEach((c) => {
    const species = c.species || 'Unknown';
    const existing = grouped.get(species) || [];
    grouped.set(species, [...existing, c]);
  });
  return grouped;
}

/**
 * Group catches by month for chart display
 */
export function groupCatchesByMonth(catches: Catch[]): Map<string, Catch[]> {
  const grouped = new Map<string, Catch[]>();
  catches.forEach((c) => {
    const date = new Date(c.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = grouped.get(monthKey) || [];
    grouped.set(monthKey, [...existing, c]);
  });
  return grouped;
}

/**
 * Format month string for display (e.g., "2024-01" -> "Jan 2024")
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Format hour for display (e.g., 14 -> "2 PM")
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

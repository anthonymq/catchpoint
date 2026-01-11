import type { Catch } from "../db";
import { getMoonPhase, type MoonPhaseName, MOON_PHASES } from "./moonPhase";

export type PressureTrend = "Rising" | "Falling" | "Stable" | "Unknown";

export type SkyCondition =
  | "Clear"
  | "Clouds"
  | "Rain"
  | "Snow"
  | "Other"
  | "Unknown";

export interface GoldenHourInsight {
  peakHourStart: number; // 0-23
  peakHourEnd: number; // 0-23
  peakCount: number;
  averageCount: number;
  multiplier: number; // How many times more likely (e.g., 3 = 3x more likely)
  insightText: string; // "You are 3x more likely to catch between 05:00-08:00"
}

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
  // New Phase 4.5 fields
  catchesByMoonPhase: { phase: MoonPhaseName; count: number }[];
  catchesByPressureTrend: { trend: PressureTrend; count: number }[];
  catchesBySkyCondition: {
    condition: SkyCondition;
    count: number;
    icon: string;
  }[];
  goldenHourInsight: GoldenHourInsight | null;
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
      catchesByMoonPhase: MOON_PHASES.map((phase) => ({ phase, count: 0 })),
      catchesByPressureTrend: [],
      catchesBySkyCondition: [],
      goldenHourInsight: null,
    };
  }

  // Total catches
  const totalCatches = catches.length;

  // Weight calculations (only for catches with weight)
  const catchesWithWeight = catches.filter(
    (c) => c.weight !== undefined && c.weight !== null && c.weight > 0,
  );
  const totalWeight = catchesWithWeight.reduce(
    (sum, c) => sum + (c.weight || 0),
    0,
  );
  const averageWeight =
    catchesWithWeight.length > 0 ? totalWeight / catchesWithWeight.length : 0;

  // Biggest catch
  let biggestCatch: CatchStatistics["biggestCatch"] = null;
  if (catchesWithWeight.length > 0) {
    const biggest = catchesWithWeight.reduce((max, c) =>
      (c.weight || 0) > (max.weight || 0) ? c : max,
    );
    biggestCatch = {
      weight: biggest.weight || 0,
      species: biggest.species || null,
      date: biggest.timestamp,
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
    const date = new Date(c.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthCount.set(monthKey, (monthCount.get(monthKey) || 0) + 1);
  });
  const catchesByMonth = Array.from(monthCount.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Catches by weather condition
  const weatherCount = new Map<string, number>();
  catches.forEach((c) => {
    const condition = c.weatherData?.weatherCondition || "Unknown";
    weatherCount.set(condition, (weatherCount.get(condition) || 0) + 1);
  });
  const catchesByWeather = Array.from(weatherCount.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);

  // Catches by hour of day
  const hourCount = new Map<number, number>();
  catches.forEach((c) => {
    const hour = new Date(c.timestamp).getHours();
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
  });
  const catchesByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourCount.get(i) || 0,
  }));

  // Best day
  const dayCount = new Map<string, number>();
  catches.forEach((c) => {
    const dateStr = new Date(c.timestamp).toISOString().split("T")[0];
    dayCount.set(dateStr, (dayCount.get(dateStr) || 0) + 1);
  });
  let bestDay: CatchStatistics["bestDay"] = null;
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

  // Catches by moon phase
  const moonPhaseCount = new Map<MoonPhaseName, number>();
  MOON_PHASES.forEach((phase) => moonPhaseCount.set(phase, 0));
  catches.forEach((c) => {
    const moonInfo = getMoonPhase(new Date(c.timestamp));
    moonPhaseCount.set(
      moonInfo.name,
      (moonPhaseCount.get(moonInfo.name) || 0) + 1,
    );
  });
  const catchesByMoonPhase = MOON_PHASES.map((phase) => ({
    phase,
    count: moonPhaseCount.get(phase) || 0,
  }));

  // Catches by pressure trend (simplified - compare to typical pressure)
  const catchesByPressureTrend = calculatePressureTrendStats(catches);

  // Catches by sky condition
  const catchesBySkyCondition = calculateSkyConditionStats(catches);

  // Golden hour insight
  const goldenHourInsight = calculateGoldenHourInsight(catchesByHour);

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
    catchesByMoonPhase,
    catchesByPressureTrend,
    catchesBySkyCondition,
    goldenHourInsight,
  };
}

/**
 * Filter catches within a date range
 */
export function getCatchesForDateRange(
  catches: Catch[],
  start: Date,
  end: Date,
): Catch[] {
  return catches.filter((c) => {
    const catchDate = new Date(c.timestamp);
    return catchDate >= start && catchDate <= end;
  });
}

/**
 * Get date range based on filter type
 */
export function getDateRangeForFilter(
  filter: "week" | "month" | "year" | "all",
): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (filter) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setDate(end.getDate() - 30);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "all":
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
    const species = c.species || "Unknown";
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
    const date = new Date(c.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = grouped.get(monthKey) || [];
    grouped.set(monthKey, [...existing, c]);
  });
  return grouped;
}

/**
 * Format month string for display (e.g., "2024-01" -> "Jan 2024")
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Format hour for display (e.g., 14 -> "2 PM")
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// ============================================================================
// Phase 4.5: Advanced Statistics Helpers
// ============================================================================

const SKY_CONDITION_ICONS: Record<SkyCondition, string> = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Snow: "❄️",
  Other: "🌤️",
  Unknown: "❓",
};

/**
 * Categorize weather condition string into simplified SkyCondition
 */
function categorizeSkyCondition(weatherCondition: string | null): SkyCondition {
  if (!weatherCondition) return "Unknown";

  const condition = weatherCondition.toLowerCase();

  if (condition.includes("clear") || condition.includes("sun")) {
    return "Clear";
  }
  if (
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("shower")
  ) {
    return "Rain";
  }
  if (condition.includes("snow") || condition.includes("sleet")) {
    return "Snow";
  }
  if (
    condition.includes("cloud") ||
    condition.includes("overcast") ||
    condition.includes("fog") ||
    condition.includes("mist")
  ) {
    return "Clouds";
  }

  return "Other";
}

/**
 * Calculate sky condition statistics from catches
 */
function calculateSkyConditionStats(
  catches: Catch[],
): { condition: SkyCondition; count: number; icon: string }[] {
  const conditionCount = new Map<SkyCondition, number>();

  catches.forEach((c) => {
    const condition = categorizeSkyCondition(
      c.weatherData?.weatherCondition || null,
    );
    conditionCount.set(condition, (conditionCount.get(condition) || 0) + 1);
  });

  // Return sorted by count, filter out zero counts
  return (
    ["Clear", "Clouds", "Rain", "Snow", "Other", "Unknown"] as SkyCondition[]
  )
    .filter((condition) => (conditionCount.get(condition) || 0) > 0)
    .map((condition) => ({
      condition,
      count: conditionCount.get(condition) || 0,
      icon: SKY_CONDITION_ICONS[condition],
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Determine pressure trend based on pressure value
 * Standard pressure is ~1013 hPa. We use simple thresholds:
 * - Rising: > 1020 hPa
 * - Falling: < 1005 hPa
 * - Stable: 1005-1020 hPa
 */
function categorizePressure(
  pressure: number | null | undefined,
): PressureTrend {
  if (pressure === null || pressure === undefined) return "Unknown";

  if (pressure > 1020) return "Rising";
  if (pressure < 1005) return "Falling";
  return "Stable";
}

/**
 * Calculate pressure trend statistics from catches
 */
function calculatePressureTrendStats(
  catches: Catch[],
): { trend: PressureTrend; count: number }[] {
  const trendCount = new Map<PressureTrend, number>();

  catches.forEach((c) => {
    const pressure = c.weatherData?.pressure;
    const trend = categorizePressure(pressure);
    trendCount.set(trend, (trendCount.get(trend) || 0) + 1);
  });

  // Return sorted by count, filter out Unknown if empty
  return (["Rising", "Stable", "Falling", "Unknown"] as PressureTrend[])
    .filter((trend) => (trendCount.get(trend) || 0) > 0)
    .map((trend) => ({
      trend,
      count: trendCount.get(trend) || 0,
    }));
}

/**
 * Calculate golden hour insight from hourly catch data
 * Finds the best 3-hour window and compares to average
 */
function calculateGoldenHourInsight(
  catchesByHour: { hour: number; count: number }[],
): GoldenHourInsight | null {
  const totalCatches = catchesByHour.reduce((sum, h) => sum + h.count, 0);
  if (totalCatches < 5) return null; // Need minimum data

  const averagePerHour = totalCatches / 24;

  // Find best 3-hour window
  let bestStart = 0;
  let bestCount = 0;

  for (let i = 0; i < 24; i++) {
    const windowCount =
      catchesByHour[i].count +
      catchesByHour[(i + 1) % 24].count +
      catchesByHour[(i + 2) % 24].count;

    if (windowCount > bestCount) {
      bestCount = windowCount;
      bestStart = i;
    }
  }

  const peakHourEnd = (bestStart + 3) % 24;
  const multiplier = averagePerHour > 0 ? bestCount / 3 / averagePerHour : 1;

  // Format hours for display
  const formatHour = (h: number) => {
    const suffix = h < 12 ? "AM" : "PM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(hour12).padStart(2, "0")}:00 ${suffix}`;
  };

  const insightText =
    multiplier >= 1.5
      ? `You are ${multiplier.toFixed(1)}x more likely to catch between ${formatHour(bestStart)} - ${formatHour(peakHourEnd)}`
      : `Your catches are evenly distributed throughout the day`;

  return {
    peakHourStart: bestStart,
    peakHourEnd,
    peakCount: bestCount,
    averageCount: averagePerHour,
    multiplier: Math.round(multiplier * 10) / 10,
    insightText,
  };
}

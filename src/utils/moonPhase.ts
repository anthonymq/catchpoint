import SunCalc from 'suncalc';

export type MoonPhaseName = 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter';

export interface MoonPhaseInfo {
  phase: number; // 0-1 value from suncalc
  name: MoonPhaseName;
  icon: string;
  illumination: number; // 0-100%
}

/**
 * Get moon phase information for a given date
 * 
 * Moon phase from suncalc:
 * 0.00 = New Moon
 * 0.25 = First Quarter
 * 0.50 = Full Moon
 * 0.75 = Last Quarter
 * 1.00 = New Moon (cycle complete)
 */
export function getMoonPhase(date: Date): MoonPhaseInfo {
  const moonData = SunCalc.getMoonIllumination(date);
  const phase = moonData.phase;
  
  // Determine phase name based on phase value
  // Each phase spans ~0.125 around its center point
  let name: MoonPhaseName;
  let icon: string;
  
  if (phase < 0.125 || phase >= 0.875) {
    name = 'New Moon';
    icon = '🌑';
  } else if (phase < 0.375) {
    name = 'First Quarter';
    icon = '🌓';
  } else if (phase < 0.625) {
    name = 'Full Moon';
    icon = '🌕';
  } else {
    name = 'Last Quarter';
    icon = '🌗';
  }
  
  return {
    phase,
    name,
    icon,
    illumination: Math.round(moonData.fraction * 100),
  };
}

/**
 * Get all moon phase names for iteration
 */
export const MOON_PHASES: MoonPhaseName[] = [
  'New Moon',
  'First Quarter',
  'Full Moon',
  'Last Quarter',
];

/**
 * Get icon for a moon phase name
 */
export function getMoonPhaseIcon(phaseName: MoonPhaseName): string {
  const icons: Record<MoonPhaseName, string> = {
    'New Moon': '🌑',
    'First Quarter': '🌓',
    'Full Moon': '🌕',
    'Last Quarter': '🌗',
  };
  return icons[phaseName];
}

/**
 * Get color for moon phase (for charts)
 */
export function getMoonPhaseColor(phaseName: MoonPhaseName): string {
  const colors: Record<MoonPhaseName, string> = {
    'New Moon': '#1a1a2e',      // Dark blue-black
    'First Quarter': '#4a6fa5', // Steel blue
    'Full Moon': '#ffd700',     // Gold
    'Last Quarter': '#7b8fa8',  // Muted blue-gray
  };
  return colors[phaseName];
}

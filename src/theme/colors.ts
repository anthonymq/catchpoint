/**
 * CatchPoint Theme Configuration
 * Defines colors for light and dark modes
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;

  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;

  // Accent
  accent: string;
  onAccent: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Borders
  border: string;
  borderLight: string;

  // Shadows
  shadow: string;
  shadowColor: string;

  // Category colors (water type)
  freshwater: string;
  saltwater: string;
  both: string;
}

export const lightTheme: ThemeColors = {
  // Backgrounds
  background: '#F8F9FA',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',

  // Primary (Orange - fishing/nature theme)
  primary: '#FF6B35',
  primaryLight: '#FF8A5C',
  primaryDark: '#E55A2B',
  onPrimary: '#FFFFFF',

  // Accent (Teal - water theme)
  accent: '#2E86AB',
  onAccent: '#FFFFFF',

  // Text
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  textTertiary: '#BDC3C7',
  textInverse: '#FFFFFF',

  // Status
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',

  // Borders
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowColor: 'rgba(0, 0, 0, 0.1)',

  // Category colors
  freshwater: '#27AE60',
  saltwater: '#3498DB',
  both: '#9B59B6',
};

export const darkTheme: ThemeColors = {
  // Backgrounds
  background: '#1A1A2E',
  backgroundSecondary: '#16213E',
  surface: '#0F3460',
  surfaceSecondary: '#1A1A2E',

  // Primary (Orange - stays same for brand consistency)
  primary: '#FF6B35',
  primaryLight: '#FF8A5C',
  primaryDark: '#E55A2B',
  onPrimary: '#FFFFFF',

  // Accent (Teal - water theme)
  accent: '#4ECDC4',
  onAccent: '#1A1A2E',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textTertiary: '#718096',
  textInverse: '#1A1A2E',

  // Status (adjusted for dark mode visibility)
  success: '#2ECC71',
  warning: '#F1C40F',
  error: '#E74C3C',
  info: '#3498DB',

  // Borders
  border: '#2D3748',
  borderLight: '#4A5568',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowColor: 'rgba(0, 0, 0, 0.3)',

  // Category colors (lighter for dark mode)
  freshwater: '#48BB78',
  saltwater: '#63B3ED',
  both: '#B794F4',
};

export const getThemeColors = (mode: ThemeMode, systemDark: boolean): ThemeColors => {
  if (mode === 'system') {
    return systemDark ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

/**
 * Default theme mode based on system preference
 */
export const getDefaultThemeMode = (): ThemeMode => 'system';

/**
 * Theme-aware color helper
 * Returns the appropriate color based on current theme state
 */
export const useThemeColors = (colors: ThemeColors) => {
  return colors;
};

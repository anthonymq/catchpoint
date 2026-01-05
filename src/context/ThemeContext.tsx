import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, ThemeColors, getThemeColors, getDefaultThemeMode } from '../theme/colors';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getDefaultThemeMode());
  const [colors, setColors] = useState<ThemeColors>(() =>
    getThemeColors(themeMode, systemColorScheme === 'dark')
  );

  // Update colors when theme mode or system scheme changes
  useEffect(() => {
    const isSystemDark = systemColorScheme === 'dark';
    const newColors = getThemeColors(themeMode, isSystemDark);
    setColors(newColors);
  }, [themeMode, systemColorScheme]);

  const setThemeModeCallback = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      // If current is 'system', toggle to light
      return 'light';
    });
  }, []);

  const value: ThemeContextType = {
    themeMode,
    colors,
    isDark: themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark'),
    setThemeMode: setThemeModeCallback,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get only colors from theme
 * Useful when you only need the colors object
 */
export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}

/**
 * Hook to get theme mode
 */
export function useThemeMode(): ThemeMode {
  return useTheme().themeMode;
}

/**
 * Hook to check if dark mode is active
 */
export function useIsDark(): boolean {
  return useTheme().isDark;
}

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Catch } from '../db/schema';

export interface ExportOptions {
  includeWeather?: boolean;
  dateFormat?: 'iso' | 'local';
}

/**
 * Generate CSV string from catches array
 */
export function generateCSV(catches: Catch[], options: ExportOptions = {}): string {
  const { includeWeather = true, dateFormat = 'local' } = options;

  // CSV headers
  const baseHeaders = [
    'ID',
    'Date',
    'Time',
    'Latitude',
    'Longitude',
    'Species',
    'Weight',
    'Weight Unit',
    'Length',
    'Length Unit',
    'Lure',
    'Notes',
  ];

  const weatherHeaders = includeWeather
    ? ['Temperature', 'Temp Unit', 'Weather', 'Pressure', 'Pressure Unit', 'Humidity', 'Wind Speed']
    : [];

  const headers = [...baseHeaders, ...weatherHeaders];

  // Helper to escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Format date based on option
  const formatDate = (date: Date): string => {
    if (dateFormat === 'iso') {
      return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date): string => {
    if (dateFormat === 'iso') {
      return date.toISOString().split('T')[1].split('.')[0];
    }
    return date.toLocaleTimeString();
  };

  // Generate rows
  const rows = catches.map((c) => {
    const date = new Date(c.createdAt);
    const baseRow = [
      escapeCSV(c.id),
      escapeCSV(formatDate(date)),
      escapeCSV(formatTime(date)),
      escapeCSV(c.latitude),
      escapeCSV(c.longitude),
      escapeCSV(c.species),
      escapeCSV(c.weight),
      escapeCSV(c.weightUnit),
      escapeCSV(c.length),
      escapeCSV(c.lengthUnit),
      escapeCSV(c.lure),
      escapeCSV(c.notes),
    ];

    const weatherRow = includeWeather
      ? [
          escapeCSV(c.temperature),
          escapeCSV(c.temperatureUnit),
          escapeCSV(c.weatherCondition),
          escapeCSV(c.pressure),
          escapeCSV(c.pressureUnit),
          escapeCSV(c.humidity),
          escapeCSV(c.windSpeed),
        ]
      : [];

    return [...baseRow, ...weatherRow].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Save CSV string to a file and return the file path
 */
export async function saveCSVToFile(csv: string, filename?: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fileName = filename || `catchpoint-export-${timestamp}.csv`;
  
  // Use the new expo-file-system API
  const file = new File(Paths.cache, fileName);
  await file.write(csv);

  console.log('[Export] CSV saved to:', file.uri);
  return file.uri;
}

/**
 * Share a file using the native share sheet
 */
export async function shareFile(filePath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Catches',
    UTI: 'public.comma-separated-values-text',
  });

  console.log('[Export] Share dialog opened');
}

/**
 * Full export flow: generate CSV, save to file, and open share dialog
 */
export async function exportCatchesToCSV(
  catches: Catch[],
  options: ExportOptions = {}
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    if (catches.length === 0) {
      return { success: false, error: 'No catches to export' };
    }

    console.log('[Export] Starting export of', catches.length, 'catches');

    // Generate CSV
    const csv = generateCSV(catches, options);

    // Save to file
    const filePath = await saveCSVToFile(csv);

    // Share the file
    await shareFile(filePath);

    return { success: true, filePath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Export] Failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete an exported file (cleanup)
 */
export async function deleteExportFile(filePath: string): Promise<void> {
  try {
    const file = new File(filePath);
    if (file.exists) {
      await file.delete();
    }
    console.log('[Export] Cleaned up file:', filePath);
  } catch (error) {
    console.warn('[Export] Failed to cleanup file:', error);
  }
}

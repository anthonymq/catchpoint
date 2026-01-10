import type { Catch } from "@/db";

export interface ExportOptions {
  includeWeather?: boolean;
  dateFormat?: "iso" | "local";
}

/**
 * Generate CSV string from catches array
 */
export function generateCSV(
  catches: Catch[],
  options: ExportOptions = {},
): string {
  const { includeWeather = true, dateFormat = "local" } = options;

  // CSV headers
  const baseHeaders = [
    "ID",
    "Date",
    "Time",
    "Latitude",
    "Longitude",
    "Species",
    "Weight (lbs)",
    "Length (in)",
    "Notes",
  ];

  const weatherHeaders = includeWeather
    ? ["Temperature", "Weather", "Humidity", "Wind Speed"]
    : [];

  const headers = [...baseHeaders, ...weatherHeaders];

  // Helper to escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Format date based on option
  const formatDate = (date: Date): string => {
    if (dateFormat === "iso") {
      return date.toISOString().split("T")[0];
    }
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date): string => {
    if (dateFormat === "iso") {
      return date.toISOString().split("T")[1].split(".")[0];
    }
    return date.toLocaleTimeString();
  };

  // Generate rows
  const rows = catches.map((c) => {
    // Dexie returns Dates directly if they were stored as Dates
    const date =
      c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);

    const baseRow = [
      escapeCSV(c.id),
      escapeCSV(formatDate(date)),
      escapeCSV(formatTime(date)),
      escapeCSV(c.latitude),
      escapeCSV(c.longitude),
      escapeCSV(c.species),
      escapeCSV(c.weight),
      escapeCSV(c.length),
      escapeCSV(c.notes),
    ];

    const w = c.weatherData;
    const weatherRow = includeWeather
      ? [
          escapeCSV(w?.main?.temp),
          escapeCSV(w?.weather?.[0]?.description),
          escapeCSV(w?.main?.humidity),
          escapeCSV(w?.wind?.speed),
        ]
      : [];

    return [...baseRow, ...weatherRow].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Trigger a browser download of the catches as CSV
 */
export function downloadCatchesCSV(catches: Catch[]) {
  const csv = generateCSV(catches);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `catchpoint-export-${timestamp}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

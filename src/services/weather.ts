// OpenWeatherMap API integration
// Supports both One Call 3.0 (paid) and Weather API 2.5 (free)

const OPENWEATHERMAP_BASE_URL = "https://api.openweathermap.org/data";

interface OpenWeatherMapConfig {
  apiKey: string;
}

let config: OpenWeatherMapConfig | null = null;

function getApiKey(): string {
  // Use Vite environment variable
  const envApiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
  if (envApiKey) {
    return envApiKey;
  }

  if (config?.apiKey) {
    return config.apiKey;
  }

  console.warn(
    "[Weather] API Key not found. Weather features will be disabled.",
  );
  return "";
}

export interface WeatherData {
  temperature: number;
  temperatureUnit: "C";
  weatherCondition: string | null;
  pressure: number;
  pressureUnit: "hPa";
  humidity: number;
  windSpeed: number;
  fetchedAt: Date;
}

// Free Weather API 2.5 response type
interface Weather25Response {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  dt: number;
  name: string;
}

/**
 * Fetch current weather using the FREE Weather API 2.5
 * This endpoint is available on the free tier.
 */
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No API Key");

  const url = `${OPENWEATHERMAP_BASE_URL}/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Weather] API error:", response.status, errorText);
    throw new Error(
      `Weather API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: Weather25Response = await response.json();

  return {
    temperature: data.main.temp,
    temperatureUnit: "C",
    weatherCondition: data.weather[0]?.main ?? null,
    pressure: data.main.pressure,
    pressureUnit: "hPa",
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    fetchedAt: new Date(),
  };
}

/**
 * Fetch historical weather.
 * NOTE: Historical data requires One Call 3.0 subscription (paid).
 * For free tier, we fall back to current weather if the timestamp is recent,
 * or skip weather fetch for older catches.
 */
export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  timestamp: Date,
): Promise<WeatherData> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No API Key");

  // Check how old the timestamp is
  const now = new Date();
  const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

  // If catch is less than 3 hours old, current weather is close enough
  if (hoursDiff < 3) {
    console.log(
      "[Weather] Catch is recent, using current weather instead of historical",
    );
    return fetchCurrentWeather(latitude, longitude);
  }

  // Try One Call 3.0 timemachine endpoint (requires paid subscription)
  const unixTimestamp = Math.floor(timestamp.getTime() / 1000);
  const url = `${OPENWEATHERMAP_BASE_URL}/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${unixTimestamp}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    // Check if it's an auth error (user doesn't have One Call 3.0 subscription)
    if (response.status === 401) {
      console.warn(
        "[Weather] One Call 3.0 requires paid subscription. Skipping historical fetch.",
      );
      throw new Error(
        "Historical weather requires One Call 3.0 subscription (paid)",
      );
    }

    const errorText = await response.text();
    console.error(
      "[Weather] Historical API error:",
      response.status,
      errorText,
    );
    throw new Error(
      `Historical Weather API error: ${response.status} ${response.statusText}`,
    );
  }

  interface HistoricalResponse {
    data: Array<{
      dt: number;
      temp: number;
      feels_like: number;
      pressure: number;
      humidity: number;
      wind_speed: number;
      weather: Array<{
        id: number;
        main: string;
        description: string;
        icon: string;
      }>;
    }>;
  }

  const data: HistoricalResponse = await response.json();
  const weatherPoint = data.data[0];

  if (!weatherPoint) {
    throw new Error("No historical weather data available");
  }

  return {
    temperature: weatherPoint.temp,
    temperatureUnit: "C",
    weatherCondition: weatherPoint.weather[0]?.main ?? null,
    pressure: weatherPoint.pressure,
    pressureUnit: "hPa",
    humidity: weatherPoint.humidity,
    windSpeed: weatherPoint.wind_speed,
    fetchedAt: new Date(),
  };
}

/**
 * Fetch weather - uses current weather for recent timestamps,
 * attempts historical for older timestamps.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  timestamp?: Date,
): Promise<WeatherData> {
  if (!timestamp) {
    return fetchCurrentWeather(latitude, longitude);
  }

  const now = new Date();
  const minutesDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60);

  // If timestamp is within 30 minutes, just use current weather
  if (minutesDiff < 30) {
    return fetchCurrentWeather(latitude, longitude);
  }

  // Try historical, fall back to current if it fails
  try {
    return await fetchHistoricalWeather(latitude, longitude, timestamp);
  } catch (error) {
    console.warn(
      "[Weather] Historical fetch failed, using current weather as fallback",
      error,
    );
    return fetchCurrentWeather(latitude, longitude);
  }
}

import { describe, it, expect } from "vitest";
import { calculateStatistics, groupCatchesBySpecies } from "./statistics";
import type { Catch } from "../db";
import type { WeatherData } from "../services/weather";

// Helper to create test weather data
const makeWeather = (condition: string, pressure: number): WeatherData => ({
  temperature: 20,
  temperatureUnit: "C",
  weatherCondition: condition,
  pressure,
  pressureUnit: "hPa",
  humidity: 50,
  windSpeed: 5,
  fetchedAt: new Date(),
});

const mockCatches: Catch[] = [
  {
    id: "1",
    timestamp: new Date("2023-05-15T10:00:00"),
    latitude: 40,
    longitude: -74,
    species: "Bass",
    weight: 5,
    pendingWeatherFetch: false,
    weatherData: makeWeather("Clear", 1015),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    timestamp: new Date("2023-05-15T14:00:00"),
    latitude: 40,
    longitude: -74,
    species: "Bass",
    weight: 3,
    pendingWeatherFetch: false,
    weatherData: makeWeather("Clouds", 1010),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    timestamp: new Date("2023-06-20T06:00:00"),
    latitude: 41,
    longitude: -73,
    species: "Trout",
    weight: 2,
    pendingWeatherFetch: false,
    weatherData: makeWeather("Rain", 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("statistics utils", () => {
  describe("calculateStatistics", () => {
    it("should return zero stats for empty catches", () => {
      const stats = calculateStatistics([]);
      expect(stats.totalCatches).toBe(0);
      expect(stats.totalWeight).toBe(0);
      expect(stats.averageWeight).toBe(0);
      expect(stats.biggestCatch).toBeNull();
    });

    it("should calculate basic stats correctly", () => {
      const stats = calculateStatistics(mockCatches);
      expect(stats.totalCatches).toBe(3);
      expect(stats.totalWeight).toBe(10); // 5 + 3 + 2
      expect(stats.averageWeight).toBeCloseTo(3.33, 2); // 10 / 3
    });

    it("should identify biggest catch", () => {
      const stats = calculateStatistics(mockCatches);
      expect(stats.biggestCatch).toEqual({
        weight: 5,
        species: "Bass",
        date: expect.any(Date),
      });
    });

    it("should calculate top species", () => {
      const stats = calculateStatistics(mockCatches);
      expect(stats.topSpecies).toHaveLength(2);
      expect(stats.topSpecies[0]).toEqual({ species: "Bass", count: 2 });
      expect(stats.topSpecies[1]).toEqual({ species: "Trout", count: 1 });
    });

    it("should calculate pressure trends", () => {
      const stats = calculateStatistics(mockCatches);
      // 1015 -> Stable, 1010 -> Stable, 1000 -> Falling
      const stable = stats.catchesByPressureTrend.find(
        (t) => t.trend === "Stable",
      );
      const falling = stats.catchesByPressureTrend.find(
        (t) => t.trend === "Falling",
      );

      expect(stable?.count).toBe(2);
      expect(falling?.count).toBe(1);
    });

    it("should calculate sky conditions", () => {
      const stats = calculateStatistics(mockCatches);
      // Clear, Clouds, Rain
      const clear = stats.catchesBySkyCondition.find(
        (c) => c.condition === "Clear",
      );
      const clouds = stats.catchesBySkyCondition.find(
        (c) => c.condition === "Clouds",
      );
      const rain = stats.catchesBySkyCondition.find(
        (c) => c.condition === "Rain",
      );

      expect(clear?.count).toBe(1);
      expect(clouds?.count).toBe(1);
      expect(rain?.count).toBe(1);
    });
  });

  describe("groupCatchesBySpecies", () => {
    it("should group catches correctly", () => {
      const grouped = groupCatchesBySpecies(mockCatches);
      expect(grouped.size).toBe(2);
      expect(grouped.get("Bass")).toHaveLength(2);
      expect(grouped.get("Trout")).toHaveLength(1);
    });
  });
});

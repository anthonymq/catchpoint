import { describe, expect, it } from "vitest";
import { applyFuzzyOffset, calculateDistanceMeters } from "./fuzzyLocation";

const FUZZY_RADIUS_M = 1609;

describe("fuzzyLocation", () => {
  describe("applyFuzzyOffset", () => {
    it("returns same result for same catchId (deterministic)", () => {
      const catchId = "test-catch-123";
      const lat = 45.5231;
      const lon = -122.6765;

      const result1 = applyFuzzyOffset(lat, lon, catchId);
      const result2 = applyFuzzyOffset(lat, lon, catchId);

      expect(result1.latitude).toBe(result2.latitude);
      expect(result1.longitude).toBe(result2.longitude);
    });

    it("returns different results for different catchIds", () => {
      const lat = 45.5231;
      const lon = -122.6765;

      const result1 = applyFuzzyOffset(lat, lon, "catch-a");
      const result2 = applyFuzzyOffset(lat, lon, "catch-b");

      expect(result1.latitude).not.toBe(result2.latitude);
      expect(result1.longitude).not.toBe(result2.longitude);
    });

    it("applies offset within ~1 mile radius", () => {
      const lat = 45.5231;
      const lon = -122.6765;
      const catchId = "test-catch-456";

      const result = applyFuzzyOffset(lat, lon, catchId);
      const distance = calculateDistanceMeters(
        lat,
        lon,
        result.latitude,
        result.longitude,
      );

      expect(distance).toBeLessThanOrEqual(FUZZY_RADIUS_M);
      expect(distance).toBeGreaterThan(0);
    });

    it("skips fuzzing for (0,0) coordinates", () => {
      const result = applyFuzzyOffset(0, 0, "any-catch-id");

      expect(result.latitude).toBe(0);
      expect(result.longitude).toBe(0);
    });

    it("handles edge cases near poles", () => {
      const result = applyFuzzyOffset(89.9, 0, "north-pole-catch");

      expect(result.latitude).toBeGreaterThan(88);
      expect(result.latitude).toBeLessThanOrEqual(90);
    });

    it("handles edge cases near date line", () => {
      const result = applyFuzzyOffset(0, 179.9, "dateline-catch");

      expect(result.longitude).toBeDefined();
      expect(typeof result.longitude).toBe("number");
    });
  });

  describe("calculateDistanceMeters", () => {
    it("returns 0 for same coordinates", () => {
      const distance = calculateDistanceMeters(
        45.5231,
        -122.6765,
        45.5231,
        -122.6765,
      );
      expect(distance).toBe(0);
    });

    it("calculates distance correctly", () => {
      const newYorkLat = 40.7128;
      const newYorkLon = -74.006;
      const losAngelesLat = 34.0522;
      const losAngelesLon = -118.2437;

      const distance = calculateDistanceMeters(
        newYorkLat,
        newYorkLon,
        losAngelesLat,
        losAngelesLon,
      );

      const expectedDistanceKm = 3935;
      expect(Math.abs(distance / 1000 - expectedDistanceKm)).toBeLessThan(10);
    });
  });

  describe("offset distribution", () => {
    it("produces varied offsets across many catches", () => {
      const lat = 45.5231;
      const lon = -122.6765;
      const uniqueLatitudes = new Set<number>();
      const uniqueLongitudes = new Set<number>();

      for (let i = 0; i < 100; i++) {
        const result = applyFuzzyOffset(lat, lon, `catch-${i}`);
        uniqueLatitudes.add(result.latitude);
        uniqueLongitudes.add(result.longitude);
      }

      expect(uniqueLatitudes.size).toBeGreaterThan(90);
      expect(uniqueLongitudes.size).toBeGreaterThan(90);
    });
  });
});

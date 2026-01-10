import { describe, it, expect } from "vitest";
import { getMoonPhase, getMoonPhaseIcon, getMoonPhaseColor } from "./moonPhase";

describe("moonPhase utils", () => {
  describe("getMoonPhase", () => {
    it("should return correct moon phase for known dates", () => {
      // Known Full Moon: Jan 25, 2024
      const fullMoonDate = new Date("2024-01-25T12:00:00Z");
      const fullMoon = getMoonPhase(fullMoonDate);
      expect(fullMoon.name).toBe("Full Moon");
      expect(fullMoon.icon).toBe("🌕");
      expect(fullMoon.illumination).toBeGreaterThan(95);

      // Known New Moon: Jan 11, 2024
      const newMoonDate = new Date("2024-01-11T12:00:00Z");
      const newMoon = getMoonPhase(newMoonDate);
      expect(newMoon.name).toBe("New Moon");
      expect(newMoon.icon).toBe("🌑");
      expect(newMoon.illumination).toBeLessThan(5);
    });

    it("should return valid illumination percentage", () => {
      const date = new Date();
      const phase = getMoonPhase(date);
      expect(phase.illumination).toBeGreaterThanOrEqual(0);
      expect(phase.illumination).toBeLessThanOrEqual(100);
    });
  });

  describe("getMoonPhaseIcon", () => {
    it("should return correct icons for phases", () => {
      expect(getMoonPhaseIcon("New Moon")).toBe("🌑");
      expect(getMoonPhaseIcon("First Quarter")).toBe("🌓");
      expect(getMoonPhaseIcon("Full Moon")).toBe("🌕");
      expect(getMoonPhaseIcon("Last Quarter")).toBe("🌗");
    });
  });

  describe("getMoonPhaseColor", () => {
    it("should return correct colors for phases", () => {
      expect(getMoonPhaseColor("New Moon")).toBe("#1a1a2e");
      expect(getMoonPhaseColor("Full Moon")).toBe("#ffd700");
    });
  });
});

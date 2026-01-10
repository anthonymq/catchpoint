// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCurrentLocation } from "./location";

describe("location service", () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  const mockStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    };
  })();

  beforeEach(() => {
    // Mock navigator.geolocation
    Object.defineProperty(window.navigator, "geolocation", {
      value: mockGeolocation,
      writable: true,
    });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
    });

    // Reset mocks
    mockGeolocation.getCurrentPosition.mockReset();
    mockStorage.clear();
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fresh location when available", async () => {
    const mockPosition = {
      coords: {
        latitude: 10,
        longitude: 20,
        accuracy: 5,
      },
      timestamp: 1234567890,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
      success(mockPosition);
    });

    const result = await getCurrentLocation();

    expect(result).toEqual({
      latitude: 10,
      longitude: 20,
      accuracy: 5,
      timestamp: 1234567890,
    });

    // Should cache the location
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "catchpoint_last_location",
      expect.any(String),
    );
  });

  it("falls back to cache when fresh location fails", async () => {
    // Setup cache
    const cachedLocation = {
      latitude: 30,
      longitude: 40,
      accuracy: 10,
      timestamp: 100000,
    };
    mockStorage.setItem(
      "catchpoint_last_location",
      JSON.stringify(cachedLocation),
    );

    // Mock failure
    mockGeolocation.getCurrentPosition.mockImplementation(
      (_: any, error: any) => {
        error(new Error("Timeout"));
      },
    );

    const result = await getCurrentLocation();

    expect(result).toEqual(cachedLocation);
  });

  it("returns (0,0) when fresh fails and no cache", async () => {
    // Mock failure
    mockGeolocation.getCurrentPosition.mockImplementation(
      (_: any, error: any) => {
        error(new Error("Timeout"));
      },
    );

    // Ensure cache is empty
    mockStorage.getItem.mockReturnValue(null);

    const result = await getCurrentLocation();

    expect(result.latitude).toBe(0);
    expect(result.longitude).toBe(0);
  });
});

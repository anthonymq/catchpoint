import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./index";
import { catchRepository } from "./repository";

describe("Catch Repository", () => {
  beforeEach(async () => {
    await db.catches.clear();
  });

  it("should add and retrieve a catch", async () => {
    const catchData = {
      id: "test-id-1",
      timestamp: new Date(),
      latitude: 10,
      longitude: 20,
      pendingWeatherFetch: true,
    };

    const id = await catchRepository.add(catchData);
    expect(id).toBe("test-id-1");

    const retrieved = await catchRepository.get(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.latitude).toBe(10);
    expect(retrieved?.createdAt).toBeDefined();
  });

  it("should filter pending weather catches", async () => {
    await catchRepository.add({
      id: "pending-1",
      timestamp: new Date(),
      latitude: 10,
      longitude: 20,
      pendingWeatherFetch: true,
    });

    await catchRepository.add({
      id: "completed-1",
      timestamp: new Date(),
      latitude: 10,
      longitude: 20,
      pendingWeatherFetch: false,
    });

    const pending = await catchRepository.getPendingWeather();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe("pending-1");
  });

  it("should update a catch", async () => {
    const id = "update-test";
    await catchRepository.add({
      id,
      timestamp: new Date(),
      latitude: 10,
      longitude: 20,
      pendingWeatherFetch: true,
    });

    await catchRepository.update(id, { species: "Bass" });
    const updated = await catchRepository.get(id);
    expect(updated?.species).toBe("Bass");
  });

  it("should delete a catch", async () => {
    const id = "delete-test";
    await catchRepository.add({
      id,
      timestamp: new Date(),
      latitude: 10,
      longitude: 20,
      pendingWeatherFetch: true,
    });

    await catchRepository.delete(id);
    const deleted = await catchRepository.get(id);
    expect(deleted).toBeUndefined();
  });
});

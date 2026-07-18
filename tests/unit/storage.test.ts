import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getChildName,
  setChildName,
  getSettings,
  setSettings,
  getSessionCount,
  recordSessionComplete,
  recordPhraseSeen,
  getEligibleTopicIds,
} from "@/lib/storage/storage";
import { defaultStorage } from "@/lib/storage/schema";

beforeEach(() => {
  window.localStorage.clear();
});

describe("storage", () => {
  it("returns null for an unset child name, then persists a set name", () => {
    expect(getChildName()).toBeNull();
    setChildName("Asha");
    expect(getChildName()).toBe("Asha");
  });

  it("merges partial settings updates over the defaults", () => {
    expect(getSettings()).toEqual(defaultStorage().settings);
    setSettings({ sfxMuted: true });
    expect(getSettings()).toEqual({ ...defaultStorage().settings, sfxMuted: true });
  });

  it("increments session count on every recordSessionComplete call", () => {
    expect(getSessionCount()).toBe(0);
    recordSessionComplete();
    expect(getSessionCount()).toBe(1);
    recordSessionComplete();
    expect(getSessionCount()).toBe(2);
  });

  it("increments the streak once per calendar day, not per session", () => {
    const first = recordSessionComplete();
    expect(first.streakCount).toBe(1);
    // A second session completed the same day must not double the streak.
    const second = recordSessionComplete();
    expect(second.streakCount).toBe(1);
  });

  it("tracks per-topic phrase history and the no-repeat-5-session window", () => {
    recordPhraseSeen("greet-01", 1);
    expect(getEligibleTopicIds(["greet-01", "food-02"], 3)).toEqual(["food-02"]);
    expect(getEligibleTopicIds(["greet-01", "food-02"], 6)).toEqual(["greet-01", "food-02"]);
  });

  it("falls back to an in-memory store when localStorage.setItem throws (quota exceeded)", async () => {
    vi.resetModules();
    const freshStorage = await import("@/lib/storage/storage");

    const setItemSpy = vi
      .spyOn(Object.getPrototypeOf(window.localStorage), "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

    expect(() => freshStorage.setChildName("Priya")).not.toThrow();
    expect(freshStorage.getChildName()).toBe("Priya");

    setItemSpy.mockRestore();
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { getMemories, recordMemory } from "@/lib/storage/storage";
import { MAX_MEMORIES, MEMORY_MAX_LENGTH, STORAGE_KEY } from "@/lib/storage/schema";
import { selectActivity } from "@/lib/activity";

describe("memories", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores what the child revealed and reads it back in order", () => {
    recordMemory("loves dosa", 1);
    recordMemory("has a toy elephant called Bunny", 2);

    expect(getMemories()).toEqual(["loves dosa", "has a toy elephant called Bunny"]);
  });

  it("ignores repeats so a favourite doesn't crowd out everything else", () => {
    recordMemory("loves dosa", 1);
    recordMemory("  Loves Dosa  ", 4);

    expect(getMemories()).toEqual(["loves dosa"]);
  });

  it("ignores blank memories", () => {
    recordMemory("   ", 1);
    expect(getMemories()).toEqual([]);
  });

  it("keeps only the most recent MAX_MEMORIES, dropping the oldest", () => {
    for (let i = 0; i < MAX_MEMORIES + 5; i++) {
      recordMemory(`fact ${i}`, 1);
    }

    const memories = getMemories();
    expect(memories).toHaveLength(MAX_MEMORIES);
    expect(memories[0]).toBe("fact 5");
    expect(memories.at(-1)).toBe(`fact ${MAX_MEMORIES + 4}`);
  });

  it("truncates an over-long memory rather than storing it whole", () => {
    recordMemory("x".repeat(MEMORY_MAX_LENGTH + 50), 1);
    expect(getMemories()[0]).toHaveLength(MEMORY_MAX_LENGTH);
  });

  it("survives storage written before memories existed", () => {
    // A payload saved by the previous version — no `memories` key at all.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        child: { name: "Asha", createdAt: new Date().toISOString() },
        sessions: { count: 3, lastSessionAt: null, streakCount: 3, streakLastDate: null },
        phraseHistory: {},
        settings: { voiceEnabled: true, exchangeTarget: 4, captionsEnabled: false, sfxMuted: false },
      }),
    );

    expect(getMemories()).toEqual([]);
    recordMemory("loves dosa", 4);
    expect(getMemories()).toEqual(["loves dosa"]);
  });
});

describe("selectActivity", () => {
  it("opens a child's very first session with the gentlest format", () => {
    expect(selectActivity(1)).toBe("chat");
  });

  it("rotates so consecutive sessions never repeat a format", () => {
    const activities = [1, 2, 3, 4, 5, 6].map(selectActivity);
    expect(activities).toEqual(["chat", "game", "story", "chat", "game", "story"]);
  });
});

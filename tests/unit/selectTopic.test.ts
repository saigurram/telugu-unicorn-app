import { describe, expect, it } from "vitest";
import { selectTopic } from "@/lib/topics/selectTopic";
import type { PhraseHistoryEntry } from "@/lib/storage/schema";
import type { Topic } from "@/types";

function makeTopic(id: string): Topic {
  return {
    id,
    category: "test",
    teluguPhrase: id,
    transliteration: id,
    englishGloss: id,
    difficulty: 1,
    promptHint: "",
  };
}

const topics = [makeTopic("a"), makeTopic("b"), makeTopic("c")];

describe("selectTopic", () => {
  it("picks any topic when there is no history", () => {
    const picked = selectTopic(topics, {}, 1, () => 0);
    expect(picked.id).toBe("a");
  });

  it("excludes a topic seen within the last 5 sessions", () => {
    const history: Record<string, PhraseHistoryEntry> = {
      a: { lastSeenSession: 4, timesSeen: 1 },
    };
    // currentSession=5: 5-4=1 < 5, so "a" is still ineligible.
    // rand() always returns 0 -> first eligible item, which must not be "a".
    const picked = selectTopic(topics, history, 5, () => 0);
    expect(picked.id).not.toBe("a");
  });

  it("makes a topic eligible again once 5+ sessions have passed", () => {
    const history: Record<string, PhraseHistoryEntry> = {
      a: { lastSeenSession: 1, timesSeen: 1 },
      b: { lastSeenSession: 1, timesSeen: 1 },
      c: { lastSeenSession: 1, timesSeen: 1 },
    };
    // currentSession=6: 6-1=5 >= 5, so all become eligible again.
    const picked = selectTopic(topics, history, 6, () => 0);
    expect(picked.id).toBe("a");
  });

  it("falls back to the full deck when the eligible pool is empty", () => {
    const history: Record<string, PhraseHistoryEntry> = {
      a: { lastSeenSession: 5, timesSeen: 1 },
      b: { lastSeenSession: 5, timesSeen: 1 },
      c: { lastSeenSession: 5, timesSeen: 1 },
    };
    // currentSession=6: nothing is eligible (all seen 1 session ago) —
    // must still return a topic instead of throwing.
    const picked = selectTopic(topics, history, 6, () => 0.5);
    expect(topics.map((t) => t.id)).toContain(picked.id);
  });

  it("throws on an empty topic bank", () => {
    expect(() => selectTopic([], {}, 1)).toThrow();
  });
});

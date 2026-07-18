import type { Topic } from "@/types";
import type { PhraseHistoryEntry } from "@/lib/storage/schema";
import { NO_REPEAT_SESSION_WINDOW } from "@/lib/constants";

/**
 * Pure, seedable-random topic selection: filters to topics not seen within
 * the last NO_REPEAT_SESSION_WINDOW sessions, falling back to the full deck
 * if the eligible pool is ever empty (small deck, child has seen everything
 * recently — better to repeat than to have no topic).
 */
export function selectTopic(
  allTopics: Topic[],
  history: Record<string, PhraseHistoryEntry>,
  currentSession: number,
  rand: () => number = Math.random,
): Topic {
  if (allTopics.length === 0) {
    throw new Error("selectTopic requires a non-empty topic bank");
  }

  const eligible = allTopics.filter((topic) => {
    const entry = history[topic.id];
    if (!entry) return true;
    return currentSession - entry.lastSeenSession >= NO_REPEAT_SESSION_WINDOW;
  });

  const pool = eligible.length > 0 ? eligible : allTopics;
  const index = Math.floor(rand() * pool.length);
  return pool[Math.min(index, pool.length - 1)];
}

import { NO_REPEAT_SESSION_WINDOW } from "@/lib/constants";
import {
  MAX_MEMORIES,
  MEMORY_MAX_LENGTH,
  STORAGE_KEY,
  defaultStorage,
  type AppStorageV1,
} from "./schema";

/**
 * The only module in the app that touches raw localStorage. Falls back to
 * an in-memory store when localStorage is unavailable (SSR, private
 * browsing quota errors) so the app never crashes on storage failure.
 */

let memoryFallback: AppStorageV1 | null = null;

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Local (not UTC) calendar date as YYYY-MM-DD — the streak must track the
 * family's own day boundary, not UTC's. `toISOString()` would misfire for
 * any timezone ahead of UTC during the pre-dawn hours (e.g. IST before
 * 5:30am is still "yesterday" in UTC). */
function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readRaw(): AppStorageV1 {
  if (memoryFallback) return memoryFallback;
  if (!hasLocalStorage()) {
    memoryFallback = defaultStorage();
    return memoryFallback;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStorage();
    const parsed = JSON.parse(raw) as Partial<AppStorageV1>;
    if (parsed.version !== 1) return defaultStorage();
    // Shallow-merge over defaults so a future field addition never crashes
    // on an older stored payload.
    const defaults = defaultStorage();
    return {
      ...defaults,
      ...parsed,
      sessions: { ...defaults.sessions, ...parsed.sessions },
      settings: { ...defaults.settings, ...parsed.settings },
      phraseHistory: { ...defaults.phraseHistory, ...parsed.phraseHistory },
      memories: Array.isArray(parsed.memories) ? parsed.memories : defaults.memories,
    };
  } catch {
    return defaultStorage();
  }
}

function writeRaw(data: AppStorageV1): void {
  if (!hasLocalStorage()) {
    memoryFallback = data;
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    memoryFallback = null;
  } catch {
    // Quota exceeded or private-browsing restriction — degrade gracefully
    // by keeping state in memory for the rest of the session.
    memoryFallback = data;
  }
}

export function getStorage(): AppStorageV1 {
  return readRaw();
}

export function setStorage(partial: Partial<AppStorageV1>): AppStorageV1 {
  const next = { ...readRaw(), ...partial };
  writeRaw(next);
  return next;
}

export function getChildName(): string | null {
  return readRaw().child?.name ?? null;
}

export function setChildName(name: string): void {
  const data = readRaw();
  writeRaw({
    ...data,
    child: { name, createdAt: data.child?.createdAt ?? new Date().toISOString() },
  });
}

export function getSettings() {
  return readRaw().settings;
}

export function setSettings(partial: Partial<AppStorageV1["settings"]>): void {
  const data = readRaw();
  writeRaw({ ...data, settings: { ...data.settings, ...partial } });
}

export function getSessionCount(): number {
  return readRaw().sessions.count;
}

/** Call once when a session reaches CELEBRATION. Advances session count
 * and the daily streak (streak increments once per calendar day). */
export function recordSessionComplete(): { sessionCount: number; streakCount: number } {
  const data = readRaw();
  const today = localDateString(new Date());
  const alreadyCountedToday = data.sessions.streakLastDate === today;
  const streakCount = alreadyCountedToday
    ? data.sessions.streakCount
    : data.sessions.streakCount + 1;

  const next: AppStorageV1 = {
    ...data,
    sessions: {
      count: data.sessions.count + 1,
      lastSessionAt: new Date().toISOString(),
      streakCount,
      streakLastDate: today,
    },
  };
  writeRaw(next);
  return { sessionCount: next.sessions.count, streakCount: next.sessions.streakCount };
}

export function recordPhraseSeen(topicId: string, sessionNumber: number): void {
  const data = readRaw();
  const existing = data.phraseHistory[topicId];
  writeRaw({
    ...data,
    phraseHistory: {
      ...data.phraseHistory,
      [topicId]: {
        lastSeenSession: sessionNumber,
        timesSeen: (existing?.timesSeen ?? 0) + 1,
      },
    },
  });
}

/** Topic ids not seen within the last NO_REPEAT_SESSION_WINDOW sessions. */
export function getEligibleTopicIds(allIds: string[], currentSession: number): string[] {
  const { phraseHistory } = readRaw();
  return allIds.filter((id) => {
    const entry = phraseHistory[id];
    if (!entry) return true;
    return currentSession - entry.lastSeenSession >= NO_REPEAT_SESSION_WINDOW;
  });
}

export function getPhraseHistory(): AppStorageV1["phraseHistory"] {
  return readRaw().phraseHistory;
}

/** Newest-last list of things she's told Mila, for the system prompt. */
export function getMemories(): string[] {
  return readRaw().memories.map((entry) => entry.text);
}

/**
 * Store one new fact about the child. Duplicates are ignored (case- and
 * whitespace-insensitive) so Mila re-mentioning a favourite across sessions
 * doesn't crowd the list, and the oldest fall off once MAX_MEMORIES is hit.
 */
export function recordMemory(text: string, sessionNumber: number): void {
  const trimmed = text.trim().slice(0, MEMORY_MAX_LENGTH);
  if (!trimmed) return;

  const data = readRaw();
  const normalized = trimmed.toLowerCase();
  if (data.memories.some((entry) => entry.text.trim().toLowerCase() === normalized)) return;

  const memories = [...data.memories, { text: trimmed, session: sessionNumber }].slice(
    -MAX_MEMORIES,
  );
  writeRaw({ ...data, memories });
}

import { NO_REPEAT_SESSION_WINDOW } from "@/lib/constants";
import { STORAGE_KEY, defaultStorage, type AppStorageV1 } from "./schema";

/**
 * The only module in the app that touches raw localStorage. Falls back to
 * an in-memory store when localStorage is unavailable (SSR, private
 * browsing quota errors) so the app never crashes on storage failure.
 */

let memoryFallback: AppStorageV1 | null = null;

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
  const today = new Date().toISOString().slice(0, 10);
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

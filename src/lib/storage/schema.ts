export interface PhraseHistoryEntry {
  lastSeenSession: number;
  timesSeen: number;
}

export interface MemoryEntry {
  text: string;
  session: number;
}

/** Keep the store small and the prompt focused — older facts age out. */
export const MAX_MEMORIES = 40;
export const MEMORY_MAX_LENGTH = 140;

export interface AppStorageV1 {
  version: 1;
  child: {
    name: string;
    createdAt: string;
  } | null;
  sessions: {
    count: number;
    lastSessionAt: string | null;
    streakCount: number;
    streakLastDate: string | null;
  };
  phraseHistory: Record<string, PhraseHistoryEntry>;
  /** Short facts the child has revealed about herself, newest last. Fed
   *  back to Mila so she can open with "you told me you like dosa!". */
  memories: MemoryEntry[];
  settings: {
    voiceEnabled: boolean;
    exchangeTarget: number;
    captionsEnabled: boolean;
    sfxMuted: boolean;
  };
}

export const STORAGE_KEY = "mila:appStorage:v1";

export function defaultStorage(): AppStorageV1 {
  return {
    version: 1,
    child: null,
    sessions: {
      count: 0,
      lastSessionAt: null,
      streakCount: 0,
      streakLastDate: null,
    },
    phraseHistory: {},
    memories: [],
    settings: {
      voiceEnabled: true,
      exchangeTarget: 4,
      captionsEnabled: false,
      sfxMuted: false,
    },
  };
}

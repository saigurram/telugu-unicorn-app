export interface PhraseHistoryEntry {
  lastSeenSession: number;
  timesSeen: number;
}

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
    settings: {
      voiceEnabled: true,
      exchangeTarget: 4,
      captionsEnabled: false,
      sfxMuted: false,
    },
  };
}

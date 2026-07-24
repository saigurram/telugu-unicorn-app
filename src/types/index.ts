export type ConversationPhase =
  | "IDLE"
  | "MILA_SPEAKING"
  | "LISTENING"
  | "TRANSCRIBING"
  | "THINKING"
  | "CELEBRATION"
  | "ERROR";

export type CelebrationLevel = "none" | "small" | "big";

export type ChatRole = "mila" | "child";

export interface ChatTurn {
  role: ChatRole;
  text: string;
}

export interface Topic {
  id: string;
  category: string;
  teluguPhrase: string;
  transliteration: string;
  englishGloss: string;
  difficulty: 1 | 2 | 3;
  promptHint: string;
}

export interface ConverseRequestBody {
  childName: string;
  topic: Topic;
  conversationHistory: ChatTurn[];
  turnCount: number;
  exchangeTarget: number;
}

export interface ConverseResponseBody {
  speech: string;
  childSpokeTelugu: boolean;
  exchangeComplete: boolean;
  celebrationLevel: CelebrationLevel;
  sessionComplete: boolean;
}

export interface TranscribeResponseBody {
  text: string;
}

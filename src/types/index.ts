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

/** What shape today's session takes. Rotating this stops every session
 *  feeling like the same question-and-answer drill. */
export type SessionActivity = "chat" | "game" | "story";

export interface ConverseRequestBody {
  childName: string;
  topic: Topic;
  conversationHistory: ChatTurn[];
  turnCount: number;
  exchangeTarget: number;
  activity: SessionActivity;
  /** Things she's told Mila in past sessions — this is what makes Mila
   *  feel like someone who knows her rather than a stranger each time. */
  memories: string[];
}

export interface ConverseResponseBody {
  speech: string;
  childSpokeTelugu: boolean;
  exchangeComplete: boolean;
  celebrationLevel: CelebrationLevel;
  sessionComplete: boolean;
  /** A new fact worth carrying into future sessions, if she revealed one. */
  remember: string | null;
}

export interface TranscribeResponseBody {
  text: string;
}

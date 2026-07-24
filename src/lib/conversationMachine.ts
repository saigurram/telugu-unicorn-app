import type { CelebrationLevel, ChatTurn, ConversationPhase, Topic } from "@/types";

export interface ConversationState {
  phase: ConversationPhase;
  /** Bumped on every phase entry; async callbacks compare against this to
   * discard stale results from an interrupted prior turn. */
  turnEpoch: number;
  childName: string;
  topic: Topic | null;
  exchangeTarget: number;
  exchangeCount: number;
  history: ChatTurn[];
  milaSpeech: string | null;
  /** Per-turn praise intensity (drives the Mila character's celebrating
   * visual/SFX overlay while she reacts) — distinct from the CELEBRATION
   * phase, which is the session-end screen. */
  celebrationLevel: CelebrationLevel;
  /** Set when the current Mila turn is the session's closing goodbye;
   * once its playback ends, the phase advances to CELEBRATION instead
   * of back to LISTENING. */
  sessionComplete: boolean;
  errorMessage: string | null;
  /** Phase to return to when the user retries after an ERROR. */
  recoveryPhase: ConversationPhase;
}

export type ConversationAction =
  | { type: "START_SESSION"; childName: string; topic: Topic; exchangeTarget: number }
  | {
      type: "MILA_REPLY_READY";
      speech: string;
      celebrationLevel: CelebrationLevel;
      exchangeComplete: boolean;
      sessionComplete: boolean;
    }
  | { type: "MILA_PLAYBACK_ENDED" }
  | { type: "CHILD_RECORDING_COMPLETE" }
  | { type: "TRANSCRIPT_READY"; text: string }
  | { type: "CELEBRATION_FINISHED" }
  | { type: "END_SESSION_EARLY" }
  | { type: "ERROR"; message: string; recoveryPhase: ConversationPhase }
  | { type: "RETRY" };

export const initialConversationState: ConversationState = {
  phase: "IDLE",
  turnEpoch: 0,
  childName: "",
  topic: null,
  exchangeTarget: 4,
  exchangeCount: 0,
  history: [],
  milaSpeech: null,
  celebrationLevel: "none",
  sessionComplete: false,
  errorMessage: null,
  recoveryPhase: "IDLE",
};

/**
 * Legal phase transitions, keyed by origin phase. A same-phase "transition"
 * (to === from) is always legal and not listed. ERROR is reachable from
 * any phase and is not listed here either.
 */
const TRANSITION_TABLE: Record<ConversationPhase, ConversationPhase[]> = {
  IDLE: ["THINKING"],
  THINKING: ["MILA_SPEAKING"],
  MILA_SPEAKING: ["LISTENING", "CELEBRATION"],
  LISTENING: ["TRANSCRIBING"],
  TRANSCRIBING: ["THINKING"],
  CELEBRATION: ["IDLE"],
  ERROR: ["THINKING", "MILA_SPEAKING", "IDLE"],
};

function assertLegalTransition(from: ConversationPhase, to: ConversationPhase) {
  if (to === "ERROR" || to === from) return;
  const allowed = TRANSITION_TABLE[from];
  if (!allowed.includes(to)) {
    const message = `Illegal conversation phase transition: ${from} -> ${to}`;
    if (process.env.NODE_ENV !== "production") {
      throw new Error(message);
    }
    // In production, never let a bad transition throw in front of the
    // child — log and let the caller's effect no-op instead.
    console.error(message);
  }
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case "START_SESSION": {
      assertLegalTransition(state.phase, "THINKING");
      return {
        ...initialConversationState,
        turnEpoch: state.turnEpoch + 1,
        phase: "THINKING",
        childName: action.childName,
        topic: action.topic,
        exchangeTarget: action.exchangeTarget,
      };
    }

    case "MILA_REPLY_READY": {
      assertLegalTransition(state.phase, "MILA_SPEAKING");
      return {
        ...state,
        phase: "MILA_SPEAKING",
        milaSpeech: action.speech,
        celebrationLevel: action.celebrationLevel,
        sessionComplete: action.sessionComplete,
        exchangeCount: action.exchangeComplete ? state.exchangeCount + 1 : state.exchangeCount,
        history: [...state.history, { role: "mila", text: action.speech }],
      };
    }

    case "MILA_PLAYBACK_ENDED": {
      const next = state.sessionComplete ? "CELEBRATION" : "LISTENING";
      assertLegalTransition(state.phase, next);
      return { ...state, turnEpoch: state.turnEpoch + 1, phase: next };
    }

    case "CHILD_RECORDING_COMPLETE": {
      assertLegalTransition(state.phase, "TRANSCRIBING");
      return { ...state, turnEpoch: state.turnEpoch + 1, phase: "TRANSCRIBING" };
    }

    case "TRANSCRIPT_READY": {
      assertLegalTransition(state.phase, "THINKING");
      const text = action.text.trim().length > 0 ? action.text : "[unclear]";
      return {
        ...state,
        turnEpoch: state.turnEpoch + 1,
        phase: "THINKING",
        history: [...state.history, { role: "child", text }],
      };
    }

    case "END_SESSION_EARLY": {
      // Always end positive, regardless of current phase.
      if (state.phase === "CELEBRATION" || state.phase === "IDLE") return state;
      return { ...state, turnEpoch: state.turnEpoch + 1, phase: "CELEBRATION", sessionComplete: true };
    }

    case "CELEBRATION_FINISHED": {
      assertLegalTransition(state.phase, "IDLE");
      return { ...initialConversationState, turnEpoch: state.turnEpoch + 1 };
    }

    case "ERROR": {
      return {
        ...state,
        turnEpoch: state.turnEpoch + 1,
        phase: "ERROR",
        errorMessage: action.message,
        recoveryPhase: action.recoveryPhase,
      };
    }

    case "RETRY": {
      return {
        ...state,
        turnEpoch: state.turnEpoch + 1,
        phase: state.recoveryPhase,
        errorMessage: null,
      };
    }

    default:
      return state;
  }
}

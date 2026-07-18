import { describe, expect, it } from "vitest";
import {
  conversationReducer,
  initialConversationState,
  type ConversationState,
} from "@/lib/conversationMachine";
import type { Topic } from "@/types";

const topic: Topic = {
  id: "greet-01",
  category: "greetings",
  teluguPhrase: "నమస్కారం",
  transliteration: "namaskaram",
  englishGloss: "hello",
  difficulty: 1,
  promptHint: "greet her",
};

function startedState(): ConversationState {
  return conversationReducer(initialConversationState, {
    type: "START_SESSION",
    childName: "Asha",
    topic,
    exchangeTarget: 4,
  });
}

describe("conversationReducer", () => {
  it("starts a session in THINKING (fetching the greeting)", () => {
    const state = startedState();
    expect(state.phase).toBe("THINKING");
    expect(state.childName).toBe("Asha");
    expect(state.topic).toEqual(topic);
  });

  it("moves THINKING -> MILA_SPEAKING on a reply, appending to history", () => {
    const state = conversationReducer(startedState(), {
      type: "MILA_REPLY_READY",
      speech: "నమస్కారం Asha!",
      celebrationLevel: "none",
      exchangeComplete: false,
      sessionComplete: false,
    });
    expect(state.phase).toBe("MILA_SPEAKING");
    expect(state.milaSpeech).toBe("నమస్కారం Asha!");
    expect(state.history).toEqual([{ role: "mila", text: "నమస్కారం Asha!" }]);
  });

  it("moves MILA_SPEAKING -> LISTENING when playback ends and session is not complete", () => {
    let state = startedState();
    state = conversationReducer(state, {
      type: "MILA_REPLY_READY",
      speech: "hi",
      celebrationLevel: "none",
      exchangeComplete: false,
      sessionComplete: false,
    });
    state = conversationReducer(state, { type: "MILA_PLAYBACK_ENDED" });
    expect(state.phase).toBe("LISTENING");
  });

  it("moves MILA_SPEAKING -> CELEBRATION when the reply was the closing goodbye", () => {
    let state = startedState();
    state = conversationReducer(state, {
      type: "MILA_REPLY_READY",
      speech: "బై బై!",
      celebrationLevel: "big",
      exchangeComplete: true,
      sessionComplete: true,
    });
    state = conversationReducer(state, { type: "MILA_PLAYBACK_ENDED" });
    expect(state.phase).toBe("CELEBRATION");
  });

  it("increments exchangeCount only when exchangeComplete is true", () => {
    let state = startedState();
    state = conversationReducer(state, {
      type: "MILA_REPLY_READY",
      speech: "hi",
      celebrationLevel: "none",
      exchangeComplete: false,
      sessionComplete: false,
    });
    expect(state.exchangeCount).toBe(0);

    state = conversationReducer(state, {
      type: "MILA_REPLY_READY",
      speech: "shabash!",
      celebrationLevel: "small",
      exchangeComplete: true,
      sessionComplete: false,
    });
    expect(state.exchangeCount).toBe(1);
  });

  it("runs the full LISTENING -> TRANSCRIBING -> THINKING loop", () => {
    let state = startedState();
    state = conversationReducer(state, {
      type: "MILA_REPLY_READY",
      speech: "hi",
      celebrationLevel: "none",
      exchangeComplete: false,
      sessionComplete: false,
    });
    state = conversationReducer(state, { type: "MILA_PLAYBACK_ENDED" });
    expect(state.phase).toBe("LISTENING");

    state = conversationReducer(state, { type: "CHILD_RECORDING_COMPLETE" });
    expect(state.phase).toBe("TRANSCRIBING");

    state = conversationReducer(state, { type: "TRANSCRIPT_READY", text: "నేను దోశ తిన్నాను" });
    expect(state.phase).toBe("THINKING");
    expect(state.history.at(-1)).toEqual({ role: "child", text: "నేను దోశ తిన్నాను" });
  });

  it("coerces an empty transcript to [unclear] rather than an empty string", () => {
    let state = startedState();
    state = conversationReducer(state, {
      type: "MILA_REPLY_READY",
      speech: "hi",
      celebrationLevel: "none",
      exchangeComplete: false,
      sessionComplete: false,
    });
    state = conversationReducer(state, { type: "MILA_PLAYBACK_ENDED" });
    state = conversationReducer(state, { type: "CHILD_RECORDING_COMPLETE" });
    state = conversationReducer(state, { type: "TRANSCRIPT_READY", text: "   " });
    expect(state.history.at(-1)).toEqual({ role: "child", text: "[unclear]" });
  });

  it("END_SESSION_EARLY always jumps to CELEBRATION, from any active phase", () => {
    const state = conversationReducer(startedState(), { type: "END_SESSION_EARLY" });
    expect(state.phase).toBe("CELEBRATION");
  });

  it("END_SESSION_EARLY is a no-op once already in CELEBRATION or IDLE", () => {
    const celebrating = conversationReducer(startedState(), { type: "END_SESSION_EARLY" });
    const again = conversationReducer(celebrating, { type: "END_SESSION_EARLY" });
    expect(again.turnEpoch).toBe(celebrating.turnEpoch);
  });

  it("CELEBRATION_FINISHED resets to a fresh initial state", () => {
    const celebrating = conversationReducer(startedState(), { type: "END_SESSION_EARLY" });
    const finished = conversationReducer(celebrating, { type: "CELEBRATION_FINISHED" });
    expect(finished.phase).toBe("IDLE");
    expect(finished.history).toEqual([]);
    expect(finished.childName).toBe("");
  });

  it("ERROR is reachable from any phase and stores a recovery phase", () => {
    const state = conversationReducer(startedState(), {
      type: "ERROR",
      message: "boom",
      recoveryPhase: "THINKING",
    });
    expect(state.phase).toBe("ERROR");
    expect(state.errorMessage).toBe("boom");
    expect(state.recoveryPhase).toBe("THINKING");
  });

  it("RETRY returns to the stored recovery phase and clears the error", () => {
    const errored = conversationReducer(startedState(), {
      type: "ERROR",
      message: "boom",
      recoveryPhase: "THINKING",
    });
    const retried = conversationReducer(errored, { type: "RETRY" });
    expect(retried.phase).toBe("THINKING");
    expect(retried.errorMessage).toBeNull();
  });

  it("bumps turnEpoch on every meaningful phase transition", () => {
    const started = startedState();
    expect(started.turnEpoch).toBeGreaterThan(initialConversationState.turnEpoch);
  });

  it("throws on an illegal transition (dev safety net)", () => {
    // THINKING can only ever advance to MILA_SPEAKING; a stray
    // CHILD_RECORDING_COMPLETE here would mean the UI is out of sync.
    expect(() => conversationReducer(startedState(), { type: "CHILD_RECORDING_COMPLETE" })).toThrow();
  });
});

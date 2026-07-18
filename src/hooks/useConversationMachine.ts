"use client";

import { useCallback, useEffect, useRef, useReducer } from "react";
import {
  conversationReducer,
  initialConversationState,
  type ConversationState,
} from "@/lib/conversationMachine";
import { useAudioPlayer } from "./useAudioPlayer";
import { useAudioRecorder } from "./useAudioRecorder";
import { selectTopic } from "@/lib/topics/selectTopic";
import topicsBank from "@/data/topics.json";
import {
  getPhraseHistory,
  getSessionCount,
  recordPhraseSeen,
  recordSessionComplete,
} from "@/lib/storage/storage";
import { playSfx } from "@/lib/audio/sfx";
import { CELEBRATION_ANIMATION_FALLBACK_MS, PLAYBACK_TO_MIC_SETTLE_MS } from "@/lib/constants";
import type { ConverseRequestBody, ConverseResponseBody, TranscribeResponseBody, Topic } from "@/types";

export function useConversationMachine(childName: string, exchangeTarget: number) {
  const [state, dispatch] = useReducer(conversationReducer, initialConversationState);

  const turnEpochRef = useRef(state.turnEpoch);
  useEffect(() => {
    turnEpochRef.current = state.turnEpoch;
  }, [state.turnEpoch]);

  const audioPlayer = useAudioPlayer();
  const recordedRef = useRef<{ blob: Blob; mimeType: string } | null>(null);

  const handleRecordingComplete = useCallback((blob: Blob, mimeType: string) => {
    recordedRef.current = { blob, mimeType };
    dispatch({ type: "CHILD_RECORDING_COMPLETE" });
  }, []);

  const recorder = useAudioRecorder(handleRecordingComplete);

  const startSession = useCallback(() => {
    const currentSession = getSessionCount() + 1;
    const topic = selectTopic(
      topicsBank.topics as Topic[],
      getPhraseHistory(),
      currentSession,
    );
    recordPhraseSeen(topic.id, currentSession);
    playSfx("chime-open", false);
    dispatch({ type: "START_SESSION", childName, topic, exchangeTarget });
  }, [childName, exchangeTarget]);

  const endSessionEarly = useCallback(() => {
    dispatch({ type: "END_SESSION_EARLY" });
  }, []);

  const retry = useCallback(() => dispatch({ type: "RETRY" }), []);

  const finishCelebration = useCallback(() => dispatch({ type: "CELEBRATION_FINISHED" }), []);

  const manualStopListening = useCallback(() => {
    if (state.phase === "LISTENING") recorder.stop();
  }, [state.phase, recorder]);

  // THINKING: call /api/converse for the next Mila turn (greeting, reply, or closing).
  useEffect(() => {
    if (state.phase !== "THINKING") return;
    const epoch = state.turnEpoch;
    const controller = new AbortController();
    const thinkingHumTimer = setTimeout(() => playSfx("thinking-hum", false), 800);

    const lastTurn = state.history[state.history.length - 1];
    const childUtterance = lastTurn?.role === "child" ? lastTurn.text : "";

    const body: ConverseRequestBody = {
      childName: state.childName,
      topic: state.topic as Topic,
      conversationHistory: state.history,
      turnCount: state.exchangeCount,
      exchangeTarget: state.exchangeTarget,
      childUtterance,
    };

    fetch("/api/converse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then((res) => {
        if (turnEpochRef.current !== epoch) return null;
        if (!res.ok) throw new Error(`converse failed: ${res.status}`);
        return res.json() as Promise<ConverseResponseBody>;
      })
      .then((data) => {
        if (!data || turnEpochRef.current !== epoch) return;
        dispatch({
          type: "MILA_REPLY_READY",
          speech: data.speech,
          celebrationLevel: data.celebrationLevel,
          exchangeComplete: data.exchangeComplete,
          sessionComplete: data.sessionComplete,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted || turnEpochRef.current !== epoch) return;
        dispatch({ type: "ERROR", message: String(err), recoveryPhase: "THINKING" });
      });

    return () => {
      clearTimeout(thinkingHumTimer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.turnEpoch]);

  // MILA_SPEAKING: stream + play Mila's line; celebrate mid-turn if flagged.
  useEffect(() => {
    if (state.phase !== "MILA_SPEAKING" || !state.milaSpeech) return;
    let cancelled = false;

    if (state.celebrationLevel !== "none") {
      playSfx(state.celebrationLevel === "big" ? "sparkle-big" : "sparkle-small", false);
    }

    audioPlayer
      .play(state.milaSpeech)
      .then(() => {
        if (cancelled) return;
        dispatch({ type: "MILA_PLAYBACK_ENDED" });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: "ERROR", message: "playback failed", recoveryPhase: "MILA_SPEAKING" });
      });

    return () => {
      cancelled = true;
      audioPlayer.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.milaSpeech]);

  // LISTENING: settle briefly after playback, then start recording.
  useEffect(() => {
    if (state.phase !== "LISTENING") return;
    const epoch = state.turnEpoch;
    let cancelled = false;

    playSfx("mic-boop", false);
    const settleTimer = setTimeout(() => {
      if (cancelled || turnEpochRef.current !== epoch) return;
      recorder.start().catch(() => {
        if (cancelled) return;
        dispatch({ type: "ERROR", message: "mic failed", recoveryPhase: "MILA_SPEAKING" });
      });
    }, PLAYBACK_TO_MIC_SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(settleTimer);
      recorder.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.turnEpoch]);

  // TRANSCRIBING: send the recorded clip to /api/transcribe.
  useEffect(() => {
    if (state.phase !== "TRANSCRIBING") return;
    const epoch = state.turnEpoch;
    const controller = new AbortController();
    const recorded = recordedRef.current;
    recordedRef.current = null;

    if (!recorded || recorded.blob.size === 0) {
      dispatch({ type: "TRANSCRIPT_READY", text: "" });
      return;
    }

    const form = new FormData();
    form.append("audio", recorded.blob, "audio");

    fetch("/api/transcribe", { method: "POST", body: form, signal: controller.signal })
      .then((res) => {
        if (turnEpochRef.current !== epoch) return null;
        if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
        return res.json() as Promise<TranscribeResponseBody>;
      })
      .then((data) => {
        if (turnEpochRef.current !== epoch) return;
        dispatch({ type: "TRANSCRIPT_READY", text: data?.text ?? "" });
      })
      .catch(() => {
        if (controller.signal.aborted || turnEpochRef.current !== epoch) return;
        // Never surface a transcription error to the child — treat as unclear.
        dispatch({ type: "TRANSCRIPT_READY", text: "" });
      });

    return () => controller.abort();
  }, [state.phase, state.turnEpoch]);

  // CELEBRATION: persist session/streak once; fall back to auto-advancing
  // to IDLE if the character's animationend never fires (backgrounded tab).
  useEffect(() => {
    if (state.phase !== "CELEBRATION") return;
    const epoch = state.turnEpoch;
    playSfx("cheer", false);
    recordSessionComplete();
    const fallback = setTimeout(() => {
      if (turnEpochRef.current !== epoch) return;
      dispatch({ type: "CELEBRATION_FINISHED" });
    }, CELEBRATION_ANIMATION_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [state.phase, state.turnEpoch]);

  return {
    state,
    startSession,
    endSessionEarly,
    retry,
    finishCelebration,
    manualStopListening,
    // Distinct from `state.phase === "LISTENING"`: the phase flips the
    // instant Mila's playback ends, but the mic doesn't actually start
    // until after the settle delay + getUserMedia resolves. The mic
    // button must only be tappable once there's a real recording to stop.
    isRecording: recorder.isRecording,
  };
}

export type { ConversationState };

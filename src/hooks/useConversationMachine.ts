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
import {
  CELEBRATION_ANIMATION_FALLBACK_MS,
  ERROR_RETRY_DELAY_MS,
  MAX_ERROR_RETRIES,
  PLAYBACK_TO_MIC_SETTLE_MS,
} from "@/lib/constants";
import type { ConverseRequestBody, ConverseResponseBody, TranscribeResponseBody, Topic } from "@/types";

export function useConversationMachine(
  childName: string,
  exchangeTarget: number,
  sfxMuted: boolean,
) {
  const [state, dispatch] = useReducer(conversationReducer, initialConversationState);

  const turnEpochRef = useRef(state.turnEpoch);
  useEffect(() => {
    turnEpochRef.current = state.turnEpoch;
  }, [state.turnEpoch]);

  // A ref (not a closure-captured value) so every playSfx() call below —
  // even ones inside effects keyed on phase/epoch rather than this prop —
  // always reads the current mute setting.
  const sfxMutedRef = useRef(sfxMuted);
  useEffect(() => {
    sfxMutedRef.current = sfxMuted;
  }, [sfxMuted]);

  const audioPlayer = useAudioPlayer();
  const recordedRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const errorRetryCountRef = useRef(0);

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
    playSfx("chime-open", sfxMutedRef.current);
    dispatch({ type: "START_SESSION", childName, topic, exchangeTarget });
  }, [childName, exchangeTarget]);

  const endSessionEarly = useCallback(() => {
    dispatch({ type: "END_SESSION_EARLY" });
  }, []);

  const finishCelebration = useCallback(() => dispatch({ type: "CELEBRATION_FINISHED" }), []);

  const manualStopListening = useCallback(() => {
    if (state.phase === "LISTENING") recorder.stop();
  }, [state.phase, recorder]);

  // THINKING: call /api/converse for the next Mila turn (greeting, reply, or closing).
  useEffect(() => {
    if (state.phase !== "THINKING") return;
    const epoch = state.turnEpoch;
    const controller = new AbortController();
    const thinkingHumTimer = setTimeout(() => playSfx("thinking-hum", sfxMutedRef.current), 800);

    const body: ConverseRequestBody = {
      childName: state.childName,
      topic: state.topic as Topic,
      conversationHistory: state.history,
      turnCount: state.exchangeCount,
      exchangeTarget: state.exchangeTarget,
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
      playSfx(state.celebrationLevel === "big" ? "sparkle-big" : "sparkle-small", sfxMutedRef.current);
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

    playSfx("mic-boop", sfxMutedRef.current);
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
    playSfx("cheer", sfxMutedRef.current);
    recordSessionComplete();
    const fallback = setTimeout(() => {
      if (turnEpochRef.current !== epoch) return;
      dispatch({ type: "CELEBRATION_FINISHED" });
    }, CELEBRATION_ANIMATION_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [state.phase, state.turnEpoch]);

  // ERROR: the spec's "never show the child an error state" applies here
  // too — silently retry the failed step a few times (Mila just sits idle
  // meanwhile), and if the failure persists, end the session warmly rather
  // than leaving her stuck or retrying a broken vendor/network forever.
  useEffect(() => {
    if (state.phase !== "ERROR") {
      errorRetryCountRef.current = 0;
      return;
    }
    errorRetryCountRef.current += 1;
    const epoch = state.turnEpoch;

    if (errorRetryCountRef.current > MAX_ERROR_RETRIES) {
      dispatch({ type: "END_SESSION_EARLY" });
      return;
    }

    const timer = setTimeout(() => {
      if (turnEpochRef.current !== epoch) return;
      dispatch({ type: "RETRY" });
    }, ERROR_RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.phase, state.turnEpoch]);

  return {
    state,
    startSession,
    endSessionEarly,
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

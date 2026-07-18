import {
  VAD_HARD_CAP_MS,
  VAD_MIN_RECORDING_MS,
  VAD_SILENCE_MS,
  VAD_SPEECH_RMS_THRESHOLD,
} from "@/lib/constants";

export interface VadSample {
  rms: number;
  timestampMs: number;
}

export interface VadState {
  recordingStartMs: number;
  hasDetectedSpeech: boolean;
  lastSoundMs: number;
}

export function createInitialVadState(nowMs: number): VadState {
  return { recordingStartMs: nowMs, hasDetectedSpeech: false, lastSoundMs: nowMs };
}

/** Pure VAD state reducer — feed it one volume sample at a time. */
export function updateVadState(state: VadState, sample: VadSample): VadState {
  const isSpeech = sample.rms >= VAD_SPEECH_RMS_THRESHOLD;
  if (!isSpeech) return state;
  return { ...state, hasDetectedSpeech: true, lastSoundMs: sample.timestampMs };
}

/**
 * Pure decision function: should recording auto-stop right now?
 * - Never stops before speech has been detected at all (guards against
 *   stopping during the initial silence before the child starts talking).
 * - Stops after a silence gap once speech has been heard AND the minimum
 *   recording length has elapsed (guards against cutting off a single
 *   syllable).
 * - The 15s hard cap always wins regardless of VAD state.
 */
export function shouldAutoStop(state: VadState, nowMs: number): boolean {
  const recordingDurationMs = nowMs - state.recordingStartMs;
  if (recordingDurationMs >= VAD_HARD_CAP_MS) return true;

  if (!state.hasDetectedSpeech) return false;
  if (recordingDurationMs < VAD_MIN_RECORDING_MS) return false;

  const silenceDurationMs = nowMs - state.lastSoundMs;
  return silenceDurationMs >= VAD_SILENCE_MS;
}

/** RMS volume from a Uint8Array of AnalyserNode.getByteTimeDomainData(). */
export function computeRms(timeDomainData: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    const normalized = (timeDomainData[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / timeDomainData.length);
}

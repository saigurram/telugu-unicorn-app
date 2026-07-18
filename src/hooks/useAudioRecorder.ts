"use client";

import { useCallback, useRef, useState } from "react";
import { getSupportedMimeType } from "@/lib/audio/mimeType";
import {
  computeRms,
  createInitialVadState,
  shouldAutoStop,
  updateVadState,
  type VadState,
} from "@/lib/audio/vad";
import { VAD_HARD_CAP_MS, VAD_SAMPLE_INTERVAL_MS } from "@/lib/constants";

export type OnRecordingComplete = (blob: Blob, mimeType: string) => void;

/**
 * MediaRecorder + volume-threshold VAD auto-stop. Manual stop (mic tap),
 * VAD silence detection, and the 15s hard cap all converge on the same
 * `onstop` handler, which fires `onComplete` exactly once per recording.
 */
export function useAudioRecorder(onComplete: OnRecordingComplete) {
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadStateRef = useRef<VadState | null>(null);
  const rafRef = useRef<number | null>(null);
  const hardCapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (hardCapTimeoutRef.current) clearTimeout(hardCapTimeoutRef.current);
    hardCapTimeoutRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const start = useCallback(async () => {
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      // No supported recording format on this browser — treat as an
      // unclear turn rather than surfacing an error to the child.
      onComplete(new Blob(), "audio/webm");
      return;
    }
    mimeTypeRef.current = mimeType;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      cleanup();
      setIsRecording(false);
      onComplete(blob, mimeTypeRef.current);
    };

    recorder.start();
    setIsRecording(true);

    const AudioContextCtor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextCtor();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const startTime = performance.now();
    vadStateRef.current = createInitialVadState(startTime);
    const timeDomainData = new Uint8Array(analyser.fftSize);
    let lastSampleAt = startTime;

    const sample = () => {
      const now = performance.now();
      if (now - lastSampleAt >= VAD_SAMPLE_INTERVAL_MS) {
        lastSampleAt = now;
        analyser.getByteTimeDomainData(timeDomainData);
        const rms = computeRms(timeDomainData);
        vadStateRef.current = updateVadState(vadStateRef.current as VadState, {
          rms,
          timestampMs: now,
        });
        if (shouldAutoStop(vadStateRef.current, now)) {
          stop();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(sample);
    };
    rafRef.current = requestAnimationFrame(sample);

    // Independent hard cap — fires even if the rAF loop stalls (backgrounded tab).
    hardCapTimeoutRef.current = setTimeout(stop, VAD_HARD_CAP_MS);
  }, [cleanup, onComplete, stop]);

  return { isRecording, start, stop };
}

"use client";

import { useCallback, useRef, useState } from "react";

export type PlaybackState = "idle" | "playing" | "ended" | "error";

/**
 * Streaming TTS playback: feature-detects MediaSource Extensions for
 * progressive playback (the real latency win — audio starts before the
 * full response has downloaded). Falls back to full-buffer Blob + <audio>
 * on browsers without audio/mpeg MSE support (older iOS Safari) — TTS
 * utterances are only a few seconds, so the full-buffer wait is small.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlaybackState>("idle");
  const epochRef = useRef(0);

  const getAudioEl = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  const stop = useCallback(() => {
    epochRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState("idle");
  }, []);

  const play = useCallback(
    (text: string, signal?: AbortSignal): Promise<void> => {
      const epoch = ++epochRef.current;
      setState("playing");
      const audio = getAudioEl();

      return fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
      }).then((res) => {
        if (epoch !== epochRef.current) return; // superseded by a later turn
        if (!res.ok || !res.body) {
          setState("error");
          throw new Error(`speak failed: ${res.status}`);
        }

        const canUseMSE =
          typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg");

        return new Promise<void>((resolve, reject) => {
          const finish = (ok: boolean) => {
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            if (epoch !== epochRef.current) return; // stale, ignore
            if (ok) {
              setState("ended");
              resolve();
            } else {
              setState("error");
              reject(new Error("audio playback error"));
            }
          };
          const onEnded = () => finish(true);
          const onError = () => finish(false);
          audio.addEventListener("ended", onEnded);
          audio.addEventListener("error", onError);

          if (canUseMSE) {
            const mediaSource = new MediaSource();
            audio.src = URL.createObjectURL(mediaSource);

            mediaSource.addEventListener(
              "sourceopen",
              () => {
                if (epoch !== epochRef.current) return;
                const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                const reader = res.body!.getReader();

                const pump = (): Promise<void> =>
                  reader.read().then(({ done, value }) => {
                    if (epoch !== epochRef.current) return;
                    if (done) {
                      if (mediaSource.readyState === "open") mediaSource.endOfStream();
                      return;
                    }
                    return new Promise<void>((resolveAppend) => {
                      sourceBuffer.addEventListener("updateend", () => resolveAppend(), {
                        once: true,
                      });
                      sourceBuffer.appendBuffer(value);
                    }).then(pump);
                  });

                pump().catch(() => finish(false));
              },
              { once: true },
            );

            audio.play().catch(() => finish(false));
          } else {
            res
              .arrayBuffer()
              .then((buf) => {
                if (epoch !== epochRef.current) return;
                const blob = new Blob([buf], { type: "audio/mpeg" });
                audio.src = URL.createObjectURL(blob);
                return audio.play();
              })
              .catch(() => finish(false));
          }
        });
      });
    },
    [getAudioEl],
  );

  return { play, stop, state };
}

"use client";

/**
 * Fire-and-forget playback for short cached clips (praise interjections,
 * goodbye, thinking hum, mic-start boop). Failures (missing file, blocked
 * autoplay) are swallowed — SFX are delight, never load-bearing.
 */
export function playSfx(name: string, muted: boolean): void {
  if (muted) return;
  try {
    const audio = new Audio(`/audio/${name}.mp3`);
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

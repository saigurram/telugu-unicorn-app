import type { Env } from "@/lib/env";

/**
 * ElevenLabs streaming TTS. Voice settings tuned per spec §7: slower than
 * default (speed ~0.88) but still peppy, clear pronunciation, expressive
 * stability. `speed` support varies by ElevenLabs model version — verify
 * against real account access and adjust if the field is rejected.
 */
export async function synthesizeWithElevenLabs(
  text: string,
  env: Env,
): Promise<ReadableStream<Uint8Array>> {
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) {
    throw new Error("ElevenLabs not configured (missing API key or voice ID)");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.TTS_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: env.ELEVENLABS_MODEL_ID,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
            speed: 0.88,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok || !res.body) {
      throw new Error(`ElevenLabs TTS failed: ${res.status} ${res.statusText}`);
    }

    return res.body;
  } finally {
    clearTimeout(timeout);
  }
}

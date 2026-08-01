import type { Env } from "@/lib/env";

/**
 * Sarvam AI "Bulbul" TTS fallback. Sarvam returns base64-encoded audio in a
 * JSON body rather than a byte stream, so it's wrapped into a single-chunk
 * ReadableStream to match the shared synthesizeSpeech contract.
 */
export async function synthesizeWithSarvam(
  text: string,
  env: Env,
): Promise<ReadableStream<Uint8Array>> {
  if (!env.SARVAM_API_KEY) {
    throw new Error("Sarvam not configured (missing API key)");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.TTS_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": env.SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: "te-IN",
        model: env.SARVAM_TTS_MODEL,
        speaker: "anushka",
        pace: 0.9,
        enable_preprocessing: true,
        // Sarvam defaults to raw linear16 PCM, which the client can't play
        // as audio/mpeg — the whole pipeline (route Content-Type, MSE/Blob
        // playback) assumes MP3, so this must be explicit.
        output_audio_codec: "mp3",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Sarvam TTS failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { audios?: string[] };
    const base64Audio = data.audios?.[0];
    if (!base64Audio) {
      throw new Error("Sarvam TTS returned no audio");
    }

    const bytes = Buffer.from(base64Audio, "base64");
    return new ReadableStream<Uint8Array>({
      start(streamController) {
        streamController.enqueue(bytes);
        streamController.close();
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

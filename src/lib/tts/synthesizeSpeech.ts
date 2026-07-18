import { getEnv } from "@/lib/env";
import { synthesizeWithElevenLabs } from "./elevenlabs";
import { synthesizeWithSarvam } from "./sarvam";

/**
 * The single TTS vendor swap point (spec §2/§7). Tries the configured
 * primary provider; on any failure, falls back to the other one. Callers
 * never know or care which vendor served the request.
 */
export async function synthesizeSpeech(text: string): Promise<ReadableStream<Uint8Array>> {
  const env = getEnv();
  const primary = env.TTS_PRIMARY_PROVIDER;

  const providers = {
    elevenlabs: () => synthesizeWithElevenLabs(text, env),
    sarvam: () => synthesizeWithSarvam(text, env),
  } as const;

  const fallback = primary === "elevenlabs" ? "sarvam" : "elevenlabs";

  try {
    return await providers[primary]();
  } catch (error) {
    console.error(`[tts] primary provider "${primary}" failed, falling back to "${fallback}"`, error);
    return await providers[fallback]();
  }
}

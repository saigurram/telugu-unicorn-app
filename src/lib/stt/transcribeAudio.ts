import { getEnv } from "@/lib/env";
import { transcribeWithElevenLabs } from "./elevenlabsScribe";
import { transcribeWithSarvam } from "./sarvamSaarika";

/**
 * The single STT vendor swap point (spec §2/§6). Tries the configured
 * primary provider; on any failure, falls back to the other one.
 */
export async function transcribeAudio(
  audio: Buffer,
  mimeType: string,
): Promise<{ text: string }> {
  const env = getEnv();
  const primary = env.STT_PRIMARY_PROVIDER;

  const providers = {
    elevenlabs: () => transcribeWithElevenLabs(audio, mimeType, env),
    sarvam: () => transcribeWithSarvam(audio, mimeType, env),
  } as const;

  const fallback = primary === "elevenlabs" ? "sarvam" : "elevenlabs";

  try {
    return await providers[primary]();
  } catch (error) {
    console.error(`[stt] primary provider "${primary}" failed, falling back to "${fallback}"`, error);
    return await providers[fallback]();
  }
}

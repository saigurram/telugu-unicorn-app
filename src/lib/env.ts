import { z } from "zod";
import {
  DEFAULT_CLAUDE_TIMEOUT_MS,
  DEFAULT_STT_TIMEOUT_MS,
  DEFAULT_TTS_TIMEOUT_MS,
} from "./constants";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  // eleven_multilingual_v2 does NOT support Telugu (29-language list, no
  // Telugu); eleven_v3 added Telugu in its 70+-language expansion. v3 is
  // the only correct default for this app.
  ELEVENLABS_MODEL_ID: z.string().default("eleven_v3"),
  SARVAM_API_KEY: z.string().optional(),
  SARVAM_TTS_MODEL: z.string().default("bulbul:v2"),
  SARVAM_STT_MODEL: z.string().default("saarika:v2"),
  TTS_PRIMARY_PROVIDER: z.enum(["elevenlabs", "sarvam"]).default("elevenlabs"),
  STT_PRIMARY_PROVIDER: z.enum(["elevenlabs", "sarvam"]).default("elevenlabs"),
  TTS_TIMEOUT_MS: z.coerce.number().default(DEFAULT_TTS_TIMEOUT_MS),
  CLAUDE_TIMEOUT_MS: z.coerce.number().default(DEFAULT_CLAUDE_TIMEOUT_MS),
  STT_TIMEOUT_MS: z.coerce.number().default(DEFAULT_STT_TIMEOUT_MS),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validated lazily, inside route handlers only — never at module import
 * time, so `next build` succeeds even without real vendor keys present.
 */
export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}

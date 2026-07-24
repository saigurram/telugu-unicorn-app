import { beforeEach, describe, expect, it, vi } from "vitest";
import { synthesizeWithElevenLabs } from "@/lib/tts/elevenlabs";
import type { Env } from "@/lib/env";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ANTHROPIC_API_KEY: "test",
    ELEVENLABS_API_KEY: "el-key",
    ELEVENLABS_VOICE_ID: "voice-1",
    ELEVENLABS_MODEL_ID: "eleven_v3",
    SARVAM_API_KEY: "sarvam-key",
    SARVAM_TTS_MODEL: "bulbul:v2",
    SARVAM_STT_MODEL: "saarika:v2",
    TTS_PRIMARY_PROVIDER: "elevenlabs",
    STT_PRIMARY_PROVIDER: "elevenlabs",
    TTS_TIMEOUT_MS: 8000,
    CLAUDE_TIMEOUT_MS: 15000,
    STT_TIMEOUT_MS: 10000,
    ...overrides,
  };
}

describe("synthesizeWithElevenLabs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("omits voice_settings.speed for eleven_v3 (the field is unsupported there)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream() });
    vi.stubGlobal("fetch", fetchMock);

    await synthesizeWithElevenLabs("హలో", makeEnv({ ELEVENLABS_MODEL_ID: "eleven_v3" }));

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.voice_settings).not.toHaveProperty("speed");
  });

  it("includes voice_settings.speed for other models", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream() });
    vi.stubGlobal("fetch", fetchMock);

    await synthesizeWithElevenLabs(
      "hello",
      makeEnv({ ELEVENLABS_MODEL_ID: "eleven_multilingual_v2" }),
    );

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.voice_settings.speed).toBe(0.88);
  });
});

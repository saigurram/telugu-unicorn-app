import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
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
  }),
}));

import { synthesizeSpeech } from "@/lib/tts/synthesizeSpeech";

describe("synthesizeSpeech", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the primary provider's stream on success", async () => {
    const fakeStream = new ReadableStream<Uint8Array>();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body: fakeStream });
    vi.stubGlobal("fetch", fetchMock);

    const stream = await synthesizeSpeech("హలో");

    expect(stream).toBe(fakeStream);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("elevenlabs.io");
  });

  it("falls back to Sarvam when ElevenLabs fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: "err" })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ audios: [Buffer.from("hi").toString("base64")] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const stream = await synthesizeSpeech("హలో");

    expect(stream).toBeInstanceOf(ReadableStream);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("sarvam.ai");
  });

  it("throws when both providers fail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "err" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(synthesizeSpeech("హలో")).rejects.toThrow();
  });
});

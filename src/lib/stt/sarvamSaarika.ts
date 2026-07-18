import type { Env } from "@/lib/env";

function extFromMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

/** Sarvam AI Saarika STT fallback — handles Telugu + code-mixed English. */
export async function transcribeWithSarvam(
  audio: Buffer,
  mimeType: string,
  env: Env,
): Promise<{ text: string }> {
  if (!env.SARVAM_API_KEY) {
    throw new Error("Sarvam not configured (missing API key)");
  }

  const arrayBuffer = audio.buffer.slice(
    audio.byteOffset,
    audio.byteOffset + audio.byteLength,
  ) as ArrayBuffer;

  const form = new FormData();
  form.append("model", env.SARVAM_STT_MODEL);
  form.append("language_code", "unknown");
  form.append("file", new Blob([arrayBuffer], { type: mimeType }), `audio.${extFromMime(mimeType)}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.STT_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": env.SARVAM_API_KEY },
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Sarvam STT failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { transcript?: string };
    return { text: data.transcript ?? "" };
  } finally {
    clearTimeout(timeout);
  }
}

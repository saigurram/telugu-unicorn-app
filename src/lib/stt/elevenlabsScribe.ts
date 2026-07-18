import type { Env } from "@/lib/env";

function extFromMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

/** ElevenLabs Scribe STT — handles Telugu + code-mixed English. */
export async function transcribeWithElevenLabs(
  audio: Buffer,
  mimeType: string,
  env: Env,
): Promise<{ text: string }> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs not configured (missing API key)");
  }

  const arrayBuffer = audio.buffer.slice(
    audio.byteOffset,
    audio.byteOffset + audio.byteLength,
  ) as ArrayBuffer;

  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", new Blob([arrayBuffer], { type: mimeType }), `audio.${extFromMime(mimeType)}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.STT_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs STT failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "" };
  } finally {
    clearTimeout(timeout);
  }
}

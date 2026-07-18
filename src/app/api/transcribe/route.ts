import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/stt/transcribeAudio";
import type { TranscribeResponseBody } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  let audioFile: File | null;
  try {
    const formData = await request.formData();
    const entry = formData.get("audio");
    audioFile = entry instanceof File ? entry : null;
  } catch {
    return NextResponse.json({ text: "" } satisfies TranscribeResponseBody);
  }

  if (!audioFile) {
    return NextResponse.json({ text: "" } satisfies TranscribeResponseBody);
  }

  try {
    const mimeType = audioFile.type || "audio/webm";
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const { text } = await transcribeAudio(buffer, mimeType);
    // Audio buffer is never persisted — it goes out of scope here.
    return NextResponse.json({ text } satisfies TranscribeResponseBody);
  } catch (error) {
    // Never surface a transcription error to the child — an empty
    // transcript flows into Claude's "[unclear]" re-ask path instead.
    console.error("[/api/transcribe]", error);
    return NextResponse.json({ text: "" } satisfies TranscribeResponseBody);
  }
}

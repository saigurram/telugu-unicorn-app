import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeech } from "@/lib/tts/synthesizeSpeech";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  let text: string;
  try {
    ({ text } = requestSchema.parse(await request.json()));
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const stream = await synthesizeSpeech(text);
    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[/api/speak]", error);
    return NextResponse.json({ error: "speak_failed" }, { status: 502 });
  }
}

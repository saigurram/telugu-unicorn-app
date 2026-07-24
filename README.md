# మిల యునికార్న్ — Mila the Telugu Unicorn

A small, single-family web app that helps a 5-year-old practice **speaking**
Telugu through short daily voice conversations with Mila, an animated
unicorn. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `ANTHROPIC_API_KEY` — powers Mila's dialogue (`/api/converse`).
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` — primary text-to-speech.
  Run the 3-voice A/B test from the product spec (§7) with a real
  ElevenLabs account before picking `ELEVENLABS_VOICE_ID`.
- `SARVAM_API_KEY` — optional fallback TTS/STT (Sarvam "Bulbul"/"Saarika").

```bash
npm run dev
```

### Known vendor tradeoff: TTS model vs. speed control

`ELEVENLABS_MODEL_ID` defaults to `eleven_v3` and **must stay that way** —
ElevenLabs' other multilingual model (`eleven_multilingual_v2`) does not
support Telugu at all. The tradeoff: `eleven_v3` does not support the
`voice_settings.speed` field the spec asks for (§7, slower-than-default
pace), so the app cannot programmatically slow Mila's speech down on this
model — the code detects this and omits the field rather than risk every
request failing. If ElevenLabs adds speed support to v3 later, or ships a
different Telugu-capable model, update `ELEVENLABS_MODEL_ID` and revisit
`src/lib/tts/elevenlabs.ts`'s `supportsSpeed` check.

**This whole area (voice quality, latency, code-mixed transcription
accuracy) has never been tested against real vendor accounts** — only
against mocked responses in the test suite. Budget time for the §7 voice
A/B test and a real on-device session before considering this done.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — end-to-end tests (Playwright, mocked API routes)

## Architecture

- `src/lib/conversationMachine.ts` — pure state machine driving the
  greet → exchange → celebrate session loop.
- `src/lib/tts/synthesizeSpeech.ts` / `src/lib/stt/transcribeAudio.ts` —
  single vendor swap points (ElevenLabs primary, Sarvam fallback).
- `src/app/api/{converse,transcribe,speak}` — server-only routes; no API
  key ever reaches the client, no audio is ever persisted.
- `src/lib/storage/storage.ts` — the only module touching `localStorage`
  (child name, streak, session count, phrase-rotation history).
- `src/data/topics.json` — the 40-seed content bank behind the
  no-repeat-in-5-sessions topic rotation.

No accounts, no database, no analytics — everything lives in the browser's
`localStorage` for one family's use.

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

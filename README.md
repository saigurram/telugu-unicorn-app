# మిల యునికార్న్ — Mila the Telugu Unicorn

Voice-only app that gets my 5-year-old speaking Telugu instead of just understanding it. Live at [telugu-unicorn-app.vercel.app](https://telugu-unicorn-app.vercel.app).

## The problem

She understands Telugu completely, we speak it at home, but she answers in English. That's not a comprehension gap, it's a production gap. The vocabulary is already there. What's missing is the willingness to say it out loud and risk sounding wrong. So the metric that matters isn't words learned, it's minutes spent talking.

## What it does

She taps one button. Mila greets her by name and asks something. She answers out loud. Mila reacts, plays a game or tells a story she gets to steer, then asks the next thing. No typing, no reading, she can't read yet so text UI was never an option. Sessions run 3-5 exchanges and end on a cliffhanger so there's a reason to come back tomorrow.

## How it works

Every turn is speech-to-text, Claude, text-to-speech, playback, in sequence. Turn-taking is hands-free (silence detection, 1300ms threshold, 15s hard cap) instead of push-to-talk, because a five-year-old won't reliably hold a button down while thinking in her second language.

Claude replies through a forced tool call, not free text: the Telugu line, whether she spoke Telugu, how big a celebration to play, whether the session's done. In production Claude skipped the "required" session_complete field and the whole turn threw, because my schema had zero tolerance for a missing field. Fixed by defaulting everything except the actual speech text, which is the one field the app can't function without.

The child never sees an error. Failed requests retry silently up to 3 times, then the session ends warmly instead of surfacing a failure. Cost: when it broke in production I had zero visibility beyond server logs, and the logs only showed HTTP status codes at first, not the vendor's actual error body. Useless for debugging a 402 that turned out to be something else entirely.

No accounts, no database. Everything lives in localStorage, audio is never persisted anywhere. Doesn't scale past one house. That's fine, it isn't supposed to.

## Vendor reality

Picked ElevenLabs for voice quality. Then: their main multilingual model doesn't support Telugu at all, only eleven_v3 does, so model choice wasn't actually a choice. eleven_v3 doesn't support the speed parameter, so I can't slow Mila's pace down for a kid, on any tier, full stop. Free tier blocks Voice Library voices over the API regardless of credit balance, burned an afternoon chasing a 402 Payment Required that had nothing to do with the 10,000 unused credits sitting in the account.

Fallback is Sarvam. Solid Telugu, but no streaming, the full clip has to generate before anything plays, and it defaults to raw PCM instead of MP3. Server returned 200, logs were clean, phone played silence, because the audio format didn't match what the client was told to expect.

Every vendor call goes through one swap function per direction (TTS, STT), primary and fallback picked by env var. Looked like over-engineering on day one. Only reason the app survived shipping against real accounts.

## Making it engaging

First working version was a quiz with a horn: ask, answer, శభాష్!, ask again. Three fixes. Mila now remembers facts the kid reveals, favorite foods, a toy's name, and opens later sessions with them. Sessions rotate chat, game, and story instead of repeating the same shape, from a 40-phrase bank that won't repeat a phrase within 5 sessions. And every turn has to end in a question, no exceptions except the closing goodbye, because without that rule Claude produces a warm, complete, conversation-ending statement, and a compliment is a dead end for a shy kid.

## Tech

Next.js (App Router), TypeScript, Tailwind, Vercel, no backend beyond the Next API routes. Conversation flow is a pure reducer with declared legal state transitions, an illegal one throws in dev instead of silently corrupting state in prod. 53 unit tests, 7 end-to-end tests with real audio playback and a fake mic against mocked vendors, because the actual bugs in this app are timing bugs and mocks alone don't catch them.

## Running it

```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

Needs `ANTHROPIC_API_KEY`, and either ElevenLabs (`ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`) or Sarvam (`SARVAM_API_KEY`) for voice. `TTS_PRIMARY_PROVIDER` / `STT_PRIMARY_PROVIDER` pick which one leads, put whichever one actually works for your account first, a failing primary costs a full round trip on every turn.

```bash
npm test          # unit
npm run test:e2e  # end-to-end
```

## What I'd change

Two server round trips per turn (Claude, then TTS) that should be one call. The 1300ms silence threshold is a guess, not a measurement. Sarvam's non-streaming audio is the single biggest remaining latency cost, fixed by a $5/month ElevenLabs plan I haven't upgraded to yet. And the whole engagement model is validated against a sample size of one kid who's related to me.

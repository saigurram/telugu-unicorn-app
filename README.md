# మిల యునికార్న్ — Mila the Telugu Unicorn

A voice-only app where my five-year-old talks to a unicorn in Telugu.

Live: https://telugu-unicorn-app.vercel.app

---

## The problem I was actually solving

My daughter understands Telugu completely. We speak it at home, she follows every
conversation, she knows exactly what her grandmother is asking her. She answers in
English.

This is the normal shape of second-generation language loss, and it's a production
problem, not a comprehension one. The vocabulary is in there. What's missing is the
willingness to open her mouth and risk sounding wrong.

That reframing decided everything downstream. If the goal were teaching vocabulary,
I'd have built flashcards, and flashcards would have failed, because she doesn't need
more input. She needs a reason to produce output, and a listener who doesn't make her
self-conscious about it. So the target metric isn't words learned. It's **minutes she
spends talking**.

Every design decision below comes back to that.

## What it does

She taps one button. A unicorn greets her by name and asks her something. She answers
out loud. The unicorn reacts — celebrates, plays a game, tells a story that she gets to
steer — and asks the next thing. Four exchanges later there's confetti and a star count,
and Mila leaves a cliffhanger so there's a reason to come back tomorrow.

No typing. No reading. No menus. She cannot read, so any text-based interface was dead
on arrival.

---

## The decisions, and what each one cost me

This is the part worth reading. Every one of these was a fork with a real downside.

### Voice-only, with no text fallback

**Chose:** no keyboard, no written prompts, one giant button.

The moment you commit to this, you inherit an entire pipeline you'd otherwise avoid:
speech-to-text, a language model, text-to-speech, and audio playback, all in sequence,
all before a child with a four-second attention span decides nothing is happening.

**What it cost:** the latency budget became the hardest constraint in the project, and
I can't fix it with a spinner, because she can't read the spinner either. There's no
graceful degradation path. If the voice pipeline is down, the app has nothing to fall
back on.

### Hands-free turn-taking instead of push-to-talk

**Chose:** the mic opens on its own and closes when she stops talking.

Push-to-talk is far easier to build and impossible to get wrong technically. I tested
the idea and rejected it: a five-year-old does not reliably hold a button while
thinking about what to say in her second language. She lets go mid-sentence.

So the app detects silence itself. The threshold sits at 1300ms, with a 15-second hard
cap.

**What it cost:** that number is a genuine compromise and I'm still not sure it's right.
Kids pause. They pause to think, they pause because they got distracted, they pause in
the middle of a word. Too short and it cuts her off, which is exactly the
self-consciousness I was trying to remove. Too long and the conversation feels dead and
she wanders off. 1300ms is my current guess, not a validated answer.

### The child never sees an error

**Chose:** when something breaks, Mila just keeps being a unicorn.

There is no error state in the UI. If a request fails, the app retries quietly three
times, and if it still can't recover it ends the session warmly, as though Mila decided
it was time to say goodbye. A five-year-old cannot act on "502 Bad Gateway" and
shouldn't have to see it.

**What it cost:** it hides failure from the parent too. When it broke in production I
was flying blind, and the only way to diagnose anything was server logs. I eventually
had to go back and make the code log the vendor's actual error body instead of just the
HTTP status, because "402 Payment Required" alone told me nothing. That was a real
debugging cost I brought on myself.

### No accounts, no backend, no database

**Chose:** everything lives in `localStorage`. Audio is never written to disk, never
stored, never sent anywhere except the transcription vendor.

This is a child's voice. The correct amount of it to retain is none.

**What it cost:** no cross-device sync, and if she clears the browser her streak and
everything Mila remembers about her vanish. For a single family that's an acceptable
trade. For anything wider it wouldn't be, and the honest answer is this architecture
doesn't scale past my own house — which is fine, because it isn't supposed to.

### One swap point for every voice vendor

**Chose:** all TTS goes through a single function, all STT through another, with a
primary provider and an automatic fallback, both selected by environment variable.

This looked like over-engineering when I built it. It is the only reason the project
survived contact with reality.

### Structured output via forced tool use

**Chose:** Claude must reply through a tool schema, returning the Telugu line plus flags
for whether she spoke Telugu, how big a celebration to play, and whether the session
should end.

**What it cost:** two things I learned the hard way. Constraining a model to a schema
does trade away some naturalness. And "required" in a tool schema is not a guarantee —
Claude omitted `session_complete` in production and the whole turn threw, because my
validation had zero tolerance. Only `speech` is genuinely load-bearing; everything else
now has a sane default. That was a real outage, caused by me trusting a contract that
was never actually enforced.

### Sessions capped at 3–5 exchanges

**Chose:** short, and always ending while she still wants more.

The temptation is to maximise session length, since minutes-talking is the metric. That's
the wrong read. A session that runs until she's bored teaches her that the unicorn is
boring. Ending early, on a cliffhanger, is what makes tomorrow happen.

**What it cost:** measured per-session, the numbers look worse. I think that's the right
thing to be wrong about.

---

## The vendor reality check

This is the part I'd want another PM to read, because it's the gap between a plan that
looks correct on paper and one that survives an actual account.

I picked ElevenLabs for the voice. Good quality, and the voice I wanted was right there
in their library. Then, in order:

**Their main multilingual model doesn't support Telugu at all.** Not badly — at all. The
29-language list simply doesn't include it. Only `eleven_v3` covers Telugu, so the model
choice was made for me.

**`eleven_v3` doesn't support the speed parameter.** I wanted Mila to speak slightly
slower than default, which is an obvious thing to want when a child is learning. The one
model that speaks Telugu is the one model that won't let me slow it down. Sending the
field anyway fails the request, so the code detects the model and omits it. I lost a
feature to a vendor's implementation detail and there is no workaround.

**The free tier blocks Voice Library voices over the API entirely.** This one cost me the
most time, because the failure mode was misleading. I had 10,000 unused credits sitting
in the account and every request came back `402 Payment Required`. Credits were never the
issue. Free accounts simply cannot use community library voices through the API, at any
balance — the exact voice I'd chosen was the one thing I couldn't use.

So the fallback carried the app. Sarvam AI handles Telugu well and has a usable free
tier. But:

**Sarvam returns one finished audio blob, not a stream.** ElevenLabs streams, meaning
playback starts while the rest is still generating. Sarvam has to finish the entire clip
first. Same words, same content, noticeably worse felt responsiveness — and felt
responsiveness is the whole game with a five-year-old.

It also defaults to raw PCM rather than MP3, which produced my favourite bug of the
project: the server said everything succeeded, the logs were clean, and the phone played
silence. Nothing was wrong server-side. The browser was being handed audio in a format it
had been told was something else.

**The lesson I'd carry forward:** vendor documentation describes the happy path on a paid
account. Free-tier restrictions, model-specific parameter support, and default output
formats are where integrations actually break, and none of them show up until you have
real credentials in a real deployment. Budget time for that gap. I didn't budget enough.

---

## Making it engaging, which was harder than making it work

The first working version was technically fine and emotionally flat. It asked a question,
she answered, it said "శభాష్!", it asked another question. A quiz with a horn.

Three things fixed it.

**Mila remembers her.** When my daughter mentions something real — a food she likes, a
toy's name, something that happened at school — Mila records it, and opens a later session
with it. *"You told me you like dosa! Did you have some today?"* Being remembered is most
of the distance between a friend and a form.

**Sessions rotate between chat, a game, and a story.** Predictability is what kills
engagement fastest at this age. The games are built for voice with no screen: guess the
animal, colour hunts, a shop where she sets the prices, and one where Mila says something
confidently wrong so my daughter can correct her. Five-year-olds find being the expert
irresistible.

**Mila has a life of her own.** She sleeps on a cloud, has a grumpy star for a best friend,
and is afraid of bees. She volunteers something about her day and then asks about my
daughter's. Reciprocity turns an interrogation into a conversation, and it costs nothing
but prompt tokens.

There's also one rule that outranks everything else in the prompt: **every turn must end
with a question.** Without it the model produces warm, complete, conversation-ending
statements. A compliment is a dead end. She only talks if she's asked.

---

## What's still wrong

Being straight about this, because a README that claims everything works is a README
nobody should trust.

**It's still slower than I want.** Claude writes the reply, then speech gets generated,
and those happen in sequence rather than overlapping. On top of that the app makes two
separate server round trips per turn, and with only one family using it, most requests
cold-start a fresh serverless function. Merging those two calls into one is the obvious
next fix.

**The silence threshold is a guess.** See above. It needs real observation, not intuition.

**Voice quality is a compromise I'm still living with.** The fallback vendor is good, not
great, and doesn't stream. Fixing it properly costs about five dollars a month, which is
a completely reasonable price and slightly annoying to have discovered the long way round.

**Nothing here has been tested by more than one child.** Every engagement decision is a
hypothesis validated by a sample size of one, who happens to be related to me and is
therefore a terrible source of unbiased feedback.

---

## How it's built

Next.js (App Router) and TypeScript on Vercel. Tailwind for styling. No database.

The interesting piece is the conversation state machine. Seven phases — idle, thinking,
speaking, listening, transcribing, celebrating, error — with legal transitions declared
up front, so an illegal one throws loudly in development instead of corrupting state
quietly in production.

Voice work is genuinely racy and most of the real bugs lived there. Playback finishing
after a session has already ended. A microphone permission prompt resolving after the
turn it belonged to is gone. A recording landing after the user tapped goodbye. Each of
those gets an epoch counter or a token check, so a result that arrives late is recognised
as stale and discarded rather than acted on.

```
src/lib/conversationMachine.ts   pure reducer, no I/O, fully unit tested
src/lib/tts/ + src/lib/stt/      the vendor swap points
src/app/api/*                    server-only; no key ever reaches the browser
src/lib/storage/storage.ts       the only module touching localStorage
src/components/mila/             the character: one SVG, four states, all CSS
```

53 unit tests and 7 end-to-end tests. The end-to-end ones drive the real state machine
against mocked vendors, with real audio playback and a fake microphone, because the
bugs worth catching in this app are timing bugs and they don't reproduce against mocks
alone.

## Running it

```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

`ANTHROPIC_API_KEY` is required. For voice you need either ElevenLabs
(`ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`, and read the vendor section above before
choosing a voice) or Sarvam (`SARVAM_API_KEY`). Set `TTS_PRIMARY_PROVIDER` and
`STT_PRIMARY_PROVIDER` to pick which one leads — if one of them is going to fail for
your account, put the other first, because a failing primary costs a full round trip on
every single turn.

```bash
npm test          # unit
npm run test:e2e  # end-to-end
```

---

Built for one specific five-year-old. Everything above is written for anyone who wants
to know why it is the way it is.

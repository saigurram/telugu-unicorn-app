import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getClaudeClient } from "@/lib/claude/client";
import { buildSystemPrompt } from "@/lib/claude/systemPrompt";
import { buildMessages } from "@/lib/claude/buildMessages";
import {
  CLAUDE_MAX_TOKENS,
  CLAUDE_MODEL,
  MAX_EXCHANGE_TARGET,
  MIN_EXCHANGE_TARGET,
} from "@/lib/constants";
import type { ConverseResponseBody } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const topicSchema = z.object({
  id: z.string(),
  category: z.string(),
  teluguPhrase: z.string(),
  transliteration: z.string(),
  englishGloss: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  promptHint: z.string(),
});

const requestSchema = z.object({
  childName: z.string().min(1),
  topic: topicSchema,
  conversationHistory: z.array(
    z.object({ role: z.enum(["mila", "child"]), text: z.string() }),
  ),
  turnCount: z.number().int().min(0),
  exchangeTarget: z.number().int().min(MIN_EXCHANGE_TARGET).max(MAX_EXCHANGE_TARGET),
});

const MILA_REPLY_TOOL = {
  name: "mila_reply",
  description: "Mila the unicorn's next turn in the conversation.",
  input_schema: {
    type: "object" as const,
    properties: {
      speech: {
        type: "string",
        description: "The Telugu text Mila says aloud, 1-2 short sentences.",
      },
      child_spoke_telugu: {
        type: "boolean",
        description: "Whether the child's last utterance was (at least partly) in Telugu.",
      },
      exchange_complete: {
        type: "boolean",
        description: "Whether this reply concludes the current exchange.",
      },
      celebration_level: {
        type: "string",
        enum: ["none", "small", "big"],
      },
      session_complete: {
        type: "boolean",
        description:
          "True only when this speech is the session's final goodbye and no more exchanges should follow.",
      },
    },
    required: [
      "speech",
      "child_spoke_telugu",
      "exchange_complete",
      "celebration_level",
      "session_complete",
    ],
  },
};

// Anthropic's tool_choice forcing doesn't guarantee every field marked
// "required" in the tool schema actually gets populated — Claude can still
// omit one. `speech` is the only field the app can't function without;
// the rest get a safe default rather than failing the whole turn.
const toolResultSchema = z.object({
  speech: z.string(),
  child_spoke_telugu: z.boolean().default(false),
  exchange_complete: z.boolean().default(false),
  celebration_level: z.enum(["none", "small", "big"]).default("none"),
  session_complete: z.boolean().default(false),
});

export async function POST(request: Request) {
  let parsedBody: z.infer<typeof requestSchema>;
  try {
    parsedBody = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const env = getEnv();
  const client = getClaudeClient(env.ANTHROPIC_API_KEY);

  // turnCount only advances when an exchange completes, so it stays 0 for
  // both the greeting call and the reply to the child's first response —
  // history emptiness is what actually distinguishes "this is the greeting".
  const isFirstTurn = parsedBody.conversationHistory.length === 0;
  // The turn about to be generated becomes exchange (turnCount + 1); once
  // that reaches the target, fold the closing goodbye into this same
  // reply rather than waiting on one more (unconfigured) child turn.
  // isFirstTurn is checked first so a 1-exchange edge case can never make
  // the greeting call get treated as the closing goodbye instead.
  const nearingEnd = !isFirstTurn && parsedBody.turnCount + 1 >= parsedBody.exchangeTarget;

  const system = buildSystemPrompt(parsedBody.childName, parsedBody.topic) +
    (isFirstTurn
      ? "\n\nThis is the start of the session. Greet her by name with high energy, referencing something light like the time of day, and end the greeting with one easy question so she has something to answer straight away."
      : nearingEnd
        ? "\n\nThis is the FINAL exchange of the session. Wrap up warmly: celebrate the whole session, say a warm Telugu goodbye, mention you can't wait for tomorrow. Set session_complete to true."
        : "");

  try {
    const response = await client.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_MAX_TOKENS,
        system,
        messages: buildMessages(parsedBody.conversationHistory),
        tools: [MILA_REPLY_TOOL],
        tool_choice: { type: "tool", name: "mila_reply" },
      },
      { timeout: env.CLAUDE_TIMEOUT_MS },
    );

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not return a tool_use block");
    }

    const parsed = toolResultSchema.parse(toolUse.input);

    const body: ConverseResponseBody = {
      speech: parsed.speech,
      childSpokeTelugu: parsed.child_spoke_telugu,
      exchangeComplete: parsed.exchange_complete,
      celebrationLevel: parsed.celebration_level,
      sessionComplete: parsed.session_complete,
    };

    return NextResponse.json(body);
  } catch (error) {
    // Never surface a raw error to a 5-year-old's screen — the client
    // treats any non-200 as a gentle retry/re-ask, never an error state.
    console.error("[/api/converse]", error);
    return NextResponse.json({ error: "converse_failed" }, { status: 502 });
  }
}

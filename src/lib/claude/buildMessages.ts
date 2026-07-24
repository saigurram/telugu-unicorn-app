import type Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "@/types";

export function buildMessages(history: ChatTurn[]): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = history.map((turn) => ({
    role: turn.role === "mila" ? "assistant" : "user",
    content: turn.text,
  }));

  // The very first turn of a session (the greeting) has no history yet —
  // prompt Claude to open the conversation instead of replying to
  // something that was never said. Every later turn already ends with the
  // child's latest utterance as the last history entry, so nothing more
  // needs to be appended.
  if (messages.length === 0) {
    messages.push({ role: "user", content: "[start of session — greet her]" });
  }

  return messages;
}

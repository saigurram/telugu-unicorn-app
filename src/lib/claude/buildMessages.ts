import type Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "@/types";

export function buildMessages(
  history: ChatTurn[],
  childUtterance: string,
): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = history.map((turn) => ({
    role: turn.role === "mila" ? "assistant" : "user",
    content: turn.text,
  }));

  // The very first turn of a session (the greeting) has no child utterance
  // yet — prompt Claude to open the conversation instead of replying to
  // something that was never said.
  const latest = childUtterance.trim() || "[start of session — greet her]";
  messages.push({ role: "user", content: latest });

  return messages;
}

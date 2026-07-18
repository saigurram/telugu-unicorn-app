import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

/** Server-only. Never import this module from client components. */
export function getClaudeClient(apiKey: string): Anthropic {
  if (cached) return cached;
  cached = new Anthropic({ apiKey });
  return cached;
}

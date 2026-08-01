import type { SessionActivity } from "@/types";

/**
 * Sessions rotate chat → game → story. A five-year-old disengages fast from
 * a format she can predict, and each shape pulls a different kind of talking
 * out of her: chat gets real answers about her day, a game gets rapid-fire
 * single words, a story gets her making choices and filling in blanks.
 */
const ROTATION: SessionActivity[] = ["chat", "game", "story"];

export function selectActivity(sessionNumber: number): SessionActivity {
  // sessionNumber is 1-based, so the very first session is "chat" — the
  // gentlest opening for a child who is shy about speaking.
  const index = Math.max(0, sessionNumber - 1) % ROTATION.length;
  return ROTATION[index];
}

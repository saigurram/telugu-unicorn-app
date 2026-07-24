import { describe, expect, it } from "vitest";
import { buildMessages } from "@/lib/claude/buildMessages";
import type { ChatTurn } from "@/types";

describe("buildMessages", () => {
  it("injects a start-of-session marker when history is empty (the greeting call)", () => {
    const messages = buildMessages([]);
    expect(messages).toEqual([{ role: "user", content: "[start of session — greet her]" }]);
  });

  it("maps history directly without duplicating the child's latest utterance", () => {
    const history: ChatTurn[] = [
      { role: "mila", text: "నమస్కారం!" },
      { role: "child", text: "నమస్కారం మిల!" },
    ];
    const messages = buildMessages(history);

    expect(messages).toEqual([
      { role: "assistant", content: "నమస్కారం!" },
      { role: "user", content: "నమస్కారం మిల!" },
    ]);
    // Regression guard: the child's utterance must appear exactly once —
    // it used to be pushed a second time as a duplicate trailing message.
    expect(messages.filter((m) => m.content === "నమస్కారం మిల!")).toHaveLength(1);
  });

  it("maps mila/child roles to assistant/user for every history entry", () => {
    const history: ChatTurn[] = [
      { role: "mila", text: "a" },
      { role: "child", text: "b" },
      { role: "mila", text: "c" },
      { role: "child", text: "d" },
    ];
    const messages = buildMessages(history);
    expect(messages.map((m) => m.role)).toEqual(["assistant", "user", "assistant", "user"]);
  });
});

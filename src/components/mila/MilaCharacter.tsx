"use client";

import styles from "./mila.module.css";
import { MilaSvg } from "./MilaSvg";
import type { ConversationPhase } from "@/types";

export type MilaVisualState = "idle" | "talking" | "listening" | "celebrating";

export function phaseToVisualState(phase: ConversationPhase): MilaVisualState {
  switch (phase) {
    case "MILA_SPEAKING":
      return "talking";
    case "LISTENING":
      return "listening";
    case "CELEBRATION":
      return "celebrating";
    default:
      return "idle";
  }
}

interface MilaCharacterProps {
  phase: ConversationPhase;
  /** Fires once when the finite celebration jump animation completes. A
   * timeout fallback for backgrounded tabs lives in useConversationMachine. */
  onCelebrationEnd?: () => void;
}

export function MilaCharacter({ phase, onCelebrationEnd }: MilaCharacterProps) {
  const visualState = phaseToVisualState(phase);

  return (
    <div className={styles.wrapper} data-state={visualState}>
      <MilaSvg onBodyAnimationEnd={onCelebrationEnd} />
    </div>
  );
}

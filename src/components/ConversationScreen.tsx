"use client";

import { MilaCharacter } from "./mila/MilaCharacter";
import { MicButton } from "./MicButton";
import { BackgroundDecor } from "./BackgroundDecor";
import type { useConversationMachine } from "@/hooks/useConversationMachine";
import type { ConversationPhase } from "@/types";

interface ConversationScreenProps {
  machine: ReturnType<typeof useConversationMachine>;
  captionsEnabled: boolean;
}

/** A pre-reader can't read a status line, so each state leads with a glyph
 *  and colour; the Telugu label is there for the parent sitting alongside. */
function statusFor(phase: ConversationPhase): { icon: string; label: string; tone: string } | null {
  switch (phase) {
    case "THINKING":
    case "TRANSCRIBING":
      return { icon: "💭", label: "ఆలోచిస్తోంది…", tone: "bg-grape/15 text-grape" };
    case "MILA_SPEAKING":
      return { icon: "🎵", label: "మిల మాట్లాడుతోంది", tone: "bg-sky/20 text-sky-700" };
    case "LISTENING":
      return { icon: "👂", label: "నీ వంతు!", tone: "bg-mint/20 text-emerald-700" };
    default:
      return null;
  }
}

export function ConversationScreen({ machine, captionsEnabled }: ConversationScreenProps) {
  const { state, endSessionEarly, manualStopListening, isRecording } = machine;
  const status = statusFor(state.phase);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-5 pb-9 pt-5">
      <BackgroundDecor />

      <div className="relative z-20 flex w-full items-start justify-between gap-3">
        {/* Progress dots — one filled star per completed exchange. */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-2 shadow-md backdrop-blur">
          {Array.from({ length: state.exchangeTarget }, (_, i) => (
            <span
              key={i}
              className={`text-base transition-transform duration-300 ${
                i < state.exchangeCount ? "scale-110" : "opacity-30 grayscale"
              }`}
              aria-hidden="true"
            >
              ⭐
            </span>
          ))}
        </div>

        <button
          type="button"
          data-testid="end-session-button"
          onClick={endSessionEarly}
          className="font-telugu shrink-0 rounded-full bg-white/80 px-4 py-2.5 text-base font-semibold text-ink/70 shadow-md backdrop-blur transition-transform active:scale-90"
        >
          బై బై! 👋
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="h-full max-h-[17rem] w-full max-w-[17rem]">
          <MilaCharacter phase={state.phase} />
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-2.5">
        {status && (
          <div
            className={`animate-pop-in flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur ${status.tone}`}
          >
            <span aria-hidden="true">{status.icon}</span>
            <span className="font-telugu text-sm font-semibold">{status.label}</span>
          </div>
        )}

        {captionsEnabled && state.milaSpeech && (
          <p className="sticker font-telugu max-w-sm px-5 py-2.5 text-center text-base font-medium text-ink">
            {state.milaSpeech}
          </p>
        )}

        <MicButton listening={isRecording} onTap={manualStopListening} />
      </div>
    </main>
  );
}

"use client";

import { MilaCharacter } from "./mila/MilaCharacter";
import { MicButton } from "./MicButton";
import type { useConversationMachine } from "@/hooks/useConversationMachine";

interface ConversationScreenProps {
  machine: ReturnType<typeof useConversationMachine>;
  captionsEnabled: boolean;
}

export function ConversationScreen({ machine, captionsEnabled }: ConversationScreenProps) {
  const { state, endSessionEarly, manualStopListening, isRecording } = machine;

  return (
    <main className="relative flex flex-1 flex-col items-center justify-between px-6 py-8">
      <button
        type="button"
        data-testid="end-session-button"
        onClick={endSessionEarly}
        className="tap-target absolute right-2 top-2 rounded-full font-telugu text-base"
      >
        బై బై! 👋
      </button>

      <div className="mt-6 flex w-full max-h-[60vh] flex-1 items-center justify-center">
        <div className="h-full max-h-80 w-full max-w-80">
          <MilaCharacter phase={state.phase} />
        </div>
      </div>

      {captionsEnabled && state.milaSpeech && (
        <p className="font-telugu mb-4 max-w-sm text-center text-xl text-ink">{state.milaSpeech}</p>
      )}

      <div className="mb-6">
        <MicButton listening={isRecording} onTap={manualStopListening} />
      </div>
    </main>
  );
}

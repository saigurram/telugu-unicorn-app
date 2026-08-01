interface MicButtonProps {
  listening: boolean;
  onTap: () => void;
}

/** Auto-listen starts on its own; tapping only ever stops early. */
export function MicButton({ listening, onTap }: MicButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Expanding halos — the "we're hearing you" cue, big enough to read
          from across the room. Rendered behind the button, never tappable. */}
      {listening && (
        <>
          <span className="pointer-events-none absolute h-28 w-28 animate-ping rounded-full bg-mint/40" />
          <span className="pointer-events-none absolute h-32 w-32 rounded-full bg-mint/15" />
        </>
      )}

      <button
        type="button"
        data-testid="mic-button"
        onClick={onTap}
        disabled={!listening}
        style={
          {
            "--btn-face": listening
              ? "linear-gradient(180deg, #3ee0ba 0%, #1fd0a3 100%)"
              : "linear-gradient(180deg, #ded6ee 0%, #cdc2e4 100%)",
            "--btn-edge": listening ? "#12a884" : "#b3a6cf",
          } as React.CSSProperties
        }
        className={`btn-chunky tap-target relative z-10 flex flex-col items-center justify-center gap-0.5 px-8 ${
          listening ? "" : "cursor-default"
        }`}
        aria-live="polite"
      >
        <span className="text-3xl drop-shadow-sm" aria-hidden="true">
          🎤
        </span>
        <span className="font-telugu text-base font-bold">{listening ? "మాట్లాడు!" : ""}</span>
      </button>
    </div>
  );
}

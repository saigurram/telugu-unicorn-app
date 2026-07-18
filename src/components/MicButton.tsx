interface MicButtonProps {
  listening: boolean;
  onTap: () => void;
}

/** Auto-listen starts on its own; tapping only ever stops early. */
export function MicButton({ listening, onTap }: MicButtonProps) {
  return (
    <button
      type="button"
      data-testid="mic-button"
      onClick={onTap}
      disabled={!listening}
      className={`tap-target flex flex-col items-center justify-center gap-1 rounded-full px-8 py-6 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 ${
        listening
          ? "bg-mint animate-pulse"
          : "bg-lavender/40 cursor-default"
      }`}
      aria-live="polite"
    >
      <span className="text-3xl" aria-hidden="true">
        🎤
      </span>
      <span className="font-telugu">{listening ? "మాట్లాడు!" : ""}</span>
    </button>
  );
}

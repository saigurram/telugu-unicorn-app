"use client";

import { MilaCharacter } from "./mila/MilaCharacter";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { BackgroundDecor } from "./BackgroundDecor";

interface CelebrationScreenProps {
  starsEarned: number;
  onBackHome: () => void;
}

export function CelebrationScreen({ starsEarned, onBackHome }: CelebrationScreenProps) {
  const stars = Math.max(1, starsEarned);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-5 py-8">
      <BackgroundDecor />
      <ConfettiOverlay />

      <div className="relative z-10 h-64 w-64">
        <MilaCharacter phase="CELEBRATION" />
      </div>

      <p className="font-telugu relative z-10 text-5xl font-bold text-grape drop-shadow-sm">
        శభాష్!
      </p>

      {/* Stars land one at a time so earning four feels bigger than earning one. */}
      <div className="relative z-10 flex gap-1.5" aria-label={`${stars} stars earned`}>
        {Array.from({ length: stars }, (_, i) => (
          <span
            key={i}
            className="animate-pop-in text-4xl drop-shadow-md"
            style={{ animationDelay: `${i * 160}ms` }}
            aria-hidden="true"
          >
            ⭐
          </span>
        ))}
      </div>

      <button
        type="button"
        data-testid="home-button"
        onClick={onBackHome}
        style={
          {
            "--btn-face": "linear-gradient(180deg, #9a6bff 0%, #7c4dff 100%)",
            "--btn-edge": "#5a2ed6",
          } as React.CSSProperties
        }
        className="btn-chunky tap-target relative z-10 mt-2 px-10 text-xl"
      >
        Home 🏠
      </button>
    </main>
  );
}

"use client";

import { MilaCharacter } from "./mila/MilaCharacter";
import { ConfettiOverlay } from "./ConfettiOverlay";

interface CelebrationScreenProps {
  starsEarned: number;
  onBackHome: () => void;
}

export function CelebrationScreen({ starsEarned, onBackHome }: CelebrationScreenProps) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 py-10">
      <ConfettiOverlay />
      <div className="h-56 w-56">
        <MilaCharacter phase="CELEBRATION" />
      </div>
      <p className="font-telugu text-3xl font-bold text-ink">శభాష్!</p>
      <p className="text-2xl" aria-hidden="true">
        {"⭐".repeat(Math.max(1, starsEarned))}
      </p>
      <button
        type="button"
        data-testid="home-button"
        onClick={onBackHome}
        className="tap-target mt-4 rounded-full bg-lavender px-10 py-5 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95"
      >
        Home 🏠
      </button>
    </main>
  );
}

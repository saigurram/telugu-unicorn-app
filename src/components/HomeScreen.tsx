"use client";

import { useState } from "react";
import { MilaCharacter } from "./mila/MilaCharacter";
import { StreakBadge } from "./StreakBadge";
import { ParentGearPanel } from "./ParentGearPanel";
import { BackgroundDecor } from "./BackgroundDecor";
import { setChildName } from "@/lib/storage/storage";
import type { AppStorageV1 } from "@/lib/storage/schema";

interface HomeScreenProps {
  childName: string;
  streakCount: number;
  settings: AppStorageV1["settings"];
  onPlay: () => void;
  onChanged: () => void;
}

export function HomeScreen({ childName, streakCount, settings, onPlay, onChanged }: HomeScreenProps) {
  const [showGear, setShowGear] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const handleNameSubmit = () => {
    if (!nameDraft.trim()) return;
    setChildName(nameDraft.trim());
    onChanged();
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-5 py-6">
      <BackgroundDecor />

      <button
        type="button"
        onClick={() => setShowGear(true)}
        className="absolute right-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-xl shadow-md backdrop-blur transition-transform active:scale-90"
        aria-label="Parent settings"
      >
        ⚙️
      </button>

      {/* px-14 keeps the Telugu title clear of the gear button in the corner. */}
      <div className="relative z-10 mt-4 px-14 text-center">
        <h1 className="font-telugu text-4xl font-bold tracking-tight text-grape drop-shadow-sm">
          మిల యునికార్న్
        </h1>
        <p className="mt-1 text-lg font-semibold text-ink/60">Mila the Unicorn</p>
      </div>

      <div className="relative z-10 h-72 w-72 sm:h-80 sm:w-80">
        <MilaCharacter phase="IDLE" />
      </div>

      {childName ? (
        <div className="relative z-10 flex w-full flex-col items-center gap-5 pb-2">
          <StreakBadge streakCount={streakCount} />
          <button
            type="button"
            data-testid="play-button"
            onClick={onPlay}
            style={
              {
                "--btn-face": "linear-gradient(180deg, #ff74b8 0%, #ff4f9a 100%)",
                "--btn-edge": "#d62d78",
              } as React.CSSProperties
            }
            className="btn-chunky tap-target w-full max-w-xs px-8 text-2xl"
          >
            Play with Mila! ✨
          </button>
        </div>
      ) : (
        <div className="sticker relative z-10 flex w-full max-w-sm flex-col items-center gap-3 p-6">
          <p className="font-telugu text-center text-xl font-semibold text-ink">నీ పేరు ఏమిటి?</p>
          <p className="text-center text-sm font-medium text-ink/55">What&apos;s her name?</p>
          <input
            data-testid="child-name-input"
            className="w-full rounded-2xl border-[3px] border-grape/25 bg-white px-4 py-3.5 text-center text-lg font-semibold text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-grape"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Name"
            maxLength={30}
          />
          <button
            type="button"
            data-testid="name-submit-button"
            onClick={handleNameSubmit}
            style={
              {
                "--btn-face": "linear-gradient(180deg, #9a6bff 0%, #7c4dff 100%)",
                "--btn-edge": "#5a2ed6",
              } as React.CSSProperties
            }
            className="btn-chunky tap-target mt-1 w-full px-8 text-xl"
          >
            Let&apos;s go!
          </button>
        </div>
      )}

      {showGear && (
        <ParentGearPanel
          childName={childName}
          settings={settings}
          onClose={() => setShowGear(false)}
          onChanged={onChanged}
        />
      )}
    </main>
  );
}

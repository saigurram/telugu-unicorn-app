"use client";

import { useState } from "react";
import { MilaCharacter } from "./mila/MilaCharacter";
import { StreakBadge } from "./StreakBadge";
import { ParentGearPanel } from "./ParentGearPanel";
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
    <main className="relative flex flex-1 flex-col items-center justify-between px-6 py-10">
      <button
        type="button"
        onClick={() => setShowGear(true)}
        className="tap-target absolute right-2 top-2 flex items-center justify-center rounded-full text-2xl"
        aria-label="Parent settings"
      >
        ⚙️
      </button>

      <div className="mt-8 text-center">
        <h1 className="font-telugu text-3xl font-semibold text-ink">మిల యునికార్న్</h1>
        <p className="text-lg text-ink/70">Mila the Unicorn</p>
      </div>

      <div className="h-64 w-64">
        <MilaCharacter phase="IDLE" />
      </div>

      {childName ? (
        <div className="flex w-full flex-col items-center gap-6">
          <StreakBadge streakCount={streakCount} />
          <button
            type="button"
            data-testid="play-button"
            onClick={onPlay}
            className="tap-target w-full max-w-xs rounded-full bg-gradient-to-br from-lavender to-blush px-8 py-6 text-2xl font-semibold text-white shadow-lg transition-transform active:scale-95"
          >
            Play with Mila! ✨
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <p className="font-telugu text-center text-lg">నీ పేరు ఏమిటి?</p>
          <p className="text-center text-sm text-ink/60">What&apos;s her name?</p>
          <input
            data-testid="child-name-input"
            className="w-full rounded-xl border border-ink/20 px-4 py-3 text-center text-lg"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Name"
            maxLength={30}
          />
          <button
            type="button"
            data-testid="name-submit-button"
            onClick={handleNameSubmit}
            className="tap-target w-full rounded-full bg-lavender px-8 py-4 text-xl font-semibold text-white"
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

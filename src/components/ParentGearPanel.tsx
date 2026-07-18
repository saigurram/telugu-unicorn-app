"use client";

import { useState } from "react";
import { setChildName, setSettings } from "@/lib/storage/storage";
import type { AppStorageV1 } from "@/lib/storage/schema";

interface ParentGearPanelProps {
  childName: string;
  settings: AppStorageV1["settings"];
  onClose: () => void;
  onChanged: () => void;
}

/** The only settings surface in the app — name, session length, mute, captions. */
export function ParentGearPanel({ childName, settings, onClose, onChanged }: ParentGearPanelProps) {
  const [name, setName] = useState(childName);

  const handleSave = () => {
    if (name.trim()) setChildName(name.trim());
    onChanged();
    onClose();
  };

  const toggleSfx = () => {
    setSettings({ sfxMuted: !settings.sfxMuted });
    onChanged();
  };

  const toggleCaptions = () => {
    setSettings({ captionsEnabled: !settings.captionsEnabled });
    onChanged();
  };

  const setLength = (n: number) => {
    setSettings({ exchangeTarget: n });
    onChanged();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold">Parent Settings</h2>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-ink/70">Child&apos;s name</span>
          <input
            className="w-full rounded-xl border border-ink/20 px-4 py-3 text-lg"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
          />
        </label>

        <div className="mb-4">
          <span className="mb-1 block text-sm text-ink/70">Session length</span>
          <div className="flex gap-2">
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLength(n)}
                className={`tap-target flex-1 rounded-xl border-2 text-lg font-medium ${
                  settings.exchangeTarget === n ? "border-lavender bg-lavender/20" : "border-ink/10"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 flex items-center justify-between">
          <span>Mute sound effects</span>
          <input
            type="checkbox"
            checked={settings.sfxMuted}
            onChange={toggleSfx}
            className="h-6 w-6"
          />
        </label>

        <label className="mb-6 flex items-center justify-between">
          <span>Show Telugu captions</span>
          <input
            type="checkbox"
            checked={settings.captionsEnabled}
            onChange={toggleCaptions}
            className="h-6 w-6"
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          className="tap-target w-full rounded-2xl bg-lavender text-lg font-semibold text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}

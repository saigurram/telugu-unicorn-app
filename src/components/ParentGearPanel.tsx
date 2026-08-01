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

/** The only settings surface in the app — name, session length, mute, captions.
 *  Deliberately plainer than the child-facing screens: this is the grown-up
 *  corner, and it should not invite a 5-year-old to poke at it. */
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-5 text-xl font-bold text-ink">Parent Settings</h2>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-sm font-semibold text-ink/60">Child&apos;s name</span>
          <input
            className="w-full rounded-2xl border-[3px] border-grape/20 px-4 py-3 text-lg font-semibold text-ink outline-none transition-colors focus:border-grape"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
          />
        </label>

        <div className="mb-5">
          <span className="mb-1.5 block text-sm font-semibold text-ink/60">Session length</span>
          <div className="flex gap-2">
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLength(n)}
                className={`h-14 flex-1 rounded-2xl border-[3px] text-lg font-bold transition-colors ${
                  settings.exchangeTarget === n
                    ? "border-grape bg-grape/10 text-grape"
                    : "border-ink/10 text-ink/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 flex items-center justify-between font-medium">
          <span>Mute sound effects</span>
          <input
            type="checkbox"
            checked={settings.sfxMuted}
            onChange={toggleSfx}
            className="h-6 w-6 accent-[#7c4dff]"
          />
        </label>

        <label className="mb-6 flex items-center justify-between font-medium">
          <span>Show Telugu captions</span>
          <input
            type="checkbox"
            checked={settings.captionsEnabled}
            onChange={toggleCaptions}
            className="h-6 w-6 accent-[#7c4dff]"
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          style={
            {
              "--btn-face": "linear-gradient(180deg, #9a6bff 0%, #7c4dff 100%)",
              "--btn-edge": "#5a2ed6",
            } as React.CSSProperties
          }
          className="btn-chunky h-14 w-full text-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}

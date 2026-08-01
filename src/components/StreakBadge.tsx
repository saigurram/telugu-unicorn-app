interface StreakBadgeProps {
  streakCount: number;
}

/** Visual-only streak display — no lost-streak guilt messaging, ever. */
export function StreakBadge({ streakCount }: StreakBadgeProps) {
  if (streakCount <= 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-lg font-bold text-ink shadow-[0_4px_0_rgba(59,42,77,0.12)]">
      <span className="text-xl" aria-hidden="true">
        🔥
      </span>
      <span>
        {streakCount} day{streakCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}

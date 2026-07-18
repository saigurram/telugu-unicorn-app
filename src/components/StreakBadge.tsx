interface StreakBadgeProps {
  streakCount: number;
}

/** Visual-only streak display — no lost-streak guilt messaging, ever. */
export function StreakBadge({ streakCount }: StreakBadgeProps) {
  if (streakCount <= 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-lg font-medium text-ink shadow-sm">
      <span aria-hidden="true">⭐</span>
      <span>
        {streakCount} day{streakCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}

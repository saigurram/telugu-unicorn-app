"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-5xl" aria-hidden="true">
        ✨🦄✨
      </p>
      <p className="font-telugu text-2xl font-semibold text-ink">
        మిల కాసేపు విశ్రాంతి తీసుకుంటోంది!
      </p>
      <p className="text-lg text-ink/70">Mila is taking a quick nap. Let&apos;s try again!</p>
      <button
        type="button"
        onClick={reset}
        className="tap-target rounded-full bg-lavender px-8 py-4 text-xl font-semibold text-white shadow-lg"
      >
        Try Again
      </button>
    </main>
  );
}

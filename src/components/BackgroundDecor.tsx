const CLOUDS = [
  { left: "-6%", top: "12%", size: 150, delay: "0s", duration: "9s", opacity: 0.55 },
  { left: "68%", top: "6%", size: 110, delay: "1.4s", duration: "11s", opacity: 0.45 },
  { left: "76%", top: "62%", size: 170, delay: "0.7s", duration: "10s", opacity: 0.4 },
  { left: "-10%", top: "70%", size: 130, delay: "2.1s", duration: "12s", opacity: 0.42 },
];

const STARS = [
  { left: "16%", top: "8%", size: 16, delay: "0s" },
  { left: "86%", top: "26%", size: 12, delay: "0.9s" },
  { left: "8%", top: "44%", size: 13, delay: "1.7s" },
  { left: "92%", top: "50%", size: 10, delay: "2.4s" },
  { left: "24%", top: "84%", size: 14, delay: "1.2s" },
  { left: "70%", top: "88%", size: 11, delay: "0.4s" },
];

/**
 * Purely decorative parallax layer: soft clouds drifting behind everything
 * plus twinkling stars. Sits at z-0 with pointer-events off so it can never
 * intercept a tap meant for Mila or a button.
 */
export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {CLOUDS.map((cloud, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute rounded-full bg-white blur-xl"
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.size,
            height: cloud.size * 0.6,
            opacity: cloud.opacity,
            animation: `drift ${cloud.duration} ease-in-out ${cloud.delay} infinite`,
          }}
        />
      ))}
      {STARS.map((star, i) => (
        <svg
          key={`star-${i}`}
          viewBox="0 0 24 24"
          className="absolute text-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animation: `twinkle 3.4s ease-in-out ${star.delay} infinite`,
          }}
        >
          <path
            d="M12 2 L14.2 8.4 L21 12 L14.2 15.6 L12 22 L9.8 15.6 L3 12 L9.8 8.4 Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

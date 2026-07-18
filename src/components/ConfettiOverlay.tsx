const COLORS = ["#c9a7f0", "#a7d8f0", "#a7e8d8", "#f7b6d2", "#f4c95d"];
const PIECE_COUNT = 28;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, (_, i) => ({
  left: (i * 137.5) % 100,
  delay: (i % 7) * 0.15,
  duration: 2.4 + (i % 5) * 0.3,
  color: COLORS[i % COLORS.length],
  size: 8 + (i % 4) * 3,
}));

/** CSS-only confetti — no external library, per spec §9. */
export function ConfettiOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

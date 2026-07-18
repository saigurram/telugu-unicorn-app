import styles from "./mila.module.css";

interface MilaSvgProps {
  /** Fires when the finite celebration "jump" animation completes — used
   * as the CELEBRATION→IDLE trigger. Idle/talking body animations loop
   * infinitely and never emit this event, so no state/name check is needed. */
  onBodyAnimationEnd?: (event: React.AnimationEvent<SVGGElement>) => void;
}

/**
 * Single layered SVG for Mila — original pastel unicorn design (spec §8).
 * All 4 visual states (idle/talking/listening/celebrating) are driven purely
 * by CSS via the `data-state` attribute set on the root group; no part of
 * this markup changes between states, so animations never restart mid-cycle.
 */
export function MilaSvg({ onBodyAnimationEnd }: MilaSvgProps) {
  return (
    <svg
      viewBox="0 0 300 260"
      className={styles.svgRoot}
      role="img"
      aria-label="Mila the unicorn"
    >
      <g className={styles.tail}>
        <path
          d="M60 190 C30 200, 20 170, 35 150 C45 165, 55 175, 65 185 Z"
          fill="#f7b6d2"
        />
        <path
          d="M55 180 C28 185, 22 160, 32 145 C40 158, 48 168, 58 175 Z"
          fill="#a7e8d8"
        />
      </g>

      <g className={styles.body} onAnimationEnd={onBodyAnimationEnd}>
        <ellipse cx="150" cy="175" rx="70" ry="50" fill="#fffaf3" />
        <ellipse cx="150" cy="150" rx="55" ry="50" fill="#fffaf3" />
      </g>

      <g className={styles.earLeft}>
        <path d="M110 108 L100 70 L128 100 Z" fill="#fffaf3" stroke="#f0c9dd" strokeWidth="2" />
        <path d="M112 104 L106 82 L124 100 Z" fill="#f7b6d2" />
      </g>
      <g className={styles.earRight}>
        <path d="M190 108 L200 70 L172 100 Z" fill="#fffaf3" stroke="#f0c9dd" strokeWidth="2" />
        <path d="M188 104 L194 82 L176 100 Z" fill="#f7b6d2" />
      </g>

      <path
        className={styles.horn}
        d="M150 60 L142 108 L158 108 Z"
        fill="url(#hornGradient)"
        stroke="#e8b84b"
        strokeWidth="1.5"
      />
      <defs>
        <linearGradient id="hornGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#f4c95d" />
        </linearGradient>
      </defs>

      <g className={styles.mane}>
        <path d="M95 110 C70 100, 65 140, 85 160 C75 145, 85 120, 105 118 Z" fill="#c9a7f0" />
        <path d="M100 95 C80 90, 78 125, 95 140 C88 122, 95 105, 112 105 Z" fill="#a7d8f0" />
        <path d="M205 110 C230 100, 235 140, 215 160 C225 145, 215 120, 195 118 Z" fill="#c9a7f0" />
      </g>

      <g className={styles.eyeLeft}>
        <ellipse cx="128" cy="148" rx="13" ry="15" fill="#ffffff" />
        <circle cx="130" cy="151" r="7" fill="#5b4636" />
        <circle cx="133" cy="147" r="2.2" fill="#ffffff" />
        <rect
          className={styles.eyelidLeft}
          x="113"
          y="130"
          width="30"
          height="18"
          fill="#fffaf3"
        />
      </g>
      <g className={styles.eyeRight}>
        <ellipse cx="172" cy="148" rx="13" ry="15" fill="#ffffff" />
        <circle cx="174" cy="151" r="7" fill="#5b4636" />
        <circle cx="177" cy="147" r="2.2" fill="#ffffff" />
        <rect
          className={styles.eyelidRight}
          x="157"
          y="130"
          width="30"
          height="18"
          fill="#fffaf3"
        />
      </g>

      <ellipse cx="112" cy="168" rx="8" ry="5" fill="#f9c8dc" opacity="0.7" />
      <ellipse cx="188" cy="168" rx="8" ry="5" fill="#f9c8dc" opacity="0.7" />

      <g className={styles.mouth}>
        <path
          className={styles.mouthClosed}
          d="M138 172 Q150 180 162 172"
          fill="none"
          stroke="#c98aa8"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className={styles.mouthOpen}
          d="M138 172 Q150 190 162 172 Q150 182 138 172 Z"
          fill="#a8607f"
        />
      </g>

      <circle className={styles.glowRing} cx="150" cy="120" r="90" fill="none" stroke="#8fd9c4" strokeWidth="4" />

      <g className={styles.sparkles}>
        <path className={styles.sparkle1} d="M60 90 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#ffe28a" />
        <path className={styles.sparkle2} d="M235 130 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="#a7d8f0" />
        <path className={styles.sparkle3} d="M90 210 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="#f7b6d2" />
        <path className={styles.sparkle4} d="M215 205 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" fill="#c9a7f0" />
      </g>
    </svg>
  );
}

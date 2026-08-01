import styles from "./mila.module.css";

interface MilaSvgProps {
  /** Fires when the finite celebration "jump" animation completes — used
   * as the CELEBRATION→IDLE trigger. Idle/talking animations loop
   * infinitely and never emit this event, so no state/name check is needed. */
  onBodyAnimationEnd?: (event: React.AnimationEvent<SVGGElement>) => void;
}

/**
 * Mila — a chibi unicorn drawn as one layered SVG (spec §8).
 *
 * Built in depth order (tail → body → back mane → head → face → effects) so
 * shapes overlap like a sticker illustration rather than a flat diagram, and
 * every part that needs to move independently sits in its own <g>. All four
 * visual states (idle/talking/listening/celebrating) are driven purely by CSS
 * off the `data-state` attribute on the wrapper — this markup never changes
 * between states, so looping animations never restart mid-cycle.
 */
export function MilaSvg({ onBodyAnimationEnd }: MilaSvgProps) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={styles.svgRoot}
      role="img"
      aria-label="Mila the unicorn"
    >
      <defs>
        <linearGradient id="hornGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6d6" />
          <stop offset="100%" stopColor="#ffb020" />
        </linearGradient>
        <linearGradient id="maneGrad1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4f9a" />
          <stop offset="100%" stopColor="#7c4dff" />
        </linearGradient>
        <linearGradient id="maneGrad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ec5ff" />
          <stop offset="100%" stopColor="#1fd0a3" />
        </linearGradient>
        <linearGradient id="maneGrad3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc53d" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
        <radialGradient id="headShade" cx="0.5" cy="0.1" r="0.9">
          <stop offset="0%" stopColor="#efe0ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#c8b0e8" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <g className={styles.floatGroup}>
        <g className={styles.character} onAnimationEnd={onBodyAnimationEnd}>
          {/* ---------- tail (behind everything) ---------- */}
          <g className={styles.tail}>
            <path
              d="M88 216 C50 202, 32 234, 48 264 C46 238, 64 226, 90 234 Z"
              fill="url(#maneGrad1)"
              stroke="#5b3f7a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M92 226 C56 218, 42 248, 58 272 C54 248, 70 240, 94 244 Z"
              fill="url(#maneGrad2)"
              stroke="#5b3f7a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>

          {/* ---------- body + hooves ---------- */}
          <g className={styles.body}>
            <rect x="110" y="262" width="28" height="22" rx="11" fill="#e9d5ff" stroke="#5b3f7a" strokeWidth="3" />
            <rect x="162" y="262" width="28" height="22" rx="11" fill="#e9d5ff" stroke="#5b3f7a" strokeWidth="3" />
            <ellipse cx="150" cy="232" rx="58" ry="42" fill="#fffdfb" stroke="#5b3f7a" strokeWidth="3" />
          </g>

          {/* ---------- mane behind the head ---------- */}
          <g className={styles.maneBack}>
            <path d="M100 84 C62 74, 38 108, 54 148 C50 114, 72 94, 104 98 Z" fill="url(#maneGrad1)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M96 108 C58 106, 42 146, 62 176 C54 146, 72 124, 100 122 Z" fill="url(#maneGrad2)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M94 134 C60 140, 52 178, 74 200 C64 174, 78 152, 100 148 Z" fill="url(#maneGrad3)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M200 84 C238 74, 262 108, 246 148 C250 114, 228 94, 196 98 Z" fill="url(#maneGrad1)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M204 108 C242 106, 258 146, 238 176 C246 146, 228 124, 200 122 Z" fill="url(#maneGrad2)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M206 134 C240 140, 248 178, 226 200 C236 174, 222 152, 200 148 Z" fill="url(#maneGrad3)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
          </g>

          {/* ---------- head ---------- */}
          <g className={styles.head}>
            <g className={styles.earLeft}>
              <path d="M104 96 L88 52 L134 84 Z" fill="#fffdfb" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
              <path d="M106 92 L96 66 L126 84 Z" fill="#ff9dc4" />
            </g>
            <g className={styles.earRight}>
              <path d="M196 96 L212 52 L166 84 Z" fill="#fffdfb" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
              <path d="M194 92 L204 66 L174 84 Z" fill="#ff9dc4" />
            </g>

            <g className={styles.horn}>
              <path d="M150 28 L134 88 L166 88 Z" fill="url(#hornGrad)" stroke="#e59a10" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M138 76 Q150 71 162 76" stroke="#fff6d6" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
              <path d="M141 63 Q150 58 159 63" stroke="#fff6d6" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.85" />
              <path d="M144 50 Q150 46 156 50" stroke="#fff6d6" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" />
            </g>

            <ellipse cx="150" cy="142" rx="80" ry="74" fill="#fffdfb" stroke="#5b3f7a" strokeWidth="3" />
            <ellipse cx="150" cy="142" rx="80" ry="74" fill="url(#headShade)" />
            <ellipse cx="126" cy="100" rx="34" ry="18" fill="#ffffff" opacity="0.75" />

            {/* forelock, drawn over the head */}
            <path d="M150 74 C128 72, 114 94, 122 112 C126 94, 138 82, 152 84 Z" fill="url(#maneGrad1)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M150 74 C172 72, 186 94, 178 112 C174 94, 162 82, 148 84 Z" fill="url(#maneGrad2)" stroke="#5b3f7a" strokeWidth="3" strokeLinejoin="round" />

            {/* ---------- face ---------- */}
            <g className={styles.eyeLeft}>
              <ellipse cx="118" cy="148" rx="21" ry="23" fill="#ffffff" stroke="#5b3f7a" strokeWidth="2.5" />
              <circle cx="121" cy="152" r="13" fill="#3b2a4d" />
              <circle cx="115" cy="145" r="5.5" fill="#ffffff" />
              <circle cx="127" cy="160" r="2.6" fill="#ffffff" opacity="0.9" />
              <rect className={styles.eyelidLeft} x="95" y="120" width="48" height="54" fill="#fffdfb" />
              <path d="M99 128 L91 121 M96 136 L87 132" stroke="#5b3f7a" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g className={styles.eyeRight}>
              <ellipse cx="182" cy="148" rx="21" ry="23" fill="#ffffff" stroke="#5b3f7a" strokeWidth="2.5" />
              <circle cx="179" cy="152" r="13" fill="#3b2a4d" />
              <circle cx="173" cy="145" r="5.5" fill="#ffffff" />
              <circle cx="185" cy="160" r="2.6" fill="#ffffff" opacity="0.9" />
              <rect className={styles.eyelidRight} x="157" y="120" width="48" height="54" fill="#fffdfb" />
              <path d="M201 128 L209 121 M204 136 L213 132" stroke="#5b3f7a" strokeWidth="3" strokeLinecap="round" />
            </g>

            <ellipse className={styles.cheekLeft} cx="98" cy="178" rx="16" ry="10.5" fill="#ff9dc4" opacity="0.65" />
            <ellipse className={styles.cheekRight} cx="202" cy="178" rx="16" ry="10.5" fill="#ff9dc4" opacity="0.65" />

            <ellipse cx="150" cy="184" rx="32" ry="24" fill="#fff2f7" />
            <ellipse cx="140" cy="178" rx="2.6" ry="3.4" fill="#d9a0bc" />
            <ellipse cx="160" cy="178" rx="2.6" ry="3.4" fill="#d9a0bc" />

            <g className={styles.mouth}>
              <path
                className={styles.mouthClosed}
                d="M136 192 Q150 203 164 192"
                fill="none"
                stroke="#b46a8c"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <g className={styles.mouthOpen}>
                <ellipse cx="150" cy="197" rx="14" ry="10" fill="#c76b93" />
                <ellipse cx="150" cy="202" rx="8" ry="5" fill="#ff8fb0" />
              </g>
            </g>
          </g>
        </g>

        {/* ---------- effects ---------- */}
        <circle className={styles.glowRing} cx="150" cy="168" r="120" fill="none" stroke="#1fd0a3" strokeWidth="5" />

        <g className={styles.sparkles}>
          <path className={styles.sparkle1} d="M52 73 L55.6 82.4 L65 86 L55.6 89.6 L52 99 L48.4 89.6 L39 86 L48.4 82.4 Z" fill="#ffc53d" />
          <path className={styles.sparkle2} d="M246 93 L249.1 100.9 L257 104 L249.1 107.1 L246 115 L242.9 107.1 L235 104 L242.9 100.9 Z" fill="#3ec5ff" />
          <path className={styles.sparkle3} d="M42 182 L44.8 189.2 L52 192 L44.8 194.8 L42 202 L39.2 194.8 L32 192 L39.2 189.2 Z" fill="#ff4f9a" />
          <path className={styles.sparkle4} d="M258 186 L261.4 194.6 L270 198 L261.4 201.4 L258 210 L254.6 201.4 L246 198 L254.6 194.6 Z" fill="#7c4dff" />
          <path className={styles.sparkle5} d="M206 37 L208.5 43.5 L215 46 L208.5 48.5 L206 55 L203.5 48.5 L197 46 L203.5 43.5 Z" fill="#1fd0a3" />
        </g>
      </g>
    </svg>
  );
}

import styles from './SignalMeter.module.css';

const MIN_ANGLE = -65; // degrees, needle at zero
const MAX_ANGLE = 65;  // degrees, needle at full signal

export function SignalMeter({ strength = 0 }) {
  const angle = MIN_ANGLE + strength * (MAX_ANGLE - MIN_ANGLE);

  return (
    <div className={styles.panel}>
      <svg
        className={styles.meter}
        viewBox="0 0 200 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Signal strength ${Math.round(strength * 100)}%`}
      >
        <defs>
          <radialGradient id="meterFace" cx="50%" cy="90%" r="80%">
            <stop offset="0%" stopColor="#d4c88a" />
            <stop offset="100%" stopColor="#b8a85c" />
          </radialGradient>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Meter body */}
        <rect x="2" y="2" width="196" height="96" rx="8" ry="8"
          fill="url(#meterFace)"
          stroke="#7a6020" strokeWidth="3"
        />

        {/* Scale arc ticks */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const frac = i / 8;
          const a = (MIN_ANGLE + frac * (MAX_ANGLE - MIN_ANGLE)) * (Math.PI / 180);
          const cx = 100, cy = 105, r1 = 72, r2 = i % 2 === 0 ? 62 : 66;
          return (
            <line
              key={i}
              x1={cx + r1 * Math.sin(a)} y1={cy - r1 * Math.cos(a)}
              x2={cx + r2 * Math.sin(a)} y2={cy - r2 * Math.cos(a)}
              stroke="#4a3800" strokeWidth={i % 2 === 0 ? 1.5 : 1}
            />
          );
        })}

        {/* S-meter labels */}
        {['1','3','5','7','9'].map((label, i) => {
          const frac = (i * 2) / 8;
          const a = (MIN_ANGLE + frac * (MAX_ANGLE - MIN_ANGLE)) * (Math.PI / 180);
          const cx = 100, cy = 105, r = 55;
          return (
            <text
              key={label}
              x={cx + r * Math.sin(a)}
              y={cy - r * Math.cos(a) + 4}
              textAnchor="middle"
              fontSize="9"
              fill="#3a2c00"
              fontFamily="Georgia, serif"
            >
              {label}
            </text>
          );
        })}

        {/* "S" label */}
        <text x="100" y="88" textAnchor="middle" fontSize="8" fill="#4a3800"
          fontFamily="Georgia, serif" fontStyle="italic">
          SIGNAL
        </text>

        {/* Colored zone arc (green→yellow→red) */}
        <path
          d={describeArc(100, 105, 74, MIN_ANGLE, MIN_ANGLE + (MAX_ANGLE - MIN_ANGLE) * 0.5)}
          fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity="0.6"
        />
        <path
          d={describeArc(100, 105, 74, MIN_ANGLE + (MAX_ANGLE - MIN_ANGLE) * 0.5, MIN_ANGLE + (MAX_ANGLE - MIN_ANGLE) * 0.8)}
          fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" opacity="0.6"
        />
        <path
          d={describeArc(100, 105, 74, MIN_ANGLE + (MAX_ANGLE - MIN_ANGLE) * 0.8, MAX_ANGLE)}
          fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" opacity="0.6"
        />

        {/* Needle */}
        <g transform={`rotate(${angle}, 100, 105)`} filter="url(#needleGlow)">
          <line x1="100" y1="105" x2="100" y2="36"
            stroke="#cc0000" strokeWidth="2" strokeLinecap="round"
          />
          <circle cx="100" cy="105" r="4" fill="#8B0000" />
        </g>
      </svg>
      <div className={styles.label}>S-METER</div>
    </div>
  );
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => d * (Math.PI / 180);
  const x1 = cx + r * Math.sin(toRad(startDeg));
  const y1 = cy - r * Math.cos(toRad(startDeg));
  const x2 = cx + r * Math.sin(toRad(endDeg));
  const y2 = cy - r * Math.cos(toRad(endDeg));
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

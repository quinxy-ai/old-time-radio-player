import styles from './SpeakerGrill.module.css';

export function SpeakerGrill() {
  return (
    <div className={styles.grill} aria-hidden="true">
      <div className={styles.grillInner}>
        <svg
          className={styles.grillSvg}
          viewBox="0 0 300 140"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Art deco vertical bars pattern */}
            <pattern id="grillBars" x="0" y="0" width="12" height="140" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="8" height="140" fill="rgba(0,0,0,0.55)" />
              <rect x="8" y="0" width="4" height="140" fill="rgba(255,255,255,0.03)" />
            </pattern>
            {/* Horizontal shadow bands for depth */}
            <linearGradient id="grillDepth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
              <stop offset="30%" stopColor="rgba(0,0,0,0.2)" />
              <stop offset="70%" stopColor="rgba(0,0,0,0.2)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
            </linearGradient>
            {/* Gold art deco top/bottom borders */}
          </defs>
          <rect width="300" height="140" fill="url(#grillBars)" />
          <rect width="300" height="140" fill="url(#grillDepth)" />
        </svg>
      </div>
    </div>
  );
}

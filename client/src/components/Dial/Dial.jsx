import { useRef } from 'react';
import { useDial } from '../../hooks/useDial.js';
import styles from './Dial.module.css';

const FREQ_MIN = 540;
const FREQ_MAX = 1600;

// Frequency labels and their approximate positions on AM band
const MAJOR_TICKS = [540, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1600];
const MINOR_TICKS = [550, 560, 570, 580, 590, 620, 640, 660, 680,
  720, 740, 760, 780, 820, 840, 860, 880,
  920, 940, 960, 980, 1020, 1040, 1060, 1080,
  1120, 1140, 1160, 1180, 1220, 1240, 1260, 1280,
  1320, 1340, 1360, 1380, 1420, 1440, 1460, 1480,
  1500, 1520, 1540, 1560, 1580];

function freqToX(freq, width) {
  return ((freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * width;
}

export function Dial({ dialPosition, onPositionChange, stations = [] }) {
  const containerRef = useRef(null);
  const { onPointerDown, onPointerMove, onPointerUp } = useDial(onPositionChange);

  function handlePointerDown(e) {
    const width = containerRef.current?.offsetWidth ?? 1;
    onPointerDown(e, dialPosition);
    // Store width on the event for use in move
    e.currentTarget._dialWidth = width;
  }

  function handlePointerMove(e) {
    const width = e.currentTarget._dialWidth ?? containerRef.current?.offsetWidth ?? 1;
    onPointerMove(e, width);
  }

  const frequency = Math.round(FREQ_MIN + dialPosition * (FREQ_MAX - FREQ_MIN));

  // SVG viewBox dimensions
  const VW = 300;
  const VH = 64;

  const needleX = dialPosition * VW;

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Dial face — draggable */}
      <div
        className={styles.dialFace}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={`Tuning dial, currently ${frequency} kHz`}
        role="slider"
        aria-valuemin={FREQ_MIN}
        aria-valuemax={FREQ_MAX}
        aria-valuenow={frequency}
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className={styles.scaleSvg}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="dialFaceBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0e8c0" />
              <stop offset="50%" stopColor="#e8dca8" />
              <stop offset="100%" stopColor="#ddd098" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect width={VW} height={VH} fill="url(#dialFaceBg)" />

          {/* Minor ticks */}
          {MINOR_TICKS.map((f) => (
            <line
              key={f}
              x1={freqToX(f, VW)} y1={0}
              x2={freqToX(f, VW)} y2={8}
              stroke="#7a6020" strokeWidth={0.7}
            />
          ))}

          {/* Major ticks and labels */}
          {MAJOR_TICKS.map((f, i) => {
            const x = freqToX(f, VW);
            const anchor =
              i === 0 ? 'start' : i === MAJOR_TICKS.length - 1 ? 'end' : 'middle';
            const labelX =
              i === 0 ? Math.max(x, 2) : i === MAJOR_TICKS.length - 1 ? Math.min(x, VW - 2) : x;
            return (
              <g key={f}>
                <line
                  x1={x} y1={0}
                  x2={x} y2={14}
                  stroke="#4a3000" strokeWidth={1.2}
                />
                <text
                  x={labelX}
                  y={28}
                  textAnchor={anchor}
                  fontSize={f >= 1000 ? 7.5 : 9}
                  fill="#3a2800"
                  fontFamily="Georgia, serif"
                  fontWeight="bold"
                >
                  {Math.round(f / 10)}
                </text>
              </g>
            );
          })}

          {/* Station dots — small colored dots on the scale */}
          {stations.map((s) => (
            <circle
              key={s.id}
              cx={freqToX(s.frequency, VW)}
              cy={VH - 10}
              r={3}
              fill="#cc3300"
              opacity={0.7}
            />
          ))}

          {/* Bottom line */}
          <line x1={0} y1={VH - 1} x2={VW} y2={VH - 1} stroke="#7a6020" strokeWidth={0.5} />

          {/* Tuning needle — red vertical line */}
          <line
            x1={needleX} y1={0}
            x2={needleX} y2={VH}
            stroke="#cc1111"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Needle top triangle */}
          <polygon
            points={`${needleX - 4},0 ${needleX + 4},0 ${needleX},8`}
            fill="#cc1111"
          />
        </svg>
      </div>

      {/* Frequency readout */}
      <div className={styles.freqReadout}>
        <span className={styles.freqValue}>{frequency}</span>
        <span className={styles.freqUnit}>kHz</span>
      </div>
    </div>
  );
}

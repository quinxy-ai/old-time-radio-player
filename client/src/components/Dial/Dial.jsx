import { useState, useEffect, useRef } from 'react';
import { useKnob } from '../../hooks/useKnob.js';
import styles from './Dial.module.css';

const FREQ_MIN = 540;
const FREQ_MAX = 1600;

// Arc from -150° (7 o'clock, 540 kHz) to +150° (5 o'clock, 1600 kHz)
// 0° = 12 o'clock, positive = clockwise
const ARC_MIN = -150;
const ARC_MAX = 150;
const TUNING_SENSITIVITY = 0.12; // fraction of full dial range per full knob revolution

// SVG coordinate system: 0° at top, clockwise positive
function polar(cx, cy, r, angleDeg) {
  const rad = angleDeg * (Math.PI / 180);
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function freqToAngle(freq) {
  const t = (freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN);
  return ARC_MIN + t * (ARC_MAX - ARC_MIN);
}

function arcPath(cx, cy, r, startDeg, endDeg, sweep) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const spanDeg = Math.abs(endDeg - startDeg);
  const large = spanDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)},${s.y.toFixed(2)} A ${r},${r} 0 ${large} ${sweep} ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
}

const CX = 150, CY = 150;
const R_BEZEL    = 147;
const R_FACE     = 137;
const R_TICK_OUT = 126;
const R_MAJ_IN   = 108;
const R_MIN_IN   = 118;
const R_LABEL    = 95;
const R_NEEDLE   = 114;
const R_TAIL     = 22;
const R_DOT      = 131;

const MAJOR_FREQS = [540, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1600];
const MINOR_FREQS = [
  550,560,570,580,590, 620,640,660,680,
  720,740,760,780, 820,840,860,880,
  920,940,960,980, 1020,1040,1060,1080,
  1120,1140,1160,1180, 1220,1240,1260,1280,
  1320,1340,1360,1380, 1420,1440,1460,1480,
  1500,1520,1540,1560,1580,
];

// Text anchor based on angular position
function textAnchor(angleDeg) {
  if (angleDeg < -30) return 'end';
  if (angleDeg > 30) return 'start';
  return 'middle';
}

const DOT_COLORS = {
  genre:     { fill: '#cc2200', opacity: 0.75 },
  fixed:     { fill: '#1a5fc8', opacity: 0.80 },
  misc:      { fill: '#cc8800', opacity: 0.75 },
  favorites: { fill: '#cc8800', opacity: 0.75 },
};

function getVisibleDots(stations, dialMode) {
  return stations.filter((s) => {
    if (s.type === 'favorites' || s.type === 'misc') return true;
    if (dialMode === 'genre') return s.type === 'genre';
    if (dialMode === 'fixed') return s.type === 'fixed';
    return false;
  });
}

export function Dial({ dialPosition, onPositionChange, stations = [], signalStrength = 0, dialMode = 'genre' }) {
  const needleAngle = freqToAngle(FREQ_MIN + dialPosition * (FREQ_MAX - FREQ_MIN));
  const frequency = Math.round(FREQ_MIN + dialPosition * (FREQ_MAX - FREQ_MIN));

  const { onPointerDown, onPointerMove, onPointerUp } = useKnob((delta) => {
    const next = Math.max(0, Math.min(1, dialPosition + delta * TUNING_SENSITIVITY));
    onPositionChange(next);
  });

  // Needle wiggle — damped random walk, only active when signal is present
  const wiggleVel = useRef(0);
  const [wiggleDeg, setWiggleDeg] = useState(0);
  const isActive = signalStrength > 0.01;
  useEffect(() => {
    if (!isActive) { wiggleVel.current = 0; setWiggleDeg(0); return; }
    const id = setInterval(() => {
      // Impulse ± scaled by signal strength; 60 % velocity retention gives inertia
      wiggleVel.current = wiggleVel.current * 0.60 + (Math.random() - 0.5) * 3 * signalStrength;
      setWiggleDeg(v => {
        const next = v + wiggleVel.current;
        // Soft-clamp so needle stays near the arc
        wiggleVel.current *= next > 4 || next < -4 ? -0.5 : 1;
        return Math.max(-5, Math.min(5, next));
      });
    }, 90);
    return () => clearInterval(id);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const tip  = polar(CX, CY, R_NEEDLE, needleAngle);
  const tail = polar(CX, CY, R_TAIL,   needleAngle + 180);

  return (
    <div className={styles.dialWrapper}>
      <svg
        viewBox="0 0 300 300"
        className={styles.dialSvg}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label={`Tuning dial, ${frequency} kHz`}
        aria-valuemin={FREQ_MIN}
        aria-valuemax={FREQ_MAX}
        aria-valuenow={frequency}
        tabIndex={0}
      >
        <defs>
          {/* Dial face gradient — ivory centre fading to warm cream at edges */}
          <radialGradient id="dialFace" cx="50%" cy="45%" r="55%">
            <stop offset="0%"   stopColor="#f8f0d0" />
            <stop offset="70%"  stopColor="#e8dca8" />
            <stop offset="100%" stopColor="#d8cc90" />
          </radialGradient>

          {/* Bezel gradient — gold ring */}
          <radialGradient id="bezelGrad" cx="45%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#e8c96a" />
            <stop offset="40%"  stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#7a6020" />
          </radialGradient>

          {/* Glass dome highlight */}
          <radialGradient id="glassDome" cx="40%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.30)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.04)" />
          </radialGradient>

          {/* Drop shadow filter for needle */}
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.4" />
          </filter>

          {/* Clip to dial face circle */}
          <clipPath id="faceClip">
            <circle cx={CX} cy={CY} r={R_FACE} />
          </clipPath>
        </defs>

        {/* ── Bezel ring ── */}
        <circle cx={CX} cy={CY} r={R_BEZEL} fill="url(#bezelGrad)" />
        <circle cx={CX} cy={CY} r={R_BEZEL - 4} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* ── Dial face ── */}
        <circle cx={CX} cy={CY} r={R_FACE} fill="url(#dialFace)" />

        {/* ── Dead-zone arc (bottom 60°, between stations) ── */}
        <path
          d={arcPath(CX, CY, R_TICK_OUT, ARC_MAX, ARC_MIN + 360, 1)}
          fill="none" stroke="#c8ba80" strokeWidth="14" strokeLinecap="butt"
          clipPath="url(#faceClip)"
        />

        {/* ── Active scale arc (background track) ── */}
        <path
          d={arcPath(CX, CY, R_TICK_OUT - 7, ARC_MIN, ARC_MAX, 1)}
          fill="none" stroke="#b8aa70" strokeWidth="1" strokeLinecap="round" opacity="0.4"
        />

        {/* ── Minor ticks ── */}
        {MINOR_FREQS.map((f) => {
          const a = freqToAngle(f);
          const outer = polar(CX, CY, R_TICK_OUT, a);
          const inner = polar(CX, CY, R_MIN_IN, a);
          return (
            <line key={f}
              x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke="#7a6020" strokeWidth="0.8"
            />
          );
        })}

        {/* ── Major ticks + labels ── */}
        {MAJOR_FREQS.map((f) => {
          const a  = freqToAngle(f);
          const outer  = polar(CX, CY, R_TICK_OUT, a);
          const inner  = polar(CX, CY, R_MAJ_IN,   a);
          const lp     = polar(CX, CY, R_LABEL,    a);
          const anchor = textAnchor(a);
          return (
            <g key={f}>
              <line
                x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                stroke="#4a3000" strokeWidth="1.8"
              />
              <text
                x={lp.x} y={lp.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="9.5"
                fontWeight="bold"
                fontFamily="Georgia, serif"
                fill="#3a2800"
              >
                {Math.round(f / 10)}
              </text>
            </g>
          );
        })}

        {/* ── Embedded S-meter: arc scale + needle emerging from slit ── */}
        {(() => {
          const S_START = 153, S_SPAN = 54;
          const R_SIG  = 113, SW = 7;   // coloured arc centre radius & stroke width
          // Slit sits just inside the inner edge of the arc (R_SIG - SW/2 - 2 = 104.5 → 104)
          const R_SLIT = 104;
          const g1 = S_START + S_SPAN * 0.25;  // 25 % — red/yellow boundary
          const g2 = S_START + S_SPAN * 0.50;  // 50 % — yellow/green boundary
          const sigAngle   = Math.max(S_START, Math.min(S_START + S_SPAN,
                               S_START + signalStrength * S_SPAN + wiggleDeg));
          // Needle only visible from the slit outward; origin hidden under dial face
          const needleBase = polar(CX, CY, R_SLIT,        sigAngle);
          const needleTip  = polar(CX, CY, R_SIG + SW / 2 + 3, sigAngle); // tip clears arc outer edge

          return (
            <g>
              {/* Coloured zone arcs — the scale background */}
              <path d={arcPath(CX, CY, R_SIG, S_START, g1, 1)}
                fill="none" stroke="rgba(220,55,35,0.55)" strokeWidth={SW} strokeLinecap="butt" />
              <path d={arcPath(CX, CY, R_SIG, g1, g2, 1)}
                fill="none" stroke="rgba(220,185,0,0.55)" strokeWidth={SW} strokeLinecap="butt" />
              <path d={arcPath(CX, CY, R_SIG, g2, S_START + S_SPAN, 1)}
                fill="none" stroke="rgba(50,190,50,0.55)" strokeWidth={SW} strokeLinecap="butt" />

              {/* Scale ticks at 0 %, 50 %, 100 % */}
              {[0, 0.5, 1].map((f) => {
                const a  = S_START + f * S_SPAN;
                const o  = polar(CX, CY, R_SIG + SW / 2 + 2, a);
                const i2 = polar(CX, CY, R_SIG - SW / 2 - 2, a);
                return (
                  <line key={f}
                    x1={o.x} y1={o.y} x2={i2.x} y2={i2.y}
                    stroke="rgba(74,48,0,0.55)" strokeWidth="1" />
                );
              })}

              {/* SIG label */}
              <text x={CX} y={CY + 126} textAnchor="middle" fontSize="5.5"
                fill="rgba(74,48,0,0.65)" fontFamily="Georgia, serif" letterSpacing="1">
                SIG
              </text>

              {/* Armature slit — the curved slot in the dial face, tight against the arc */}
              <path d={arcPath(CX, CY, R_SLIT, S_START - 1, S_START + S_SPAN + 1, 1)}
                fill="none" stroke="rgba(0,0,0,0.80)" strokeWidth="5" strokeLinecap="butt" />
              <path d={arcPath(CX, CY, R_SLIT, S_START - 1, S_START + S_SPAN + 1, 1)}
                fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="9" strokeLinecap="butt" />
              <path d={arcPath(CX, CY, R_SLIT, S_START, S_START + S_SPAN, 1)}
                fill="none" stroke="rgba(180,130,50,0.10)" strokeWidth="1.2" strokeLinecap="butt" />

              {/* Needle tip — only the portion that emerges through the slit; origin is hidden */}
              <line
                x1={needleBase.x} y1={needleBase.y}
                x2={needleTip.x}  y2={needleTip.y}
                stroke="#cc1111" strokeWidth="2.5" strokeLinecap="round"
              />
            </g>
          );
        })()}

        {/* ── Station dots (filtered by dial mode, color-coded by type) ── */}
        {getVisibleDots(stations, dialMode).map((s) => {
          const a = freqToAngle(s.frequency);
          const p = polar(CX, CY, R_DOT, a);
          const { fill, opacity } = DOT_COLORS[s.type] ?? DOT_COLORS.genre;
          return (
            <circle key={s.id}
              cx={p.x} cy={p.y} r="3.5"
              fill={fill} opacity={opacity}
            />
          );
        })}

        {/* ── Needle ── */}
        <g filter="url(#needleShadow)">
          {/* Counter-weight stub */}
          <line
            x1={CX} y1={CY} x2={tail.x} y2={tail.y}
            stroke="#990000" strokeWidth="6" strokeLinecap="round"
          />
          {/* Main needle */}
          <line
            x1={CX} y1={CY} x2={tip.x} y2={tip.y}
            stroke="#CC1111" strokeWidth="2.2" strokeLinecap="round"
          />
        </g>

        {/* ── Centre pivot cap ── */}
        <circle cx={CX} cy={CY} r="8"  fill="#c9a84c" />
        <circle cx={CX} cy={CY} r="5"  fill="#8b6014" />
        <circle cx={CX} cy={CY} r="2"  fill="#c9a84c" />

        {/* ── Glass dome overlay ── */}
        <circle cx={CX} cy={CY} r={R_FACE} fill="url(#glassDome)" />

        {/* ── Bezel inner shadow ring ── */}
        <circle cx={CX} cy={CY} r={R_FACE}
          fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="4"
        />
      </svg>

    </div>
  );
}

import { useKnob } from '../../hooks/useKnob.js';
import styles from './Knob.module.css';

// A single rotary knob.
// value: 0-1 for continuous knobs (maps to -135° to +135° rotation)
// For toggle knobs, value should be 0 or 1.
// onDelta: called with normalized delta per pointer move (-1 to +1 per revolution)
// onClick: optional click handler (used for skip knob)
export function Knob({ label, value = 0.5, onDelta, onClick, icon, active = false }) {
  const { onPointerDown, onPointerMove, onPointerUp } = useKnob(onDelta ?? (() => {}));

  // Map 0-1 to -135° to +135°
  const rotation = -135 + value * 270;

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.knob} ${active ? styles.active : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        role="slider"
        aria-label={label}
        aria-valuenow={Math.round(value * 100)}
        tabIndex={0}
      >
        <div
          className={styles.indicator}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

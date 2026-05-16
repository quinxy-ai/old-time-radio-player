import { useKnob } from '../../hooks/useKnob.js';
import styles from './Knob.module.css';

// size: actual pixel diameter of the knob circle (default 58)
// Indicator transformOrigin is derived from size so it always pivots from the knob centre.
export function Knob({ label, value = 0.5, onDelta, onClick, icon, active = false, size = 58 }) {
  const { onPointerDown, onPointerMove, onPointerUp } = useKnob(onDelta ?? (() => {}));

  const rotation = -135 + value * 270;
  // Indicator dot sits 8px from top; pivot = distance from dot to knob centre
  const pivotY = size / 2 - 8;

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.knob} ${active ? styles.active : ''}`}
        style={{ width: size, height: size }}
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
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `2.5px ${pivotY}px` }}
        />
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

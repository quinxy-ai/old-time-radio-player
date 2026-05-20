import { useRef, useState } from 'react';
import styles from './Tooltip.module.css';

const DELAY_MS = 2000;

/**
 * Wraps any element and shows a tooltip bubble after DELAY_MS of hover.
 *
 * Pass `className` to merge the wrapper's styles with the existing container
 * class — the wrapper renders a single <div> so it can act as a grid/flex
 * item with position:relative for absolute-positioned bubble placement.
 */
export function Tooltip({ text, enabled = true, className = '', children }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  function handleMouseEnter() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), DELAY_MS);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <div
      className={`${styles.wrapper}${className ? ` ${className}` : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {enabled && visible && (
        <div className={styles.bubble} role="tooltip">{text}</div>
      )}
    </div>
  );
}

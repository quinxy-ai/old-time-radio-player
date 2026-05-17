import { useEffect, useRef, useState } from 'react';
import styles from './NixieDisplay.module.css';

const SCROLL_INTERVAL_MS = 200;
const VISIBLE_CHARS = 18;

export function NixieDisplay({ line1 = '', line2 = '', rightLabel = '' }) {
  const [offset1, setOffset1] = useState(0);
  const [offset2, setOffset2] = useState(0);
  const timer1 = useRef(null);
  const timer2 = useRef(null);

  // How many chars are available for the scrolling line2 text
  const line2Cols = rightLabel ? VISIBLE_CHARS - rightLabel.length - 1 : VISIBLE_CHARS;

  useEffect(() => {
    setOffset1(0);
    clearInterval(timer1.current);
    if (line1.length > VISIBLE_CHARS) {
      const padded = line1 + '   ';
      timer1.current = setInterval(() => {
        setOffset1((o) => (o + 1) % padded.length);
      }, SCROLL_INTERVAL_MS);
    }
    return () => clearInterval(timer1.current);
  }, [line1]);

  useEffect(() => {
    setOffset2(0);
    clearInterval(timer2.current);
    if (line2.length > line2Cols) {
      const padded = line2 + '   ';
      timer2.current = setInterval(() => {
        setOffset2((o) => (o + 1) % padded.length);
      }, SCROLL_INTERVAL_MS);
    }
    return () => clearInterval(timer2.current);
  }, [line2, line2Cols]);

  function getVisible(text, offset, cols) {
    if (!text) return ' '.repeat(cols);
    if (text.length <= cols) return text.padEnd(cols, ' ');
    const padded = text + '   ';
    const doubled = padded + padded;
    return doubled.slice(offset, offset + cols).padEnd(cols, ' ');
  }

  const line2Visible = getVisible(line2, offset2, line2Cols);

  return (
    <div className={styles.panel} aria-label={`${line1} — ${line2}`}>
      <div className={styles.screen}>
        <div className={styles.scanlines} aria-hidden="true" />
        <div className={styles.textRow} aria-hidden="true">
          {getVisible(line1, offset1, VISIBLE_CHARS).split('').map((ch, i) => (
            <span key={i} className={styles.char}>{ch}</span>
          ))}
        </div>
        <div className={styles.textRow} aria-hidden="true">
          {line2Visible.split('').map((ch, i) => (
            <span key={i} className={`${styles.char} ${styles.charDim}`}>{ch}</span>
          ))}
          {rightLabel && (
            <>
              <span className={`${styles.char} ${styles.charDim}`}>{' '}</span>
              {rightLabel.split('').map((ch, i) => (
                <span key={`sl-${i}`} className={`${styles.char} ${styles.charSleep}`}>{ch}</span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

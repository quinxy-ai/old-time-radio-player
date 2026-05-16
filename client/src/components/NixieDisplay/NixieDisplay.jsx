import { useEffect, useRef, useState } from 'react';
import styles from './NixieDisplay.module.css';

const SCROLL_INTERVAL_MS = 200;
const VISIBLE_CHARS = 18;

export function NixieDisplay({ line1 = '', line2 = '' }) {
  const [offset1, setOffset1] = useState(0);
  const [offset2, setOffset2] = useState(0);
  const timer1 = useRef(null);
  const timer2 = useRef(null);

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
    if (line2.length > VISIBLE_CHARS) {
      const padded = line2 + '   ';
      timer2.current = setInterval(() => {
        setOffset2((o) => (o + 1) % padded.length);
      }, SCROLL_INTERVAL_MS);
    }
    return () => clearInterval(timer2.current);
  }, [line2]);

  function getVisible(text, offset) {
    if (!text) return ' '.repeat(VISIBLE_CHARS);
    if (text.length <= VISIBLE_CHARS) return text.padEnd(VISIBLE_CHARS, ' ');
    const padded = text + '   ';
    const doubled = padded + padded;
    return doubled.slice(offset, offset + VISIBLE_CHARS).padEnd(VISIBLE_CHARS, ' ');
  }

  return (
    <div className={styles.panel} aria-label={`${line1} — ${line2}`}>
      <div className={styles.screen}>
        <div className={styles.scanlines} aria-hidden="true" />
        <div className={styles.textRow} aria-hidden="true">
          {getVisible(line1, offset1).split('').map((ch, i) => (
            <span key={i} className={styles.char}>{ch}</span>
          ))}
        </div>
        <div className={styles.textRow} aria-hidden="true">
          {getVisible(line2, offset2).split('').map((ch, i) => (
            <span key={i} className={`${styles.char} ${styles.charDim}`}>{ch}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

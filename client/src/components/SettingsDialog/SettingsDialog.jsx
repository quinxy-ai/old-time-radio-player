import styles from './SettingsDialog.module.css';

const SENSITIVITY_OPTIONS = [
  { value: 'slow',   label: 'SLOW' },
  { value: 'normal', label: 'NORMAL' },
  { value: 'fast',   label: 'FAST' },
];

const SLEEP_OPTIONS = [15, 30, 45, 60];

export function SettingsDialog({ settings, onUpdate, onClose }) {
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="Settings">
      <div className={styles.panel}>
        <div className={styles.titleBar}>
          <span className={styles.title}>SETTINGS</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className={styles.body}>
          {/* Dial Sensitivity */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>DIAL SENSITIVITY</legend>
            <div className={styles.btnGroup}>
              {SENSITIVITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.optBtn} ${settings.dialSensitivity === value ? styles.optBtnActive : ''}`}
                  onClick={() => onUpdate({ dialSensitivity: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Sleep Timer Duration */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>SLEEP TIMER (MIN)</legend>
            <div className={styles.btnGroup}>
              {SLEEP_OPTIONS.map((min) => (
                <button
                  key={min}
                  className={`${styles.optBtn} ${settings.sleepMinutes === min ? styles.optBtnActive : ''}`}
                  onClick={() => onUpdate({ sleepMinutes: min })}
                >
                  {min}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Buffering Static */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>BUFFERING STATIC</legend>
            <div className={styles.btnGroup}>
              <button
                className={`${styles.optBtn} ${settings.bufferingStatic ? styles.optBtnActive : ''}`}
                onClick={() => onUpdate({ bufferingStatic: true })}
              >
                ON
              </button>
              <button
                className={`${styles.optBtn} ${!settings.bufferingStatic ? styles.optBtnActive : ''}`}
                onClick={() => onUpdate({ bufferingStatic: false })}
              >
                OFF
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

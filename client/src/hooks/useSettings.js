import { useState, useCallback } from 'react';

const STORAGE_KEY = 'otr_settings';

const DEFAULTS = {
  dialSensitivity: 'normal', // 'slow' | 'normal' | 'fast'
  sleepMinutes:    30,        // 15 | 30 | 45 | 60
  bufferingStatic: true,      // keep static floor while stream buffers
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

// Dial sensitivity multipliers applied to the base TUNING_SENSITIVITY constants
export const SENSITIVITY_MULTIPLIER = {
  slow:   0.55,
  normal: 1.00,
  fast:   1.80,
};

export function useSettings() {
  const [settings, setSettings] = useState(load);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
